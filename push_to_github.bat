@echo off
chcp 65001 >nul
title Day code len GitHub
cd /d "c:\Users\SHL_HOA\Desktop\expense-tracker-app"
echo =======================================================
echo     DANG DAY CODE LEN GITHUB: nguyenphucvinhhien111-ai
echo =======================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo =======================================================
    echo   DA DAY CODE THANH CONG!
    echo   Bay gio hay F5 lai trang GitHub Actions tren trinh duyet
    echo   de xem tien trinh "Build Android APK".
    echo =======================================================
) else (
    echo [Loi] Chua day duoc code. Vui long kiem tra lai xac thuc GitHub.
)
pause
