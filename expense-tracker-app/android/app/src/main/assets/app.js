/**
 * SỔ THU CHI - LOGIC QUẢN LÝ TÀI CHÍNH CÁ NHÂN
 * Lưu trữ 100% trên LocalStorage, không qua server, bảo mật tuyệt đối.
 */

// Danh mục mặc định
const CATEGORIES = {
  expense: [
    { id: 'an-uong', name: 'Ăn uống', icon: '🍜', color: '#f59e0b' },
    { id: 'ca-phe', name: 'Cà phê & nước', icon: '☕', color: '#8b5cf6' },
    { id: 'di-cho', name: 'Đi chợ & đồ ăn', icon: '🛒', color: '#10b981' },
    { id: 'xang-xe', name: 'Xăng & đi lại', icon: '🛵', color: '#3b82f6' },
    { id: 'mua-sam', name: 'Mua sắm', icon: '🛍️', color: '#ec4899' },
    { id: 'nha-tro', name: 'Tiền trọ / Nhà', icon: '🏠', color: '#6366f1' },
    { id: 'hoa-don', name: 'Điện / Nước / Net', icon: '⚡', color: '#f97316' },
    { id: 'giai-tri', name: 'Giải trí', icon: '🎬', color: '#a855f7' },
    { id: 'suc-khoe', name: 'Thuốc men', icon: '💊', color: '#ef4444' },
    { id: 'chi-khac', name: 'Chi tiêu khác', icon: '📝', color: '#64748b' }
  ],
  income: [
    { id: 'luong', name: 'Tiền lương', icon: '💵', color: '#10b981' },
    { id: 'thuong', name: 'Thưởng & Tip', icon: '🎁', color: '#f59e0b' },
    { id: 'kinh-doanh', name: 'Bán hàng / KD', icon: '💼', color: '#3b82f6' },
    { id: 'duoc-tang', name: 'Được biếu / Tặng', icon: '🧧', color: '#ec4899' },
    { id: 'thu-no', name: 'Thu hồi nợ', icon: '🤝', color: '#8b5cf6' },
    { id: 'lai-dau-tu', name: 'Lãi & Tiết kiệm', icon: '📈', color: '#06b6d4' },
    { id: 'thu-khac', name: 'Thu nhập khác', icon: '✨', color: '#64748b' }
  ]
};

// State toàn cục
const State = {
  transactions: [],
  initialBalance: 0,
  currentYearMonth: '', // Format 'YYYY-MM'
  filterType: 'all',    // 'all' | 'expense' | 'income'
  searchQuery: '',
  isBalanceHidden: false,
  modalType: 'expense', // 'expense' | 'income'
  selectedCategory: null,
  activeView: 'view-home'
};

// =========================================================
// TIỆN ÍCH ĐỊNH DẠNG & THỜI GIAN
// =========================================================

function getNowDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNowYearMonth() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatCurrency(amount) {
  if (isNaN(amount)) amount = 0;
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

function parseFormattedNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function getDayOfWeekName(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[dateObj.getDay()] || '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 2400);
}

// =========================================================
// KHỞI TẠO VÀ LƯU TRỮ LOCALSTORAGE
// =========================================================

const STORAGE_KEY_TX = 'so_thu_chi_transactions_v1';
const STORAGE_KEY_INIT = 'so_thu_chi_initial_balance_v1';
const STORAGE_KEY_THEME = 'so_thu_chi_theme_v1';

function loadData() {
  try {
    const rawTx = localStorage.getItem(STORAGE_KEY_TX);
    const rawInit = localStorage.getItem(STORAGE_KEY_INIT);

    if (rawTx) {
      State.transactions = JSON.parse(rawTx);
    } else {
      // Dữ liệu mẫu khởi tạo ban đầu để người dùng dễ hình dung
      initSampleData();
    }

    if (rawInit !== null) {
      State.initialBalance = Number(rawInit) || 0;
    } else {
      State.initialBalance = 2000000; // Mặc định 2 triệu
    }
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu:', err);
    State.transactions = [];
    State.initialBalance = 0;
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(State.transactions));
    localStorage.setItem(STORAGE_KEY_INIT, String(State.initialBalance));
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu:', err);
  }
}

function initSampleData() {
  const today = getNowDateString();
  const ym = getNowYearMonth();
  
  State.transactions = [
    {
      id: 'tx_init_1',
      type: 'income',
      amount: 15000000,
      category: 'Tiền lương',
      categoryIcon: '💵',
      note: 'Nhận lương tháng',
      date: `${ym}-01`,
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'tx_init_2',
      type: 'expense',
      amount: 45000,
      category: 'Ăn uống',
      categoryIcon: '🍜',
      note: 'Ăn trưa bún bò',
      date: today,
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: 'tx_init_3',
      type: 'expense',
      amount: 30000,
      category: 'Cà phê & nước',
      categoryIcon: '☕',
      note: 'Cà phê sữa đá',
      date: today,
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'tx_init_4',
      type: 'expense',
      amount: 80000,
      category: 'Xăng & đi lại',
      categoryIcon: '🛵',
      note: 'Đổ xăng xe máy đầy bình',
      date: today,
      createdAt: Date.now() - 1800000
    }
  ];
  saveData();
}

// =========================================================
// RENDER CÁC THÀNH PHẦN CHÍNH
// =========================================================

function renderApp() {
  renderDateHeader();
  renderMonthSelector();
  renderBalanceCard();
  renderTransactionList();
  renderStatsView();
}

function renderDateHeader() {
  const now = new Date();
  const dayName = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][now.getDay()];
  const formattedDay = `${now.getDate()} thg ${now.getMonth() + 1}, ${now.getFullYear()}`;
  const el = document.getElementById('current-day-label');
  if (el) el.textContent = `${dayName}, ${formattedDay}`;
}

function renderMonthSelector() {
  const [yearStr, monthStr] = State.currentYearMonth.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthDisplayEl = document.getElementById('current-month-text');
  if (monthDisplayEl) {
    monthDisplayEl.textContent = `Tháng ${monthNum} / ${yearStr}`;
  }

  // Cập nhật nhãn trong phần thống kê
  const statsMonthEl = document.getElementById('stats-month-label');
  if (statsMonthEl) {
    statsMonthEl.textContent = `${monthNum}/${yearStr}`;
  }
}

function renderBalanceCard() {
  // Tính tổng số dư tất cả các tháng (Số dư ban đầu + Tổng tất cả Thu - Tổng tất cả Chi)
  let totalAllIncome = 0;
  let totalAllExpense = 0;

  State.transactions.forEach(tx => {
    if (tx.type === 'income') totalAllIncome += tx.amount;
    else if (tx.type === 'expense') totalAllExpense += tx.amount;
  });

  const overallBalance = State.initialBalance + totalAllIncome - totalAllExpense;

  // Tính thu chi riêng của tháng hiện tại được chọn
  let monthIncome = 0;
  let monthExpense = 0;

  State.transactions.forEach(tx => {
    if (tx.date.startsWith(State.currentYearMonth)) {
      if (tx.type === 'income') monthIncome += tx.amount;
      else if (tx.type === 'expense') monthExpense += tx.amount;
    }
  });

  const monthNet = monthIncome - monthExpense;

  // Cập nhật DOM
  const totalBalanceEl = document.getElementById('total-balance-display');
  const monthIncomeEl = document.getElementById('month-income-display');
  const monthExpenseEl = document.getElementById('month-expense-display');
  const monthNetEl = document.getElementById('month-net-display');

  if (State.isBalanceHidden) {
    totalBalanceEl.innerHTML = `•••••••• <span class="currency-symbol">₫</span>`;
    monthIncomeEl.textContent = `+ •••••• ₫`;
    monthExpenseEl.textContent = `- •••••• ₫`;
    monthNetEl.textContent = `•••••• ₫`;
  } else {
    totalBalanceEl.innerHTML = `${formatCurrency(overallBalance)} <span class="currency-symbol">₫</span>`;
    monthIncomeEl.textContent = `+ ${formatCurrency(monthIncome)} ₫`;
    monthExpenseEl.textContent = `- ${formatCurrency(monthExpense)} ₫`;

    if (monthNet >= 0) {
      monthNetEl.textContent = `+ ${formatCurrency(monthNet)} ₫`;
      monthNetEl.style.color = 'var(--income-green)';
    } else {
      monthNetEl.textContent = `- ${formatCurrency(Math.abs(monthNet))} ₫`;
      monthNetEl.style.color = 'var(--expense-red)';
    }
  }
}

function renderTransactionList() {
  const container = document.getElementById('tx-list-container');
  const badgeEl = document.getElementById('tx-count-badge');

  // Lọc giao dịch theo tháng được chọn
  let filtered = State.transactions.filter(tx => tx.date.startsWith(State.currentYearMonth));

  // Lọc theo loại (All / Expense / Income)
  if (State.filterType !== 'all') {
    filtered = filtered.filter(tx => tx.type === State.filterType);
  }

  // Lọc theo từ khóa tìm kiếm
  if (State.searchQuery.trim() !== '') {
    const q = State.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(tx => {
      return (tx.note && tx.note.toLowerCase().includes(q)) ||
             (tx.category && tx.category.toLowerCase().includes(q)) ||
             (String(tx.amount).includes(q));
    });
  }

  badgeEl.textContent = String(filtered.length);

  // Nếu không có giao dịch nào
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍃</span>
        <h4 class="empty-title">Chưa có giao dịch nào</h4>
        <p class="empty-desc">Bấm <strong>"+ Nhận Tiền"</strong> hoặc <strong>"- Chi Tiền"</strong> phía trên để ghi lại khoản thu chi đầu tiên nhé!</p>
      </div>
    `;
    return;
  }

  // Sắp xếp giảm dần theo ngày, nếu cùng ngày thì giảm dần theo createdAt
  filtered.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Nhóm theo ngày (YYYY-MM-DD)
  const groupedByDay = {};
  filtered.forEach(tx => {
    if (!groupedByDay[tx.date]) groupedByDay[tx.date] = [];
    groupedByDay[tx.date].push(tx);
  });

  const todayStr = getNowDateString();
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  let html = '';

  Object.keys(groupedByDay).forEach(dateStr => {
    const dayTransactions = groupedByDay[dateStr];

    // Tính tổng thu/chi trong ngày này
    let dayIncome = 0;
    let dayExpense = 0;
    dayTransactions.forEach(t => {
      if (t.type === 'income') dayIncome += t.amount;
      else dayExpense += t.amount;
    });

    let dayLabel = formatDateDisplay(dateStr);
    const dayOfWeek = getDayOfWeekName(dateStr);

    if (dateStr === todayStr) {
      dayLabel = `Hôm nay • ${dayOfWeek} (${formatDateDisplay(dateStr)})`;
    } else if (dateStr === yesterdayStr) {
      dayLabel = `Hôm qua • ${dayOfWeek} (${formatDateDisplay(dateStr)})`;
    } else {
      dayLabel = `${dayOfWeek} • ${formatDateDisplay(dateStr)}`;
    }

    // Hiển thị tóm tắt ngày
    let daySummaryText = '';
    if (dayExpense > 0 && dayIncome > 0) {
      daySummaryText = `<span class="green-text">+${formatCurrency(dayIncome)}</span> / <span class="red-text">-${formatCurrency(dayExpense)}</span>`;
    } else if (dayExpense > 0) {
      daySummaryText = `<span class="red-text">Chi: -${formatCurrency(dayExpense)} ₫</span>`;
    } else if (dayIncome > 0) {
      daySummaryText = `<span class="green-text">Thu: +${formatCurrency(dayIncome)} ₫</span>`;
    }

    html += `
      <div class="day-group">
        <div class="day-header">
          <span class="day-title">${dayLabel}</span>
          <span class="day-total">${daySummaryText}</span>
        </div>
        <div class="tx-items-list">
    `;

    dayTransactions.forEach(tx => {
      const isIncome = tx.type === 'income';
      const sign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'income' : 'expense';

      html += `
        <div class="tx-item" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-cat-icon">${tx.categoryIcon || (isIncome ? '💵' : '💸')}</div>
            <div class="tx-meta">
              <span class="tx-cat-name">${tx.category}</span>
              <span class="tx-note">${tx.note ? escapeHtml(tx.note) : (isIncome ? 'Khoản thu' : 'Khoản chi')}</span>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount ${amountClass}">${sign} ${formatCurrency(tx.amount)} ₫</span>
            <button class="tx-actions-btn btn-delete-tx" data-id="${tx.id}" title="Xóa giao dịch này" aria-label="Xóa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Gán sự kiện xóa cho từng giao dịch
  container.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      deleteTransaction(id);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function renderStatsView() {
  const monthTransactions = State.transactions.filter(tx => tx.date.startsWith(State.currentYearMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCat = {};

  monthTransactions.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (!expenseByCat[tx.category]) {
        expenseByCat[tx.category] = {
          name: tx.category,
          icon: tx.categoryIcon || '💸',
          amount: 0
        };
      }
      expenseByCat[tx.category].amount += tx.amount;
    }
  });

  document.getElementById('stats-total-expense').textContent = `${formatCurrency(totalExpense)} ₫`;
  document.getElementById('stats-total-income').textContent = `+${formatCurrency(totalIncome)} ₫`;

  // Tỷ lệ tiết kiệm = ((Thu - Chi) / Thu) * 100%
  let savingRate = 0;
  if (totalIncome > 0) {
    savingRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
  }
  const savingEl = document.getElementById('stats-saving-rate');
  savingEl.textContent = `${savingRate}%`;
  savingEl.style.color = savingRate >= 0 ? 'var(--income-green)' : 'var(--expense-red)';

  // Danh sách danh mục chi
  const catListEl = document.getElementById('stats-category-list');
  const categoriesArray = Object.values(expenseByCat);

  if (categoriesArray.length === 0) {
    catListEl.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px;">Tháng này bạn chưa có khoản chi nào.</p>`;
    return;
  }

  // Sắp xếp chi nhiều nhất lên đầu
  categoriesArray.sort((a, b) => b.amount - a.amount);

  const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#64748b'];

  let catHtml = '';
  categoriesArray.forEach((item, index) => {
    const pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
    const barColor = colors[index % colors.length];

    catHtml += `
      <div class="stat-cat-row">
        <div class="stat-cat-info">
          <span class="stat-cat-name">
            <span>${item.icon}</span>
            <span>${item.name}</span>
          </span>
          <div class="stat-cat-values">
            <span class="stat-cat-amount">${formatCurrency(item.amount)} ₫</span>
            <span class="stat-cat-pct">(${pct}%)</span>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width: ${pct}%; background-color: ${barColor};"></div>
        </div>
      </div>
    `;
  });

  catListEl.innerHTML = catHtml;
}

// =========================================================
// QUẢN LÝ GIAO DỊCH (THÊM / XÓA)
// =========================================================

function deleteTransaction(id) {
  const index = State.transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    const deleted = State.transactions[index];
    State.transactions.splice(index, 1);
    saveData();
    renderApp();
    showToast(`Đã xóa: ${deleted.category} (${formatCurrency(deleted.amount)} ₫)`);
  }
}

// =========================================================
// BOTTOM SHEET MODAL (NHẬP LIỆU)
// =========================================================

function openTransactionModal(defaultType = 'expense') {
  State.modalType = defaultType;
  
  const modal = document.getElementById('modal-tx');
  const backdrop = document.getElementById('modal-backdrop');
  const sheetTitle = document.getElementById('sheet-title');
  const submitBtn = document.getElementById('btn-save-tx');
  const submitText = document.getElementById('submit-btn-text');

  // Cập nhật giao diện toggle type
  updateModalTypeToggle(defaultType);

  // Đặt ngày mặc định là hôm nay
  document.getElementById('input-date').value = getNowDateString();
  document.getElementById('input-amount').value = '';
  document.getElementById('input-note').value = '';

  // Render lưới danh mục
  renderModalCategories();

  // Mở modal
  backdrop.classList.add('active');
  modal.classList.add('active');

  // Focus vào ô nhập số tiền sau khi trượt lên
  setTimeout(() => {
    document.getElementById('input-amount').focus();
  }, 250);
}

function closeTransactionModal() {
  document.getElementById('modal-tx').classList.remove('active');
  document.getElementById('modal-backdrop').classList.remove('active');
}

function updateModalTypeToggle(type) {
  State.modalType = type;
  const btnExpense = document.getElementById('btn-type-expense');
  const btnIncome = document.getElementById('btn-type-income');
  const submitBtn = document.getElementById('btn-save-tx');
  const submitText = document.getElementById('submit-btn-text');
  const sheetTitle = document.getElementById('sheet-title');

  if (type === 'income') {
    btnIncome.classList.add('active');
    btnExpense.classList.remove('active');
    submitBtn.className = 'btn-submit income-mode';
    submitText.textContent = 'Cộng Vào Thu Nhập (+)';
    sheetTitle.textContent = 'Ghi Nhận Tiền Vào';
  } else {
    btnExpense.classList.add('active');
    btnIncome.classList.remove('active');
    submitBtn.className = 'btn-submit expense-mode';
    submitText.textContent = 'Lưu Khoản Chi Tiêu (-)';
    sheetTitle.textContent = 'Ghi Khoản Chi Tiêu';
  }

  renderModalCategories();
}

function renderModalCategories() {
  const grid = document.getElementById('categories-grid');
  const list = CATEGORIES[State.modalType] || [];
  
  // Mặc định chọn danh mục đầu tiên
  State.selectedCategory = list[0] || null;

  let html = '';
  list.forEach((cat, idx) => {
    const isSelected = idx === 0;
    html += `
      <button type="button" class="cat-item-btn ${isSelected ? 'selected' : ''}" data-cat-id="${cat.id}">
        <span class="cat-item-icon">${cat.icon}</span>
        <span class="cat-item-name">${cat.name}</span>
      </button>
    `;
  });

  grid.innerHTML = html;

  // Bắt sự kiện chọn danh mục
  grid.querySelectorAll('.cat-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-item-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const catId = btn.dataset.catId;
      State.selectedCategory = list.find(c => c.id === catId);
    });
  });
}

function handleSaveTransaction() {
  const amountStr = document.getElementById('input-amount').value;
  const amount = parseFormattedNumber(amountStr);

  if (amount <= 0) {
    showToast('⚠️ Vui lòng nhập số tiền lớn hơn 0');
    document.getElementById('input-amount').focus();
    return;
  }

  if (!State.selectedCategory) {
    showToast('⚠️ Vui lòng chọn một danh mục');
    return;
  }

  const dateVal = document.getElementById('input-date').value || getNowDateString();
  const noteVal = document.getElementById('input-note').value.trim();

  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: State.modalType,
    amount: amount,
    category: State.selectedCategory.name,
    categoryIcon: State.selectedCategory.icon,
    note: noteVal,
    date: dateVal,
    createdAt: Date.now()
  };

  State.transactions.unshift(newTx);
  saveData();

  // Nếu giao dịch được thêm ở tháng khác tháng đang xem, tự động nhảy sang tháng đó để xem
  const txYearMonth = dateVal.substring(0, 7);
  if (txYearMonth !== State.currentYearMonth) {
    State.currentYearMonth = txYearMonth;
  }

  closeTransactionModal();
  renderApp();

  const actionText = State.modalType === 'income' ? 'Đã cộng thu nhập' : 'Đã ghi chi tiêu';
  showToast(`✅ ${actionText} ${formatCurrency(amount)} ₫`);
}

// =========================================================
// THIẾT LẬP SỰ KIỆN TƯƠNG TÁC
// =========================================================

function setupEventListeners() {
  // Chuyển tab phía dưới (Home / Stats / Settings)
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (!targetView) return;

      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
      document.getElementById(targetView).classList.add('active');
      State.activeView = targetView;

      if (targetView === 'view-stats') {
        renderStatsView();
      }
    });
  });

  // Nút Thêm ở giữa (+ FAB)
  document.getElementById('btn-fab-add').addEventListener('click', () => {
    openTransactionModal('expense');
  });

  // Nút nhanh: + Nhận Tiền
  document.getElementById('btn-quick-income').addEventListener('click', () => {
    openTransactionModal('income');
  });

  // Nút nhanh: - Chi Tiền
  document.getElementById('btn-quick-expense').addEventListener('click', () => {
    openTransactionModal('expense');
  });

  // Đóng modal
  document.getElementById('modal-close-btn').addEventListener('click', closeTransactionModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeTransactionModal);

  // Chuyển loại trong modal (Thu / Chi)
  document.getElementById('btn-type-expense').addEventListener('click', () => {
    updateModalTypeToggle('expense');
  });
  document.getElementById('btn-type-income').addEventListener('click', () => {
    updateModalTypeToggle('income');
  });

  // Lưu giao dịch
  document.getElementById('btn-save-tx').addEventListener('click', handleSaveTransaction);

  // Định dạng tự động ô nhập tiền
  const amountInput = document.getElementById('input-amount');
  amountInput.addEventListener('input', (e) => {
    const raw = parseFormattedNumber(e.target.value);
    if (raw === 0) {
      e.target.value = '';
    } else {
      e.target.value = formatCurrency(raw);
    }
  });

  // Phím bấm số tiền nhanh (+10k, +50k, +100k, ...)
  document.querySelectorAll('.quick-amt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'btn-clear-amount') {
        amountInput.value = '';
        return;
      }
      const addValue = parseInt(btn.dataset.add, 10) || 0;
      const current = parseFormattedNumber(amountInput.value);
      const next = current + addValue;
      amountInput.value = formatCurrency(next);
    });
  });

  // Điều hướng tháng: Tháng trước <
  document.getElementById('prev-month-btn').addEventListener('click', () => {
    changeMonth(-1);
  });

  // Điều hướng tháng: Tháng sau >
  document.getElementById('next-month-btn').addEventListener('click', () => {
    changeMonth(1);
  });

  // Nút Hôm nay
  document.getElementById('today-chip-btn').addEventListener('click', () => {
    State.currentYearMonth = getNowYearMonth();
    renderApp();
    showToast('Đã về tháng hiện tại');
  });

  // Bộ lọc nhanh (Tất cả / Chi / Thu)
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      State.filterType = pill.dataset.filter;
      renderTransactionList();
    });
  });

  // Tìm kiếm giao dịch
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  searchInput.addEventListener('input', (e) => {
    State.searchQuery = e.target.value;
    clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
    renderTransactionList();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    State.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTransactionList();
  });

  // Ẩn / Hiện số dư (Eye toggle)
  document.getElementById('btn-toggle-balance-privacy').addEventListener('click', () => {
    State.isBalanceHidden = !State.isBalanceHidden;
    const eyeIcon = document.getElementById('balance-eye-icon');
    eyeIcon.textContent = State.isBalanceHidden ? '🙈' : '👁️';
    renderBalanceCard();
  });

  // Đổi giao diện Sáng / Tối
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  // Khôi phục theme đã lưu
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    themeIcon.textContent = '☀️';
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-light')) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      themeIcon.textContent = '🌙';
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
      showToast('Đã bật giao diện tối 🌙');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      themeIcon.textContent = '☀️';
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
      showToast('Đã bật giao diện sáng ☀️');
    }
  });

  // Nút chỉnh số dư ban đầu
  document.getElementById('btn-set-initial-balance').addEventListener('click', () => {
    const dialog = document.getElementById('dialog-balance-backdrop');
    const input = document.getElementById('input-init-balance');
    input.value = State.initialBalance > 0 ? formatCurrency(State.initialBalance) : '';
    dialog.style.display = 'flex';
  });

  document.getElementById('btn-cancel-init-balance').addEventListener('click', () => {
    document.getElementById('dialog-balance-backdrop').style.display = 'none';
  });

  document.getElementById('input-init-balance').addEventListener('input', (e) => {
    const raw = parseFormattedNumber(e.target.value);
    e.target.value = raw > 0 ? formatCurrency(raw) : '';
  });

  document.getElementById('btn-confirm-init-balance').addEventListener('click', () => {
    const raw = parseFormattedNumber(document.getElementById('input-init-balance').value);
    State.initialBalance = raw;
    saveData();
    document.getElementById('dialog-balance-backdrop').style.display = 'none';
    renderBalanceCard();
    showToast(`Đã cập nhật số dư ban đầu: ${formatCurrency(raw)} ₫`);
  });

  // Xuất file sao lưu (JSON)
  document.getElementById('btn-export-json').addEventListener('click', exportBackupJson);
  document.getElementById('btn-export-quick').addEventListener('click', exportBackupJson);

  // Xuất file Excel (CSV)
  document.getElementById('btn-export-csv').addEventListener('click', exportCsv);

  // Khôi phục từ JSON
  const fileInput = document.getElementById('file-import-input');
  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', handleImportJson);

  // Xóa toàn bộ dữ liệu
  document.getElementById('btn-reset-all').addEventListener('click', () => {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu thu chi không? Dữ liệu đã xóa sẽ không thể phục hồi trừ khi bạn đã sao lưu!')) {
      State.transactions = [];
      State.initialBalance = 0;
      saveData();
      renderApp();
      showToast('Đã xóa toàn bộ dữ liệu!');
    }
  });

  // Cài đặt PWA
  setupPwaInstall();
}

function changeMonth(delta) {
  const [yearStr, monthStr] = State.currentYearMonth.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) + delta;

  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }

  State.currentYearMonth = `${y}-${String(m).padStart(2, '0')}`;
  renderApp();
}

// =========================================================
// SAO LƯU & KHÔI PHỤC DỮ LIỆU
// =========================================================

function exportBackupJson() {
  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    initialBalance: State.initialBalance,
    transactions: State.transactions
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const fileName = `so-thu-chi-backup-${getNowDateString()}.json`;

  if (window.AndroidBridge && window.AndroidBridge.shareFile) {
    window.AndroidBridge.shareFile(fileName, jsonStr);
    return;
  }

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Đã tải file sao lưu JSON về máy!');
}

function exportCsv() {
  if (State.transactions.length === 0) {
    showToast('Chưa có dữ liệu để xuất file!');
    return;
  }

  // BOM UTF-8 để mở tiếng Việt trên Microsoft Excel không bị lỗi font
  let csvContent = '\uFEFF';
  csvContent += 'Ngày,Loại,Danh mục,Số tiền (VNĐ),Ghi chú\n';

  State.transactions.forEach(t => {
    const typeLabel = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const amountVal = t.type === 'income' ? t.amount : -t.amount;
    const noteClean = (t.note || '').replace(/"/g, '""');
    csvContent += `"${t.date}","${typeLabel}","${t.category}","${amountVal}","${noteClean}"\n`;
  });

  const fileName = `so-thu-chi-${getNowDateString()}.csv`;

  if (window.AndroidBridge && window.AndroidBridge.shareFile) {
    window.AndroidBridge.shareFile(fileName, csvContent);
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📊 Đã xuất file Excel (CSV) thành công!');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data.transactions)) {
        State.transactions = data.transactions;
        if (typeof data.initialBalance === 'number') {
          State.initialBalance = data.initialBalance;
        }
        saveData();
        renderApp();
        showToast('✅ Khôi phục dữ liệu từ file thành công!');
      } else {
        showToast('❌ File không đúng định dạng sao lưu!');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi khi đọc file sao lưu!');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// =========================================================
// PWA & SERVICE WORKER
// =========================================================

let deferredPrompt = null;

function setupPwaInstall() {
  const banner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('btn-install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner) banner.style.display = 'flex';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('🎉 Đang cài đặt ứng dụng vào màn hình chính!');
        }
        deferredPrompt = null;
        if (banner) banner.style.display = 'none';
      } else {
        alert('Để cài đặt:\n- Trên iPhone (Safari): Bấm nút Chia sẻ (biểu tượng hình vuông có mũi tên lên) -> Chọn "Thêm vào màn hình chính".\n- Trên Android (Chrome): Bấm menu 3 chấm góc phải -> Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
      }
    });
  }

  // Đăng ký Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    });
  }
}

// =========================================================
// KHỞI ĐỘNG ỨNG DỤNG
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  State.currentYearMonth = getNowYearMonth();
  loadData();
  setupEventListeners();
  renderApp();
});
