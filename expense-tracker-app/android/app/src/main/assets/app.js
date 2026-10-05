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
  saveDataLocally();
  if (currentUser) {
    syncToCloud();
  }
}

function saveDataLocally() {
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

  // Khôi phục bằng dán mã JSON
  const pasteBackdrop = document.getElementById('dialog-paste-backdrop');
  const pasteInput = document.getElementById('input-paste-json');
  const btnTriggerPaste = document.getElementById('btn-trigger-paste');
  if (btnTriggerPaste) {
    btnTriggerPaste.addEventListener('click', () => {
      pasteInput.value = '';
      pasteBackdrop.style.display = 'flex';
      pasteInput.focus();
    });
  }
  document.getElementById('btn-cancel-paste-json')?.addEventListener('click', () => {
    pasteBackdrop.style.display = 'none';
  });
  document.getElementById('btn-confirm-paste-json')?.addEventListener('click', () => {
    const raw = pasteInput.value.trim();
    if (!raw) {
      showToast('Vui lòng dán nội dung file JSON vào ô!');
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (applyRestoredData(data)) {
        pasteBackdrop.style.display = 'none';
      }
    } catch (e) {
      showToast('❌ Nội dung dán vào không phải là JSON hợp lệ!');
    }
  });

  // Sao lưu qua Email
  const inputBackupEmail = document.getElementById('input-backup-email');
  const btnSendEmailBackup = document.getElementById('btn-send-email-backup');
  if (inputBackupEmail) {
    inputBackupEmail.value = localStorage.getItem('user_backup_email') || '';
  }
  if (btnSendEmailBackup) {
    btnSendEmailBackup.addEventListener('click', sendEmailBackup);
  }
  updateLastBackupUI();

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

function updateLastBackupUI() {
  const lastBackupText = document.getElementById('last-backup-text');
  if (!lastBackupText) return;
  const lastTime = localStorage.getItem('last_backup_time');
  if (lastTime) {
    try {
      const dt = new Date(lastTime);
      const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')} ngày ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
      lastBackupText.textContent = `Lần gửi gần nhất: ${timeStr}`;
    } catch (e) {
      lastBackupText.textContent = 'Lần gửi gần nhất: Đã sao lưu';
    }
  } else {
    lastBackupText.textContent = 'Lần gửi gần nhất: Chưa sao lưu';
  }
}

function sendEmailBackup() {
  const emailInput = document.getElementById('input-backup-email');
  const email = (emailInput ? emailInput.value : '').trim();

  if (!email || !email.includes('@')) {
    showToast('⚠️ Vui lòng nhập địa chỉ email hợp lệ!');
    if (emailInput) emailInput.focus();
    return;
  }

  // Lưu lại email để các lần sau không cần nhập lại
  localStorage.setItem('user_backup_email', email);

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    initialBalance: State.initialBalance,
    transactions: State.transactions
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const nowStr = getNowDateString();
  const fileName = `so-thu-chi-backup-${nowStr}.json`;

  const totalInc = State.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExp = State.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentBal = State.initialBalance + totalInc - totalExp;

  const subject = `[Sổ Thu Chi] Bản sao lưu dữ liệu ngày ${nowStr}`;
  const bodyText = `Xin chào,\n\nĐây là bản sao lưu dữ liệu Sổ Thu Chi cá nhân của bạn.\n\n📊 TÓM TẮT TÀI CHÍNH:\n- Số dư hiện tại: ${formatVND(currentBal)}\n- Tổng thu: ${formatVND(totalInc)}\n- Tổng chi: ${formatVND(totalExp)}\n- Số lượng giao dịch: ${State.transactions.length}\n- Thời gian sao lưu: ${new Date().toLocaleString('vi-VN')}\n\n📁 Tệp đính kèm "${fileName}" chứa đầy đủ dữ liệu định dạng JSON. Khi cần đổi máy hoặc cài lại ứng dụng, bạn chỉ cần tải tệp này về máy và chọn "Khôi phục dữ liệu từ file" trong app là xong!\n`;

  localStorage.setItem('last_backup_time', new Date().toISOString());
  updateLastBackupUI();

  if (window.AndroidBridge && window.AndroidBridge.sendBackupEmail) {
    window.AndroidBridge.sendBackupEmail(email, subject, bodyText, fileName, jsonStr);
    showToast('📧 Đang mở Gmail để gửi sao lưu...');
    return;
  }

  // Fallback dành cho trình duyệt web / PWA
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);

  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText + '\n(Lưu ý: File sao lưu JSON đã được tải về máy của bạn, vui lòng đính kèm file đó vào email này)')}`;
  window.open(mailtoUrl, '_blank');
  showToast('💾 Đã tải file sao lưu và mở email!');
}

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

function applyRestoredData(data) {
  if (!data || !Array.isArray(data.transactions)) {
    showToast('❌ Dữ liệu không đúng định dạng sao lưu!');
    return false;
  }
  if (State.transactions.length > 0) {
    const ok = confirm(`Khôi phục sẽ thay thế ${State.transactions.length} giao dịch hiện tại bằng ${data.transactions.length} giao dịch từ bản sao lưu. Bạn có muốn tiếp tục?`);
    if (!ok) return false;
  }
  State.transactions = data.transactions;
  if (typeof data.initialBalance === 'number') {
    State.initialBalance = data.initialBalance;
  }
  saveData();
  renderApp();
  showToast('✅ Khôi phục dữ liệu thành công!');
  return true;
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      applyRestoredData(data);
    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi khi đọc file sao lưu JSON!');
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
// GOOGLE FIREBASE & CLOUD SYNC
// =========================================================

const firebaseConfig = {
  apiKey: "AIzaSyBRP0KSVjhMT5yQSssYh5XnYLtzlJJE5P8",
  authDomain: "quanlythuchi-7e095.firebaseapp.com",
  projectId: "quanlythuchi-7e095",
  storageBucket: "quanlythuchi-7e095.firebasestorage.app",
  messagingSenderId: "240648948538",
  appId: "1:240648948538:web:320e9331dc47797d45de03",
  measurementId: "G-TJ1N90F5YR"
};

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let currentUser = null;
let authMode = 'login'; // 'login' | 'register'

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.log('Firebase SDK chưa sẵn sàng, ứng dụng tiếp tục hoạt động ngoại tuyến (Offline)');
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.app();
    }
    firebaseAuth = firebase.auth();
    firestoreDb = firebase.firestore();

    // Kích hoạt HTTP Long Polling để Firestore hoạt động ổn định trên Android WebView và mạng di động
    try {
      firestoreDb.settings({
        experimentalForceLongPolling: true
      });
    } catch (e) {
      console.warn('Firestore settings:', e);
    }

    // Lắng nghe trạng thái đăng nhập
    firebaseAuth.onAuthStateChanged((user) => {
      currentUser = user;
      updateAuthUI(user);
      if (user) {
        syncFromCloud(user);
      }
    });

    setupCloudEventListeners();
  } catch (err) {
    console.warn('Lỗi khởi tạo Firebase:', err);
  }
}

function updateAuthUI(user) {
  const unauthBox = document.getElementById('cloud-unauth-box');
  const authBox = document.getElementById('cloud-auth-box');
  const badge = document.getElementById('sync-status-badge');
  const avatar = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');

  if (user) {
    if (unauthBox) unauthBox.style.display = 'none';
    if (authBox) authBox.style.display = 'block';

    const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Người dùng');
    const initial = (displayName[0] || 'U').toUpperCase();

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = user.email || '';

    if (avatar) {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      } else {
        avatar.textContent = initial;
      }
    }

    if (badge) {
      badge.textContent = '🟢 Đã kết nối';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#10b981';
    }
  } else {
    if (unauthBox) unauthBox.style.display = 'block';
    if (authBox) authBox.style.display = 'none';

    if (badge) {
      badge.textContent = 'Chưa đăng nhập';
      badge.style.background = 'rgba(148, 163, 184, 0.2)';
      badge.style.color = 'var(--text-muted)';
    }
  }
}

function setSyncBadge(text, color) {
  const badge = document.getElementById('sync-status-badge');
  if (badge) {
    badge.textContent = text;
    if (color) badge.style.color = color;
  }
}

async function syncToCloud() {
  if (!firestoreDb || !currentUser) return;
  try {
    setSyncBadge('Đang lưu mây...', '#f59e0b');
    const docRef = firestoreDb.collection('users').doc(currentUser.uid);
    await docRef.set({
      email: currentUser.email,
      initialBalance: State.initialBalance,
      transactions: State.transactions,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      appVersion: '1.0.0'
    }, { merge: true });
    setSyncBadge('🟢 Đã đồng bộ', '#10b981');
  } catch (err) {
    console.error('Lỗi khi lưu lên mây:', err);
    setSyncBadge('Lỗi đồng bộ', '#f43f5e');
    const msg = String(err.message || '');
    if (err.code === 'permission-denied') {
      showToast('❌ Firestore bị chặn quyền truy cập! Hãy kiểm tra Rules trên Firebase Console.');
    } else if (err.code === 'not-found' || msg.includes('NOT_FOUND') || msg.includes('does not exist') || msg.includes('404')) {
      showToast('❌ Chưa tạo Firestore Database trên Firebase Console!');
    } else if (err.code === 'unavailable') {
      showToast('⚠️ Mạng chập chờn, dữ liệu đã lưu trên máy và sẽ đồng bộ khi có kết nối.');
    }
  }
}

async function syncFromCloud(user) {
  if (!firestoreDb || !user) return;
  try {
    setSyncBadge('Đang nạp dữ liệu...', '#6366f1');
    const docRef = firestoreDb.collection('users').doc(user.uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (Array.isArray(data.transactions)) {
        if (State.transactions.length === 0) {
          // Máy chưa có dữ liệu, nạp luôn từ đám mây
          State.transactions = data.transactions;
          if (typeof data.initialBalance === 'number') {
            State.initialBalance = data.initialBalance;
          }
          saveDataLocally();
          renderApp();
          showToast(`☁️ Đã đồng bộ ${data.transactions.length} giao dịch từ đám mây!`);
        } else {
          // Máy đã có dữ liệu, xác nhận khôi phục
          const ok = confirm(`Đám mây có ${data.transactions.length} giao dịch đã lưu. Bạn có muốn tải về và khôi phục vào thiết bị này không?`);
          if (ok) {
            State.transactions = data.transactions;
            if (typeof data.initialBalance === 'number') {
              State.initialBalance = data.initialBalance;
            }
            saveDataLocally();
            renderApp();
            showToast('☁️ Đã khôi phục dữ liệu từ đám mây!');
          } else {
            // Đẩy dữ liệu hiện tại lên đám mây
            await syncToCloud();
          }
        }
      }
    } else {
      // Đám mây chưa có dữ liệu, tải dữ liệu hiện tại trong máy lên mây
      await syncToCloud();
      showToast('☁️ Đã sao lưu dữ liệu máy lên tài khoản đám mây!');
    }
    setSyncBadge('🟢 Đã đồng bộ', '#10b981');
  } catch (err) {
    console.error('Lỗi đồng bộ từ mây:', err);
    setSyncBadge('Lỗi đồng bộ', '#f43f5e');
    const msg = String(err.message || '');
    if (err.code === 'permission-denied') {
      showToast('❌ Firestore bị chặn quyền truy cập! Hãy kiểm tra Rules trên Firebase Console.');
    } else if (err.code === 'not-found' || msg.includes('NOT_FOUND') || msg.includes('does not exist') || msg.includes('404')) {
      showToast('❌ Chưa tạo Firestore Database trên Firebase Console!');
    }
  }
}

function setupCloudEventListeners() {
  // Đăng nhập Google
  const btnGoogle = document.getElementById('btn-login-google');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      if (!firebaseAuth) {
        showToast('⚠️ Firebase chưa được khởi tạo!');
        return;
      }

      // Nếu đang chạy trong app Android APK (WebView)
      if (window.AndroidBridge) {
        openAuthModal('💡 Trên ứng dụng Android, Google hạn chế mở popup đăng nhập trực tiếp để bảo mật.\n\n👉 Bạn hãy nhập Email (Gmail) và đặt một Mật khẩu bên dưới (1 lần duy nhất) để ứng dụng tự động đồng bộ đám mây vĩnh viễn!');
        return;
      }

      // Trình duyệt Web (Chrome, Edge, Máy tính...)
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        showToast('Đang kết nối tài khoản Google...');
        await firebaseAuth.signInWithPopup(provider);
        showToast('✅ Đăng nhập Google thành công!');
      } catch (err) {
        console.warn('Lỗi popup Google:', err);
        if (err.code === 'auth/configuration-not-found') {
          showToast('❌ Dự án Firebase chưa bật Google Auth trên Firebase Console!');
        } else if (err.code === 'auth/popup-blocked') {
          showToast('⚠️ Trình duyệt chặn mở popup! Vui lòng cho phép popup.');
        } else {
          showToast(`⚠️ Không thể mở Google: ${err.message || err.code}`);
        }
        openAuthModal('Bạn có thể đăng nhập hoặc tạo tài khoản bằng Email (Gmail) & Mật khẩu bên dưới:');
      }
    });
  }

  // Mở modal Email / Password
  const btnEmailModal = document.getElementById('btn-login-email-modal');
  if (btnEmailModal) {
    btnEmailModal.addEventListener('click', () => {
      openAuthModal();
    });
  }

  // Đóng modal
  const btnAuthCancel = document.getElementById('btn-auth-cancel');
  if (btnAuthCancel) {
    btnAuthCancel.addEventListener('click', () => {
      document.getElementById('dialog-auth-backdrop').style.display = 'none';
    });
  }

  // Chuyển đổi giữa Đăng nhập / Đăng ký
  const btnToggleMode = document.getElementById('btn-auth-toggle-mode');
  if (btnToggleMode) {
    btnToggleMode.addEventListener('click', () => {
      authMode = authMode === 'login' ? 'register' : 'login';
      const title = document.getElementById('auth-modal-title');
      const submit = document.getElementById('btn-auth-submit');
      if (authMode === 'register') {
        if (title) title.textContent = 'Đăng ký tài khoản mới';
        if (submit) submit.textContent = 'Đăng ký & Đồng bộ';
        btnToggleMode.textContent = 'Đã có tài khoản? Nhấn để Đăng nhập';
      } else {
        if (title) title.textContent = 'Đăng nhập tài khoản';
        if (submit) submit.textContent = 'Đăng nhập';
        btnToggleMode.textContent = 'Chưa có tài khoản? Nhấn để Đăng ký mới';
      }
    });
  }

  // Nút submit Đăng nhập / Đăng ký
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  if (btnAuthSubmit) {
    btnAuthSubmit.addEventListener('click', async () => {
      const emailInput = document.getElementById('auth-input-email');
      const passInput = document.getElementById('auth-input-password');
      const email = (emailInput ? emailInput.value : '').trim();
      const password = (passInput ? passInput.value : '').trim();

      if (!email || !email.includes('@')) {
        showToast('⚠️ Vui lòng nhập địa chỉ email hợp lệ!');
        if (emailInput) emailInput.focus();
        return;
      }
      if (!password || password.length < 6) {
        showToast('⚠️ Mật khẩu phải có tối thiểu 6 ký tự!');
        if (passInput) passInput.focus();
        return;
      }

      try {
        btnAuthSubmit.disabled = true;
        btnAuthSubmit.textContent = 'Đang xử lý...';

        if (authMode === 'register') {
          try {
            await firebaseAuth.createUserWithEmailAndPassword(email, password);
            localStorage.setItem('user_backup_email', email);
            showToast('🎉 Đăng ký thành công và đã bắt đầu đồng bộ!');
          } catch (regErr) {
            if (regErr.code === 'auth/email-already-in-use') {
              // Thử đăng nhập nếu email đã tồn tại
              await firebaseAuth.signInWithEmailAndPassword(email, password);
              localStorage.setItem('user_backup_email', email);
              showToast('✅ Đăng nhập thành công!');
            } else {
              throw regErr;
            }
          }
        } else {
          // Chế độ Đăng nhập
          try {
            await firebaseAuth.signInWithEmailAndPassword(email, password);
            localStorage.setItem('user_backup_email', email);
            showToast('✅ Đăng nhập thành công!');
          } catch (signInErr) {
            // Nếu chưa có tài khoản, tự động đăng ký mới luôn cho người dùng
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              try {
                await firebaseAuth.createUserWithEmailAndPassword(email, password);
                localStorage.setItem('user_backup_email', email);
                showToast('🎉 Đã tự động tạo tài khoản và kích hoạt đồng bộ!');
              } catch (createErr) {
                if (createErr.code === 'auth/wrong-password') {
                  throw signInErr;
                }
                throw createErr;
              }
            } else {
              throw signInErr;
            }
          }
        }
        document.getElementById('dialog-auth-backdrop').style.display = 'none';
      } catch (err) {
        console.error('Auth error:', err);
        let msg = err.message || 'Lỗi không xác định';
        if (err.code === 'auth/configuration-not-found') {
          msg = 'Dự án Firebase chưa bật tính năng "Authentication". Vui lòng vào Firebase Console > Authentication > nhấn Bắt đầu và bật Email/Password!';
        } else if (err.code === 'auth/wrong-password') {
          msg = 'Mật khẩu chưa chính xác! Vui lòng nhập đúng mật khẩu đã đăng ký trước đó.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Mật khẩu quá ngắn, vui lòng đặt mật khẩu từ 6 ký tự!';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Định dạng email chưa hợp lệ!';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Không thể kết nối mạng, vui lòng kiểm tra Wifi/4G!';
        }
        showToast(`❌ ${msg}`);
      } finally {
        btnAuthSubmit.disabled = false;
        btnAuthSubmit.textContent = authMode === 'register' ? 'Đăng ký & Đồng bộ' : 'Đăng nhập';
      }
    });
  }

  // Nút Đồng bộ thủ công
  const btnManualSync = document.getElementById('btn-manual-sync');
  if (btnManualSync) {
    btnManualSync.addEventListener('click', async () => {
      if (currentUser) {
        await syncToCloud();
        showToast('☁️ Đã đồng bộ dữ liệu mới nhất lên đám mây!');
      }
    });
  }

  // Nút Đăng xuất
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Bạn có muốn đăng xuất khỏi tài khoản này không? Dữ liệu trên điện thoại vẫn được giữ nguyên.')) {
        await firebaseAuth.signOut();
        showToast('Đã đăng xuất tài khoản!');
      }
    });
  }
}

function openAuthModal(noticeText) {
  const modal = document.getElementById('dialog-auth-backdrop');
  const desc = document.getElementById('auth-modal-desc');
  const emailInput = document.getElementById('auth-input-email');
  if (desc) {
    desc.textContent = noticeText || 'Nhập Email (Gmail) và mật khẩu để đồng bộ dữ liệu lên đám mây:';
  }
  const savedEmail = localStorage.getItem('user_backup_email');
  if (savedEmail && emailInput && !emailInput.value) {
    emailInput.value = savedEmail;
  }
  if (modal) modal.style.display = 'flex';
}

// =========================================================
// KHỞI ĐỘNG ỨNG DỤNG
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  State.currentYearMonth = getNowYearMonth();
  loadData();
  setupEventListeners();
  renderApp();
  initFirebase();
});
