package com.sothuchi.app;

import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILE_CHOOSER_REQUEST_CODE = 1001;

    public class AndroidBridge {
        Context context;

        AndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void shareFile(String fileName, String content) {
            runOnUiThread(() -> {
                try {
                    String mimeType = fileName.endsWith(".csv") ? "text/csv" : "application/json";

                    // 1. Lưu trực tiếp vào thư mục công khai Tải về (Downloads) của máy
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            ContentValues values = new ContentValues();
                            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                            Uri downloadUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                            if (downloadUri != null) {
                                try (OutputStream os = getContentResolver().openOutputStream(downloadUri)) {
                                    if (os != null) {
                                        os.write(content.getBytes(StandardCharsets.UTF_8));
                                    }
                                }
                            }
                        } else {
                            File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                            if (!downloadDir.exists()) downloadDir.mkdirs();
                            File publicFile = new File(downloadDir, fileName);
                            try (FileOutputStream fos = new FileOutputStream(publicFile)) {
                                fos.write(content.getBytes(StandardCharsets.UTF_8));
                            }
                            MediaScannerConnection.scanFile(context, new String[]{ publicFile.getAbsolutePath() }, null, null);
                        }
                        Toast.makeText(context, "✅ Đã lưu file vào mục Tải về (Download)!", Toast.LENGTH_SHORT).show();
                    } catch (Exception err) {
                        err.printStackTrace();
                    }

                    // 2. Đồng thời lưu vào cache riêng để mở bảng chia sẻ (Zalo, Drive, Gmail...)
                    File file = new File(getExternalFilesDir(null), fileName);
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        fos.write(content.getBytes(StandardCharsets.UTF_8));
                    }

                    Uri uri = FileProvider.getUriForFile(
                        context,
                        getApplicationContext().getPackageName() + ".provider",
                        file
                    );

                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType(mimeType);
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(intent, "Lưu hoặc chia sẻ file sao lưu"));
                } catch (Exception e) {
                    Toast.makeText(context, "Lỗi khi lưu file: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void sendBackupEmail(String email, String subject, String body, String fileName, String content) {
            runOnUiThread(() -> {
                try {
                    File file = new File(getExternalFilesDir(null), fileName);
                    FileOutputStream fos = new FileOutputStream(file);
                    fos.write(content.getBytes("UTF-8"));
                    fos.close();

                    Uri uri = FileProvider.getUriForFile(
                        context,
                        getApplicationContext().getPackageName() + ".provider",
                        file
                    );

                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("message/rfc822");
                    if (email != null && !email.trim().isEmpty()) {
                        intent.putExtra(Intent.EXTRA_EMAIL, new String[]{ email.trim() });
                    }
                    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
                    intent.putExtra(Intent.EXTRA_TEXT, body);
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    try {
                        startActivity(Intent.createChooser(intent, "Gửi sao lưu qua Email"));
                    } catch (ActivityNotFoundException ex) {
                        intent.setType("text/*");
                        startActivity(Intent.createChooser(intent, "Gửi sao lưu qua Email"));
                    }
                } catch (Exception e) {
                    Toast.makeText(context, "Lỗi khi mở Email: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setDisplayZoomControls(false);
        settings.setBuiltInZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        String ua = settings.getUserAgentString();
        if (ua != null) {
            settings.setUserAgentString(ua.replace("; wv", ""));
        }

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = null;
                if (fileChooserParams != null) {
                    try {
                        intent = fileChooserParams.createIntent();
                    } catch (Exception ignored) {}
                }
                if (intent == null) {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                }
                try {
                    startActivityForResult(Intent.createChooser(intent, "Chọn file sao lưu JSON"), FILE_CHOOSER_REQUEST_CODE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Không tìm thấy ứng dụng duyệt tệp", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{ data.getData() };
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
