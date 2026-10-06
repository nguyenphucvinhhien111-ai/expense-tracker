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
    { id: 'lai-dau-tu', name: 'Lãi & Tiết kiệm', icon: '📈', color: '#06b6d4' },
    { id: 'thu-khac', name: 'Thu nhập khác', icon: '✨', color: '#64748b' }
  ]
};

// State toàn cục
const State = {
  transactions: [],
  debts: [], // Danh sách quản lý nợ / cho vay
  initialBalance: 0,
  currentYearMonth: '', // Format 'YYYY-MM'
  selectedDateFilter: null, // Format 'YYYY-MM-DD' hoặc null (lọc theo ngày cụ thể)
  filterType: 'all',    // 'all' | 'expense' | 'income'
  searchQuery: '',
  isBalanceHidden: true, // MẶC ĐỊNH KHI VÀO APP LÀ ẨN TIỀN
  modalType: 'expense', // 'expense' | 'income'
  selectedCategory: null,
  activeView: 'view-home',
  editingTxId: null, // ID giao dịch đang sửa (null nếu tạo mới)
  activeDebtFilter: 'active' // 'active' | 'settled' | 'all'
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
const STORAGE_KEY_DEBTS = 'so_thu_chi_debts_v1';
const STORAGE_KEY_INIT = 'so_thu_chi_initial_balance_v1';
const STORAGE_KEY_THEME = 'so_thu_chi_theme_v1';

function loadData() {
  try {
    const rawTx = localStorage.getItem(STORAGE_KEY_TX);
    const rawDebts = localStorage.getItem(STORAGE_KEY_DEBTS);
    const rawInit = localStorage.getItem(STORAGE_KEY_INIT);

    if (rawTx !== null) {
      State.transactions = JSON.parse(rawTx);
    } else {
      State.transactions = [];
    }

    if (rawDebts !== null) {
      try {
        State.debts = JSON.parse(rawDebts);
      } catch (e) {
        State.debts = [];
      }
    } else {
      State.debts = [];
    }

    if (rawInit !== null) {
      State.initialBalance = Number(rawInit) || 0;
    } else {
      State.initialBalance = 0;
    }

    // Loại bỏ triệt để các dữ liệu mẫu ban đầu nếu còn lưu trong máy của người dùng
    const originalLen = State.transactions.length;
    State.transactions = State.transactions.filter(t => !t.id || !String(t.id).startsWith('tx_init_'));
    if (State.transactions.length !== originalLen) {
      if (State.initialBalance === 2000000 && State.transactions.length === 0) {
        State.initialBalance = 0;
      }
      saveDataLocally();
    }
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu:', err);
    State.transactions = [];
    State.debts = [];
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
    localStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(State.debts || []));
    localStorage.setItem(STORAGE_KEY_INIT, String(State.initialBalance));
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu:', err);
  }
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
  renderDebtsView();
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

function isDebtRecoveryTx(tx) {
  if (!tx) return false;
  return tx.isDebtRecovery === true || (tx.type === 'income' && (tx.category === 'Thu hồi nợ' || tx.categoryId === 'thu-no'));
}

function isLoanGivenTx(tx) {
  if (!tx) return false;
  return tx.isLoanGiven === true || (tx.type === 'expense' && (tx.category === 'Cho vay' || tx.categoryId === 'cho-vay'));
}

function getTotalDebtRemaining() {
  let totalRemaining = 0;
  if (!Array.isArray(State.debts)) return 0;
  State.debts.forEach(d => {
    const lent = (d.records || []).filter(r => r.type === 'lend').reduce((sum, r) => sum + (r.amount || 0), 0);
    const repaid = (d.records || []).filter(r => r.type === 'repay').reduce((sum, r) => sum + (r.amount || 0), 0);
    const remaining = Math.max(0, lent - repaid);
    totalRemaining += remaining;
  });
  return totalRemaining;
}

function renderBalanceCard() {
  // Tính tổng số dư tất cả các tháng (Số dư ban đầu + Tổng tất cả Thu - Tổng tất cả Chi - Tiền đang cho vay chưa thu hồi)
  let totalAllIncome = 0;
  let totalAllExpense = 0;

  State.transactions.forEach(tx => {
    if (isDebtRecoveryTx(tx) || isLoanGivenTx(tx)) return;
    if (tx.type === 'income') {
      totalAllIncome += tx.amount;
    }
    else if (tx.type === 'expense') {
      totalAllExpense += tx.amount;
    }
  });

  const totalDebtOut = getTotalDebtRemaining();
  const overallBalance = State.initialBalance + totalAllIncome - totalAllExpense - totalDebtOut;

  // Tính thu chi riêng của tháng hiện tại được chọn (DOANH THU & CHI TIÊU THÁNG TIÊU DÙNG)
  let monthIncome = 0;
  let monthExpense = 0;

  State.transactions.forEach(tx => {
    if (tx.date.startsWith(State.currentYearMonth)) {
      if (isDebtRecoveryTx(tx) || isLoanGivenTx(tx)) return;
      if (tx.type === 'income') {
        monthIncome += tx.amount;
      }
      else if (tx.type === 'expense') {
        monthExpense += tx.amount;
      }
    }
  });

  const monthNet = monthIncome - monthExpense;

  // Cập nhật DOM
  const totalBalanceEl = document.getElementById('total-balance-display');
  const monthIncomeEl = document.getElementById('month-income-display');
  const monthExpenseEl = document.getElementById('month-expense-display');
  const monthNetEl = document.getElementById('month-net-display');
  const eyeIcon = document.getElementById('balance-eye-icon');

  if (eyeIcon) {
    eyeIcon.textContent = State.isBalanceHidden ? '🙈' : '👁️';
    eyeIcon.title = State.isBalanceHidden ? 'Nhấn để xem số tiền' : 'Nhấn để ẩn số tiền';
  }

  if (State.isBalanceHidden) {
    totalBalanceEl.innerHTML = `•••••••• <span class="currency-symbol">₫</span>`;
    monthIncomeEl.textContent = `+ •••••• ₫`;
    monthExpenseEl.textContent = `- •••••• ₫`;
    monthNetEl.textContent = `•••••• ₫`;
    monthNetEl.style.color = 'var(--text-muted)';
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

  // Cập nhật nhãn số dư ban đầu trong mục Cài đặt
  const settingInitBadge = document.getElementById('setting-initial-balance-val');
  if (settingInitBadge) {
    settingInitBadge.textContent = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(State.initialBalance)} ₫`;
  }
}

// =========================================================
// QUẢN LÝ BỘ LỌC THEO NGÀY (DATE PICKER)
// =========================================================

function setDateFilter(dateStr) {
  if (!dateStr) {
    clearDateFilter();
    return;
  }
  State.selectedDateFilter = dateStr;
  const targetYearMonth = dateStr.substring(0, 7);
  if (targetYearMonth !== State.currentYearMonth) {
    State.currentYearMonth = targetYearMonth;
  }
  renderApp();
  showToast(`📅 Đang lọc ngày: ${formatDateDisplay(dateStr)}`);
}

function clearDateFilter() {
  State.selectedDateFilter = null;
  renderApp();
  showToast('Đã chuyển về xem cả tháng');
}

function renderDateFilterUI() {
  const box = document.getElementById('date-filter-box');
  const textEl = document.getElementById('date-filter-text');
  const clearBtn = document.getElementById('btn-clear-date');
  const inputEl = document.getElementById('input-date-filter');
  const banner = document.getElementById('active-date-banner');
  const bannerText = document.getElementById('active-date-banner-text');

  if (!box || !textEl || !clearBtn) return;

  if (State.selectedDateFilter) {
    box.classList.add('active');
    clearBtn.style.display = 'flex';
    if (inputEl) inputEl.value = State.selectedDateFilter;

    const todayStr = getNowDateString();
    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    let displayLabel = formatDateDisplay(State.selectedDateFilter);
    if (State.selectedDateFilter === todayStr) {
      displayLabel = `Hôm nay (${displayLabel})`;
    } else if (State.selectedDateFilter === yesterdayStr) {
      displayLabel = `Hôm qua (${displayLabel})`;
    }

    textEl.textContent = displayLabel;

    if (banner && bannerText) {
      banner.style.display = 'flex';
      bannerText.textContent = `${displayLabel} • ${getDayOfWeekName(State.selectedDateFilter)}`;
    }
  } else {
    box.classList.remove('active');
    clearBtn.style.display = 'none';
    textEl.textContent = 'Chọn ngày';
    if (inputEl) inputEl.value = '';
    if (banner) banner.style.display = 'none';
  }
}

function renderTransactionList() {
  const container = document.getElementById('tx-list-container');
  const badgeEl = document.getElementById('tx-count-badge');

  // Lọc giao dịch theo tháng được chọn
  let filtered = State.transactions.filter(tx => tx.date.startsWith(State.currentYearMonth));

  // LỌC THEO NGÀY CỤ THỂ NẾU CÓ CHỌN DATE PICKER
  if (State.selectedDateFilter) {
    filtered = filtered.filter(tx => tx.date === State.selectedDateFilter);
  }

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
  renderDateFilterUI();

  // Nếu không có giao dịch nào
  if (filtered.length === 0) {
    if (State.selectedDateFilter) {
      const formatted = formatDateDisplay(State.selectedDateFilter);
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📅</span>
          <h4 class="empty-title">Không có giao dịch ngày ${formatted}</h4>
          <p class="empty-desc">Chưa có khoản thu hay chi nào được ghi nhận trong ngày này.</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
            <button type="button" class="empty-cta-btn" id="btn-empty-clear-date" style="padding:8px 14px;border-radius:8px;background:rgba(99,102,241,0.15);color:#6366f1;border:1px solid rgba(99,102,241,0.3);font-weight:700;font-size:0.8rem;cursor:pointer;">
              Xem cả tháng ✕
            </button>
          </div>
        </div>
      `;
      const btnEmptyClear = document.getElementById('btn-empty-clear-date');
      if (btnEmptyClear) {
        btnEmptyClear.addEventListener('click', clearDateFilter);
      }
      return;
    }

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
      if (t.type === 'income') {
        if (!isDebtRecoveryTx(t)) dayIncome += t.amount;
      }
      else {
        if (!isLoanGivenTx(t)) dayExpense += t.amount;
      }
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
    if (State.isBalanceHidden) {
      daySummaryText = `<span style="letter-spacing:1px;font-weight:700;color:var(--text-muted);">••••••</span>`;
    } else if (dayExpense > 0 && dayIncome > 0) {
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
      const isDebt = isDebtRecoveryTx(tx);
      const isLoan = isLoanGivenTx(tx);
      const sign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'income' : 'expense';
      const amountDisplay = State.isBalanceHidden ? `${sign} •••••• ₫` : `${sign} ${formatCurrency(tx.amount)} ₫`;
      
      let specialBadge = '';
      if (isDebt) {
        specialBadge = `<span style="font-size:0.68rem; background:rgba(99,102,241,0.12); color:#6366f1; padding:2px 6px; border-radius:4px; font-weight:700; margin-left:4px;">Cộng số dư ví</span>`;
      } else if (isLoan) {
        specialBadge = `<span style="font-size:0.68rem; background:rgba(244,63,94,0.12); color:#f43f5e; padding:2px 6px; border-radius:4px; font-weight:700; margin-left:4px;">Trừ số dư ví</span>`;
      }

      html += `
        <div class="tx-item" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-cat-icon">${tx.categoryIcon || (isIncome ? '💵' : '💸')}</div>
            <div class="tx-meta">
              <span class="tx-cat-name">${tx.category} ${specialBadge}</span>
              <span class="tx-note">${tx.note ? escapeHtml(tx.note) : (isIncome ? (isDebt ? 'Thu hồi nợ' : 'Khoản thu') : (isLoan ? 'Cho vay' : 'Khoản chi'))}</span>
            </div>
          </div>
          <div class="tx-right">
            <span class="tx-amount ${amountClass}">${amountDisplay}</span>
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

  // Gán sự kiện bấm vào giao dịch để chỉnh sửa
  container.querySelectorAll('.tx-item').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-tx')) return;
      const id = item.dataset.id;
      if (id) openEditTransactionModal(id);
    });
  });

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
      if (!isDebtRecoveryTx(tx)) {
        totalIncome += tx.amount;
      }
    } else {
      if (!isLoanGivenTx(tx)) {
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
    }
  });

  document.getElementById('stats-total-expense').textContent = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(totalExpense)} ₫`;
  document.getElementById('stats-total-income').textContent = State.isBalanceHidden ? '+•••••• ₫' : `+${formatCurrency(totalIncome)} ₫`;

  // Tỷ lệ tiết kiệm = ((Thu - Chi) / Thu) * 100%
  let savingRate = 0;
  if (totalIncome > 0) {
    savingRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
  }
  const savingEl = document.getElementById('stats-saving-rate');
  savingEl.textContent = State.isBalanceHidden ? '••%' : `${savingRate}%`;
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
    const catAmountDisplay = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(item.amount)} ₫`;

    catHtml += `
      <div class="stat-cat-row">
        <div class="stat-cat-info">
          <span class="stat-cat-name">
            <span>${item.icon}</span>
            <span>${item.name}</span>
          </span>
          <div class="stat-cat-values">
            <span class="stat-cat-amount">${catAmountDisplay}</span>
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

    // Nếu xóa khoản Thu hồi nợ, trừ bớt lại trong số dư ban đầu
    if (isDebtRecoveryTx(deleted)) {
      State.initialBalance = Math.max(0, State.initialBalance - deleted.amount);
    }
    // Nếu xóa khoản Cho vay, hoàn lại vào số dư ban đầu
    else if (isLoanGivenTx(deleted)) {
      State.initialBalance += deleted.amount;
    }

    saveData();
    renderApp();
    showToast(`Đã xóa: ${deleted.category} (${formatCurrency(deleted.amount)} ₫)`);
  }
}

// =========================================================
// BOTTOM SHEET MODAL (NHẬP LIỆU)
// =========================================================

// =========================================================
// BOTTOM SHEET MODAL (NHẬP LIỆU & CHỈNH SỬA GIAO DỊCH)
// =========================================================

function openTransactionModal(defaultType = 'expense') {
  State.editingTxId = null;
  State.modalType = defaultType;
  
  const modal = document.getElementById('modal-tx');
  const backdrop = document.getElementById('modal-backdrop');
  const sheetTitle = document.getElementById('sheet-title');
  const submitText = document.getElementById('submit-btn-text');
  const btnDeleteInModal = document.getElementById('btn-modal-delete-tx');

  if (sheetTitle) sheetTitle.textContent = defaultType === 'income' ? 'Ghi Nhận Tiền Vào' : 'Ghi Khoản Chi Tiêu';
  if (submitText) submitText.textContent = defaultType === 'income' ? 'Cộng Vào Thu Nhập (+)' : 'Lưu Khoản Chi Tiêu (-)';
  if (btnDeleteInModal) btnDeleteInModal.style.display = 'none';

  // Cập nhật giao diện toggle type
  updateModalTypeToggle(defaultType);

  // Đặt ngày mặc định là ngày đang lọc nếu có, hoặc hôm nay
  document.getElementById('input-date').value = State.selectedDateFilter || getNowDateString();
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

function openEditTransactionModal(id) {
  const tx = State.transactions.find(t => t.id === id);
  if (!tx) return;

  State.editingTxId = tx.id;
  State.modalType = tx.type;

  const modal = document.getElementById('modal-tx');
  const backdrop = document.getElementById('modal-backdrop');
  const sheetTitle = document.getElementById('sheet-title');
  const submitText = document.getElementById('submit-btn-text');
  const btnDeleteInModal = document.getElementById('btn-modal-delete-tx');

  if (sheetTitle) sheetTitle.textContent = 'Chỉnh Sửa Giao Dịch';
  if (submitText) submitText.textContent = 'Cập Nhật Thay Đổi';
  if (btnDeleteInModal) btnDeleteInModal.style.display = 'block';

  // Cập nhật giao diện toggle type
  updateModalTypeToggle(tx.type);

  // Điền giá trị cũ
  document.getElementById('input-date').value = tx.date || getNowDateString();
  document.getElementById('input-amount').value = formatCurrency(tx.amount);
  document.getElementById('input-note').value = tx.note || '';

  // Chọn danh mục tương ứng
  const list = CATEGORIES[tx.type] || [];
  const foundCat = list.find(c => c.id === tx.categoryId || c.name === tx.category) || list[0];
  State.selectedCategory = foundCat;

  renderModalCategories();

  // Đánh dấu nút danh mục được chọn
  const grid = document.getElementById('categories-grid');
  if (grid && foundCat) {
    grid.querySelectorAll('.cat-item-btn').forEach(btn => {
      if (btn.dataset.catId === foundCat.id) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  backdrop.classList.add('active');
  modal.classList.add('active');
}

function closeTransactionModal() {
  State.editingTxId = null;
  const modal = document.getElementById('modal-tx');
  const backdrop = document.getElementById('modal-backdrop');
  const btnDeleteInModal = document.getElementById('btn-modal-delete-tx');
  if (btnDeleteInModal) btnDeleteInModal.style.display = 'none';
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
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
    if (!State.editingTxId) {
      submitText.textContent = 'Cộng Vào Thu Nhập (+)';
      sheetTitle.textContent = 'Ghi Nhận Tiền Vào';
    }
  } else {
    btnExpense.classList.add('active');
    btnIncome.classList.remove('active');
    submitBtn.className = 'btn-submit expense-mode';
    if (!State.editingTxId) {
      submitText.textContent = 'Lưu Khoản Chi Tiêu (-)';
      sheetTitle.textContent = 'Ghi Khoản Chi Tiêu';
    }
  }

  renderModalCategories();
}

function renderModalCategories() {
  const grid = document.getElementById('categories-grid');
  const list = CATEGORIES[State.modalType] || [];
  
  if (!State.selectedCategory || !list.some(c => c.id === State.selectedCategory.id)) {
    State.selectedCategory = list[0] || null;
  }

  let html = '';
  list.forEach((cat) => {
    const isSelected = State.selectedCategory && State.selectedCategory.id === cat.id;
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

  // NẾU ĐANG CHỈNH SỬA GIAO DỊCH CŨ
  if (State.editingTxId) {
    const idx = State.transactions.findIndex(t => t.id === State.editingTxId);
    if (idx !== -1) {
      State.transactions[idx] = {
        ...State.transactions[idx],
        type: State.modalType,
        amount: amount,
        category: State.selectedCategory.name,
        categoryIcon: State.selectedCategory.icon,
        categoryId: State.selectedCategory.id,
        note: noteVal,
        date: dateVal
      };

      const txYearMonth = dateVal.substring(0, 7);
      if (txYearMonth !== State.currentYearMonth) {
        State.currentYearMonth = txYearMonth;
      }

      saveData();
      closeTransactionModal();
      renderApp();
      showToast(`✅ Đã cập nhật giao dịch: ${formatCurrency(amount)} ₫`);
      return;
    }
  }

  // TẠO GIAO DỊCH MỚI
  const newTx = {
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: State.modalType,
    amount: amount,
    category: State.selectedCategory.name,
    categoryIcon: State.selectedCategory.icon,
    categoryId: State.selectedCategory.id,
    note: noteVal,
    date: dateVal,
    createdAt: Date.now()
  };

  State.transactions.unshift(newTx);
  saveData();

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
// QUẢN LÝ SỔ NỢ (DEBT TRACKER)
// =========================================================

function renderDebtsView() {
  const container = document.getElementById('debts-list-container');
  const totalRemEl = document.getElementById('debts-total-remaining');
  const totalRepaidEl = document.getElementById('debts-total-repaid');
  const countPeopleEl = document.getElementById('debts-people-count');
  const countActiveEl = document.getElementById('count-debts-active');
  const countSettledEl = document.getElementById('count-debts-settled');

  if (!container) return;
  if (!Array.isArray(State.debts)) State.debts = [];

  let grandTotalLent = 0;
  let grandTotalRepaid = 0;
  let activeCount = 0;
  let settledCount = 0;

  const debtSummaries = State.debts.map(d => {
    const lent = (d.records || []).filter(r => r.type === 'lend').reduce((sum, r) => sum + (r.amount || 0), 0);
    const repaid = (d.records || []).filter(r => r.type === 'repay').reduce((sum, r) => sum + (r.amount || 0), 0);
    const remaining = Math.max(0, lent - repaid);
    const isSettled = remaining === 0 && lent > 0;

    grandTotalLent += lent;
    grandTotalRepaid += repaid;
    if (isSettled) settledCount++;
    else if (lent > 0) activeCount++;

    return {
      ...d,
      lent,
      repaid,
      remaining,
      isSettled
    };
  });

  const grandRemaining = Math.max(0, grandTotalLent - grandTotalRepaid);

  if (totalRemEl) totalRemEl.textContent = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(grandRemaining)} ₫`;
  if (totalRepaidEl) totalRepaidEl.textContent = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(grandTotalRepaid)} ₫`;
  if (countPeopleEl) countPeopleEl.textContent = `${activeCount} người đang nợ`;
  if (countActiveEl) countActiveEl.textContent = String(activeCount);
  if (countSettledEl) countSettledEl.textContent = String(settledCount);

  let filtered = debtSummaries;
  if (State.activeDebtFilter === 'active') {
    filtered = debtSummaries.filter(d => !d.isSettled);
  } else if (State.activeDebtFilter === 'settled') {
    filtered = debtSummaries.filter(d => d.isSettled);
  }

  if (filtered.length === 0) {
    let emptyMsg = 'Chưa có khoản cho vay nào';
    if (State.activeDebtFilter === 'active') emptyMsg = 'Không có ai đang nợ tiền bạn 🎉';
    else if (State.activeDebtFilter === 'settled') emptyMsg = 'Chưa có khoản nợ nào được tất toán';

    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🤝</span>
        <h4 class="empty-title">${emptyMsg}</h4>
        <p class="empty-desc">Bấm <strong>"+ Cho vay mới"</strong> ở trên để ghi nhận bạn bè, người quen vay mượn tiền nhé!</p>
      </div>
    `;
    return;
  }

  filtered.sort((a, b) => {
    if (a.isSettled !== b.isSettled) return a.isSettled ? 1 : -1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  let html = '';
  filtered.forEach(d => {
    const initial = (d.person || 'N').trim().charAt(0).toUpperCase();
    const pctRepaid = d.lent > 0 ? Math.min(100, Math.round((d.repaid / d.lent) * 100)) : 100;
    const remainingDisplay = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(d.remaining)} ₫`;
    const lentDisplay = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(d.lent)} ₫`;
    const repaidDisplay = State.isBalanceHidden ? '•••••• ₫' : `${formatCurrency(d.repaid)} ₫`;

    html += `
      <div class="debt-card ${d.isSettled ? 'settled' : ''}" data-debt-id="${d.id}">
        <div class="debt-card-header">
          <div class="debt-person-info">
            <div class="debt-avatar ${d.isSettled ? 'settled' : ''}">${initial}</div>
            <div>
              <span class="debt-person-name">${escapeHtml(d.person)}</span>
              <span class="debt-status-tag ${d.isSettled ? 'settled' : 'active'}">
                ${d.isSettled ? '✅ Đã tất toán' : '⏳ Đang nợ'}
              </span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="debt-amount-label">Còn nợ:</span>
            <span class="debt-remaining-val ${d.isSettled ? 'green-text' : 'red-text'}">${remainingDisplay}</span>
          </div>
        </div>

        <div class="debt-progress-track">
          <div class="debt-progress-bar" style="width: ${pctRepaid}%;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px;">
          <span>Đã trả: <strong class="green-text">${repaidDisplay}</strong> (${pctRepaid}%)</span>
          <span>Tổng vay: <strong>${lentDisplay}</strong></span>
        </div>

        <div class="debt-card-actions">
          <button type="button" class="debt-btn-action add-more" data-action="add-more" data-debt-id="${d.id}" data-person="${escapeHtml(d.person)}">
            + Vay thêm
          </button>
          <button type="button" class="debt-btn-action repay" data-action="repay" data-debt-id="${d.id}">
            Thu nợ (Trả tiền)
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.debt-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.debt-btn-action')) return;
      const debtId = card.dataset.debtId;
      if (debtId) openDebtDetailModal(debtId);
    });
  });

  container.querySelectorAll('.debt-btn-action.add-more').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const person = btn.dataset.person;
      openCreateDebtModal(person);
    });
  });

  container.querySelectorAll('.debt-btn-action.repay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const debtId = btn.dataset.debtId;
      openRepayDebtModal(debtId);
    });
  });
}

function openCreateDebtModal(personName = '') {
  const modal = document.getElementById('modal-debt-create');
  const backdrop = document.getElementById('modal-debt-create-backdrop');
  const personInput = document.getElementById('debt-input-person');
  const amountInput = document.getElementById('debt-input-amount');
  const dateInput = document.getElementById('debt-input-date');
  const noteInput = document.getElementById('debt-input-note');
  const titleEl = document.getElementById('debt-modal-title');
  const submitTextEl = document.getElementById('debt-submit-btn-text');
  const suggestionsEl = document.getElementById('debt-person-suggestions');

  if (!modal || !backdrop) return;

  personInput.value = personName;
  amountInput.value = '';
  dateInput.value = getNowDateString();
  noteInput.value = '';

  if (personName) {
    titleEl.textContent = `Cho ${personName} Vay Thêm`;
    submitTextEl.textContent = `Xác Nhận Cho ${personName} Vay Thêm (-)`;
    if (suggestionsEl) suggestionsEl.innerHTML = '';
  } else {
    titleEl.textContent = 'Ghi Khoản Cho Vay Mới';
    submitTextEl.textContent = 'Xác Nhận Cho Vay (-)';
    if (suggestionsEl && Array.isArray(State.debts)) {
      const knownNames = Array.from(new Set(State.debts.map(d => d.person).filter(Boolean)));
      if (knownNames.length > 0) {
        suggestionsEl.innerHTML = knownNames.map(name => `
          <button type="button" class="quick-amt-chip" style="font-size: 0.75rem;" data-name="${escapeHtml(name)}">
            👤 ${escapeHtml(name)}
          </button>
        `).join('');
        suggestionsEl.querySelectorAll('button').forEach(b => {
          b.addEventListener('click', () => {
            personInput.value = b.dataset.name;
            amountInput.focus();
          });
        });
      } else {
        suggestionsEl.innerHTML = '';
      }
    }
  }

  backdrop.style.display = 'block';
  modal.style.display = 'block';
  backdrop.classList.add('active');
  modal.classList.add('active');

  setTimeout(() => {
    if (!personName) personInput.focus();
    else amountInput.focus();
  }, 250);
}

function closeCreateDebtModal() {
  const modal = document.getElementById('modal-debt-create');
  const backdrop = document.getElementById('modal-debt-create-backdrop');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    backdrop.style.display = 'none';
  }
}

function handleSaveDebtRecord() {
  const person = document.getElementById('debt-input-person').value.trim();
  const amountStr = document.getElementById('debt-input-amount').value;
  const amount = parseFormattedNumber(amountStr);
  const date = document.getElementById('debt-input-date').value || getNowDateString();
  const note = document.getElementById('debt-input-note').value.trim();

  if (!person) {
    showToast('⚠️ Vui lòng nhập tên người vay');
    document.getElementById('debt-input-person').focus();
    return;
  }
  if (amount <= 0) {
    showToast('⚠️ Vui lòng nhập số tiền lớn hơn 0');
    document.getElementById('debt-input-amount').focus();
    return;
  }

  if (!Array.isArray(State.debts)) State.debts = [];

  let debt = State.debts.find(d => d.person.toLowerCase() === person.toLowerCase());
  const newRecord = {
    id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: 'lend',
    amount: amount,
    date: date,
    note: note || 'Cho vay',
    createdAt: Date.now()
  };

  if (debt) {
    if (!Array.isArray(debt.records)) debt.records = [];
    debt.records.unshift(newRecord);
    debt.updatedAt = Date.now();
  } else {
    debt = {
      id: 'debt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      person: person,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      records: [newRecord]
    };
    State.debts.unshift(debt);
  }

  saveData();
  closeCreateDebtModal();
  renderApp();
  showToast(`🤝 Đã ghi cho ${person} vay: -${formatCurrency(amount)} ₫`);
}

let currentRepayDebtId = null;

function openRepayDebtModal(debtId) {
  const debt = (State.debts || []).find(d => d.id === debtId);
  if (!debt) return;

  currentRepayDebtId = debtId;
  const modal = document.getElementById('modal-debt-repay');
  const backdrop = document.getElementById('modal-debt-repay-backdrop');
  const personNameEl = document.getElementById('repay-person-name');
  const remainingEl = document.getElementById('repay-remaining-amount');
  const amountInput = document.getElementById('repay-input-amount');
  const dateInput = document.getElementById('repay-input-date');
  const noteInput = document.getElementById('repay-input-note');
  const btnRepayFull = document.getElementById('btn-repay-full');

  if (!modal || !backdrop) return;

  const lent = (debt.records || []).filter(r => r.type === 'lend').reduce((sum, r) => sum + (r.amount || 0), 0);
  const repaid = (debt.records || []).filter(r => r.type === 'repay').reduce((sum, r) => sum + (r.amount || 0), 0);
  const remaining = Math.max(0, lent - repaid);

  personNameEl.textContent = debt.person;
  remainingEl.textContent = `${formatCurrency(remaining)} ₫`;
  amountInput.value = '';
  dateInput.value = getNowDateString();
  noteInput.value = '';

  if (btnRepayFull) {
    btnRepayFull.onclick = () => {
      amountInput.value = formatCurrency(remaining);
    };
  }

  backdrop.style.display = 'block';
  modal.style.display = 'block';
  backdrop.classList.add('active');
  modal.classList.add('active');

  setTimeout(() => {
    amountInput.focus();
  }, 250);
}

function closeRepayDebtModal() {
  currentRepayDebtId = null;
  const modal = document.getElementById('modal-debt-repay');
  const backdrop = document.getElementById('modal-debt-repay-backdrop');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    backdrop.style.display = 'none';
  }
}

function handleSaveRepayRecord() {
  if (!currentRepayDebtId) return;
  const debt = (State.debts || []).find(d => d.id === currentRepayDebtId);
  if (!debt) return;

  const amountStr = document.getElementById('repay-input-amount').value;
  const amount = parseFormattedNumber(amountStr);
  const date = document.getElementById('repay-input-date').value || getNowDateString();
  const note = document.getElementById('repay-input-note').value.trim();

  if (amount <= 0) {
    showToast('⚠️ Vui lòng nhập số tiền trả lớn hơn 0');
    document.getElementById('repay-input-amount').focus();
    return;
  }

  const newRecord = {
    id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: 'repay',
    amount: amount,
    date: date,
    note: note || 'Trả nợ',
    createdAt: Date.now()
  };

  if (!Array.isArray(debt.records)) debt.records = [];
  debt.records.unshift(newRecord);
  debt.updatedAt = Date.now();

  saveData();
  closeRepayDebtModal();
  renderApp();
  showToast(`✅ Đã thu hồi nợ từ ${debt.person}: +${formatCurrency(amount)} ₫`);
}

let currentDetailDebtId = null;

function openDebtDetailModal(debtId) {
  const debt = (State.debts || []).find(d => d.id === debtId);
  if (!debt) return;

  currentDetailDebtId = debtId;
  const modal = document.getElementById('modal-debt-detail');
  const backdrop = document.getElementById('modal-debt-detail-backdrop');
  const titleEl = document.getElementById('detail-person-title');
  const overviewEl = document.getElementById('debt-detail-overview');
  const timelineEl = document.getElementById('debt-records-timeline');

  if (!modal || !backdrop) return;

  const lent = (debt.records || []).filter(r => r.type === 'lend').reduce((sum, r) => sum + (r.amount || 0), 0);
  const repaid = (debt.records || []).filter(r => r.type === 'repay').reduce((sum, r) => sum + (r.amount || 0), 0);
  const remaining = Math.max(0, lent - repaid);

  titleEl.textContent = `Hồ Sơ Nợ: ${debt.person}`;

  overviewEl.innerHTML = `
    <div class="debt-detail-col">
      <span>Tổng vay</span>
      <strong>${formatCurrency(lent)} ₫</strong>
    </div>
    <div class="debt-detail-col">
      <span>Đã trả</span>
      <strong class="green-text">${formatCurrency(repaid)} ₫</strong>
    </div>
    <div class="debt-detail-col">
      <span>Còn nợ</span>
      <strong class="${remaining > 0 ? 'red-text' : 'green-text'}">${formatCurrency(remaining)} ₫</strong>
    </div>
  `;

  const records = [...(debt.records || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

  if (records.length === 0) {
    timelineEl.innerHTML = `<p style="text-align:center;font-size:0.8rem;color:var(--text-muted);padding:10px 0;">Chưa có lịch sử giao dịch nào.</p>`;
  } else {
    timelineEl.innerHTML = records.map(r => {
      const isLend = r.type === 'lend';
      return `
        <div class="timeline-item">
          <div class="timeline-left">
            <div class="timeline-icon ${isLend ? 'lend' : 'repay'}">${isLend ? '💸' : '💰'}</div>
            <div class="timeline-meta">
              <span class="timeline-note">${escapeHtml(r.note || (isLend ? 'Cho vay' : 'Trả nợ'))}</span>
              <span class="timeline-date">${formatDateDisplay(r.date)}</span>
            </div>
          </div>
          <div class="timeline-right">
            <span class="timeline-amt ${isLend ? 'red-text' : 'green-text'}">
              ${isLend ? '-' : '+'}${formatCurrency(r.amount)} ₫
            </span>
            <button type="button" class="btn-delete-record" data-rec-id="${r.id}" title="Xóa dòng này">✕</button>
          </div>
        </div>
      `;
    }).join('');

    timelineEl.querySelectorAll('.btn-delete-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const recId = btn.dataset.recId;
        if (confirm('Bạn có chắc muốn xóa dòng giao dịch này?')) {
          deleteDebtRecord(currentDetailDebtId, recId);
        }
      });
    });
  }

  backdrop.style.display = 'block';
  modal.style.display = 'block';
  backdrop.classList.add('active');
  modal.classList.add('active');
}

function closeDebtDetailModal() {
  currentDetailDebtId = null;
  const modal = document.getElementById('modal-debt-detail');
  const backdrop = document.getElementById('modal-debt-detail-backdrop');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    backdrop.style.display = 'none';
  }
}

function deleteDebtRecord(debtId, recId) {
  const debt = (State.debts || []).find(d => d.id === debtId);
  if (!debt || !Array.isArray(debt.records)) return;

  const idx = debt.records.findIndex(r => r.id === recId);
  if (idx !== -1) {
    debt.records.splice(idx, 1);
    debt.updatedAt = Date.now();
    saveData();
    renderApp();
    openDebtDetailModal(debtId);
    showToast('Đã xóa dòng giao dịch');
  }
}

function deleteWholeDebt(debtId) {
  const idx = (State.debts || []).findIndex(d => d.id === debtId);
  if (idx !== -1) {
    const person = State.debts[idx].person;
    State.debts.splice(idx, 1);
    saveData();
    closeDebtDetailModal();
    renderApp();
    showToast(`Đã xóa hồ sơ nợ của ${person}`);
  }
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
      } else if (targetView === 'view-debts') {
        renderDebtsView();
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
    State.selectedDateFilter = null;
    renderApp();
    showToast('Đã về tháng hiện tại');
  });

  // Lọc theo ngày (Date Picker)
  const inputDateFilter = document.getElementById('input-date-filter');
  const btnDateFilter = document.getElementById('btn-date-filter');
  const btnClearDate = document.getElementById('btn-clear-date');
  const btnBannerClear = document.getElementById('btn-banner-clear-date');

  if (inputDateFilter) {
    inputDateFilter.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        setDateFilter(val);
      }
    });
  }

  const triggerDatePicker = () => {
    if (!inputDateFilter) return;
    try {
      if (typeof inputDateFilter.showPicker === 'function') {
        inputDateFilter.showPicker();
      } else {
        inputDateFilter.click();
      }
    } catch (err) {
      inputDateFilter.focus();
      inputDateFilter.click();
    }
  };

  if (btnDateFilter) {
    btnDateFilter.addEventListener('click', (e) => {
      if (e.target.closest('#btn-clear-date')) return;
      triggerDatePicker();
    });
  }

  if (btnClearDate) {
    btnClearDate.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      clearDateFilter();
    });
  }

  if (btnBannerClear) {
    btnBannerClear.addEventListener('click', (e) => {
      e.preventDefault();
      clearDateFilter();
    });
  }

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

  // Ẩn / Hiện số dư (Eye toggle & Click trực tiếp vào số tiền)
  const toggleBalancePrivacy = () => {
    State.isBalanceHidden = !State.isBalanceHidden;
    renderBalanceCard();
    renderTransactionList();
    if (State.activeView === 'view-stats') {
      renderStatsView();
    }
    showToast(State.isBalanceHidden ? '🙈 Đã ẩn thông tin tiền' : '👁️ Đã hiển thị số tiền');
  };

  document.getElementById('btn-toggle-balance-privacy')?.addEventListener('click', toggleBalancePrivacy);
  document.getElementById('total-balance-display')?.addEventListener('click', toggleBalancePrivacy);
  document.querySelector('.balance-amount-wrapper')?.addEventListener('click', toggleBalancePrivacy);

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

  // Xem trước mã sao lưu JSON
  const previewJsonBackdrop = document.getElementById('dialog-preview-json-backdrop');
  const textPreviewJson = document.getElementById('text-preview-json');
  const previewJsonCount = document.getElementById('preview-json-count');
  const btnPreviewJson = document.getElementById('btn-preview-json');

  if (btnPreviewJson) {
    btnPreviewJson.addEventListener('click', () => {
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        initialBalance: State.initialBalance,
        transactions: State.transactions,
        debts: State.debts || []
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      if (textPreviewJson) textPreviewJson.value = jsonStr;
      if (previewJsonCount) previewJsonCount.textContent = `${State.transactions.length} giao dịch, ${(State.debts || []).length} hồ sơ nợ`;
      if (previewJsonBackdrop) previewJsonBackdrop.style.display = 'flex';
    });
  }

  document.getElementById('btn-close-preview-json')?.addEventListener('click', () => {
    if (previewJsonBackdrop) previewJsonBackdrop.style.display = 'none';
  });

  document.getElementById('btn-copy-preview-json')?.addEventListener('click', () => {
    if (!textPreviewJson) return;
    const textToCopy = textPreviewJson.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('📋 Đã sao chép mã JSON vào bộ nhớ tạm!');
      }).catch(() => {
        textPreviewJson.select();
        document.execCommand('copy');
        showToast('📋 Đã sao chép mã JSON vào bộ nhớ tạm!');
      });
    } else {
      textPreviewJson.select();
      document.execCommand('copy');
      showToast('📋 Đã sao chép mã JSON vào bộ nhớ tạm!');
    }
  });

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

  // Xóa toàn bộ dữ liệu
  document.getElementById('btn-reset-all').addEventListener('click', () => {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu thu chi và sổ nợ không? Dữ liệu đã xóa sẽ không thể phục hồi trừ khi bạn đã sao lưu!')) {
      State.transactions = [];
      State.debts = [];
      State.initialBalance = 0;
      saveData();
      renderApp();
      showToast('Đã xóa toàn bộ dữ liệu!');
    }
  });

  // Xóa giao dịch từ trong modal chỉnh sửa
  const btnDeleteTxModal = document.getElementById('btn-modal-delete-tx');
  if (btnDeleteTxModal) {
    btnDeleteTxModal.addEventListener('click', () => {
      if (State.editingTxId) {
        if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
          const idToDelete = State.editingTxId;
          closeTransactionModal();
          deleteTransaction(idToDelete);
        }
      }
    });
  }

  // --- SỰ KIỆN SỔ NỢ (DEBT TRACKER) ---
  // Mở modal cho vay mới từ Sổ Nợ
  document.getElementById('btn-open-create-debt')?.addEventListener('click', () => {
    openCreateDebtModal();
  });

  // Bộ lọc danh sách Sổ nợ (Đang nợ / Đã trả hết / Tất cả)
  document.querySelectorAll('.debt-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.debt-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.activeDebtFilter = btn.dataset.debtFilter || 'active';
      renderDebtsView();
    });
  });

  // Modal Cho vay: Đóng
  document.getElementById('debt-modal-close-btn')?.addEventListener('click', closeCreateDebtModal);
  document.getElementById('modal-debt-create-backdrop')?.addEventListener('click', closeCreateDebtModal);

  // Modal Cho vay: Lưu
  document.getElementById('btn-save-debt')?.addEventListener('click', handleSaveDebtRecord);

  // Modal Cho vay: Nhập tiền tự format
  const debtAmountInput = document.getElementById('debt-input-amount');
  if (debtAmountInput) {
    debtAmountInput.addEventListener('input', (e) => {
      const raw = parseFormattedNumber(e.target.value);
      e.target.value = raw > 0 ? formatCurrency(raw) : '';
    });
  }

  // Modal Cho vay: Phím cộng tiền nhanh
  document.querySelectorAll('[data-debt-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const addVal = parseInt(btn.dataset.debtAdd, 10) || 0;
      const cur = parseFormattedNumber(debtAmountInput ? debtAmountInput.value : 0);
      if (debtAmountInput) debtAmountInput.value = formatCurrency(cur + addVal);
    });
  });
  document.getElementById('debt-btn-clear-amount')?.addEventListener('click', () => {
    if (debtAmountInput) debtAmountInput.value = '';
  });

  // Modal Thu nợ (Repay): Đóng
  document.getElementById('repay-modal-close-btn')?.addEventListener('click', closeRepayDebtModal);
  document.getElementById('modal-debt-repay-backdrop')?.addEventListener('click', closeRepayDebtModal);

  // Modal Thu nợ: Lưu
  document.getElementById('btn-confirm-repay')?.addEventListener('click', handleSaveRepayRecord);

  // Modal Thu nợ: Nhập tiền tự format
  const repayAmountInput = document.getElementById('repay-input-amount');
  if (repayAmountInput) {
    repayAmountInput.addEventListener('input', (e) => {
      const raw = parseFormattedNumber(e.target.value);
      e.target.value = raw > 0 ? formatCurrency(raw) : '';
    });
  }

  // Modal Thu nợ: Phím cộng tiền nhanh
  document.querySelectorAll('[data-repay-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const addVal = parseInt(btn.dataset.repayAdd, 10) || 0;
      const cur = parseFormattedNumber(repayAmountInput ? repayAmountInput.value : 0);
      if (repayAmountInput) repayAmountInput.value = formatCurrency(cur + addVal);
    });
  });

  // Modal Chi tiết nợ (Detail): Đóng
  document.getElementById('detail-modal-close-btn')?.addEventListener('click', closeDebtDetailModal);
  document.getElementById('modal-debt-detail-backdrop')?.addEventListener('click', closeDebtDetailModal);

  // Modal Chi tiết nợ: Vay thêm
  document.getElementById('btn-detail-add-more')?.addEventListener('click', () => {
    if (currentDetailDebtId) {
      const debt = (State.debts || []).find(d => d.id === currentDetailDebtId);
      closeDebtDetailModal();
      openCreateDebtModal(debt ? debt.person : '');
    }
  });

  // Modal Chi tiết nợ: Nút Thu nợ
  document.getElementById('btn-detail-action-repay')?.addEventListener('click', () => {
    if (currentDetailDebtId) {
      const debtId = currentDetailDebtId;
      closeDebtDetailModal();
      openRepayDebtModal(debtId);
    }
  });

  // Modal Chi tiết nợ: Nút Xóa toàn bộ hồ sơ
  document.getElementById('btn-detail-delete-debt')?.addEventListener('click', () => {
    if (currentDetailDebtId) {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ hồ sơ nợ này không?')) {
        deleteWholeDebt(currentDetailDebtId);
      }
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
  State.selectedDateFilter = null;
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
    transactions: State.transactions,
    debts: State.debts || []
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s`;
  const fileName = `so-thu-chi-backup-${timeStamp}.json`;

  if (window.AndroidBridge && window.AndroidBridge.shareFile) {
    window.AndroidBridge.shareFile(fileName, jsonStr);
    showToast(`💾 Đang chia sẻ file sao lưu (${State.transactions.length} giao dịch, ${(State.debts || []).length} hồ sơ nợ)...`);
    return;
  }

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`💾 Đã xuất file ${fileName} (${State.transactions.length} giao dịch, ${(State.debts || []).length} hồ sơ nợ)!`);
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

function findCategoryIcon(catName, type) {
  if (!catName) return type === 'income' ? '💵' : '💸';
  const norm = catName.toLowerCase().trim();
  if (norm.includes('ăn') || norm.includes('uống') || norm.includes('sáng') || norm.includes('trưa') || norm.includes('tối')) return '🍜';
  if (norm.includes('cà phê') || norm.includes('cafe') || norm.includes('nước')) return '☕';
  if (norm.includes('xe') || norm.includes('xăng') || norm.includes('đi lại')) return '🛵';
  if (norm.includes('chợ') || norm.includes('siêu thị')) return '🛒';
  if (norm.includes('mua') || norm.includes('shop')) return '🛍️';
  if (norm.includes('lương')) return '💵';
  if (norm.includes('thưởng')) return '🎁';
  if (norm.includes('kinh doanh') || norm.includes('bán')) return '💼';
  if (norm.includes('nợ') || norm.includes('vay') || norm.includes('thu hồi')) return '🤝';
  return type === 'income' ? '💵' : '💸';
}

function normalizeTransaction(tx) {
  let cleanDate = tx.date;
  if (cleanDate && typeof cleanDate === 'string' && cleanDate.includes('T')) {
    cleanDate = cleanDate.split('T')[0];
  }
  const type = tx.type === 'income' ? 'income' : 'expense';
  const rawCat = tx.category ? String(tx.category).trim() : (type === 'income' ? 'Thu nhập khác' : 'Chi tiêu khác');
  const category = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
  const icon = tx.categoryIcon || findCategoryIcon(category, type);

  let createdAt = Date.now();
  if (typeof tx.createdAt === 'number') {
    createdAt = tx.createdAt;
  } else if (tx.createdAt) {
    const parsed = new Date(tx.createdAt).getTime();
    if (!isNaN(parsed)) createdAt = parsed;
  }

  const isDebtRecovery = (type === 'income' && (tx.isDebtRecovery || category === 'Thu hồi nợ'));
  const isLoanGiven = (type === 'expense' && (tx.isLoanGiven || category === 'Cho vay'));

  return {
    id: tx.id || ('tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
    type: type,
    amount: Number(tx.amount) || 0,
    category: category,
    categoryIcon: icon,
    categoryId: tx.categoryId || (category === 'Cho vay' ? 'cho-vay' : (category === 'Thu hồi nợ' ? 'thu-no' : undefined)),
    note: tx.note || '',
    date: cleanDate || getNowDateString(),
    createdAt: createdAt,
    isDebtRecovery: isDebtRecovery,
    isLoanGiven: isLoanGiven
  };
}

function applyRestoredData(data) {
  if (!data || !Array.isArray(data.transactions)) {
    showToast('❌ Dữ liệu không đúng định dạng sao lưu!');
    return false;
  }
  if (State.transactions.length > 0 || (State.debts && State.debts.length > 0)) {
    const ok = confirm(`Khôi phục sẽ thay thế dữ liệu hiện tại bằng ${data.transactions.length} giao dịch và ${(data.debts || []).length} hồ sơ nợ từ bản sao lưu. Bạn có muốn tiếp tục?`);
    if (!ok) return false;
  }
  State.transactions = data.transactions.map(normalizeTransaction);
  State.debts = Array.isArray(data.debts) ? data.debts : [];
  if (typeof data.initialBalance === 'number' || !isNaN(Number(data.initialBalance))) {
    State.initialBalance = Number(data.initialBalance) || 0;
  }
  saveData();
  renderApp();
  showToast(`✅ Đã khôi phục thành công ${State.transactions.length} giao dịch & ${State.debts.length} hồ sơ nợ!`);
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
      debts: State.debts || [],
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
        if (State.transactions.length === 0 && (!State.debts || State.debts.length === 0)) {
          // Máy chưa có dữ liệu, nạp luôn từ đám mây
          State.transactions = data.transactions;
          State.debts = Array.isArray(data.debts) ? data.debts : [];
          if (typeof data.initialBalance === 'number') {
            State.initialBalance = data.initialBalance;
          }
          saveDataLocally();
          renderApp();
          showToast(`☁️ Đã đồng bộ ${data.transactions.length} giao dịch từ đám mây!`);
        } else {
          // Máy đã có dữ liệu, xác nhận khôi phục
          const ok = confirm(`Đám mây có ${data.transactions.length} giao dịch & ${(data.debts || []).length} hồ sơ nợ. Bạn có muốn tải về và khôi phục vào thiết bị này không?`);
          if (ok) {
            State.transactions = data.transactions;
            State.debts = Array.isArray(data.debts) ? data.debts : [];
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
