/* ====== ANALYSIS VIEW MODULE ====== */

class AnalysisView {
    constructor(app) {
        this.app = app;
        this.expenseChart = null;
        this.trendChart = null;

        // Period state - single source of truth
        this.selectedPeriod = 'current-month'; // current-month, last-3-months, last-6-months, last-12-months, custom
        this.customStartDate = null;
        this.customEndDate = null;
    }

    // ====== VIEW LIFECYCLE ======

    getHtml() {
        console.log('📊 Getting Analysis View HTML...');
        return `
            <!-- Header with Period Selector -->
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                gap: var(--space-4); 
                margin-bottom: var(--space-6);
                flex-wrap: wrap;
            ">
                <div style="flex: 1; min-width: 0;">
                    <div class="section-title" style="margin-bottom: var(--space-2); color: var(--text-primary);">🔍 Analisis</div>
                    <div class="text-muted" style="font-size: 0.9375rem; line-height: 1.5;">
                        Pahami pola keuangan Anda dengan visualisasi yang jelas
                    </div>
                </div>
                
                <!-- Period Selector -->
                <div style="flex-shrink: 0; position: relative;">
                    <button id="periodSelectorBtn" style="
                        font-size: 0.875rem;
                        padding: 8px 12px;
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        background: var(--surface-secondary);
                        color: var(--text-primary);
                        cursor: pointer;
                        outline: none;
                        transition: border-color 0.15s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                        <span id="periodSelectorText">Bulan Ini</span>
                        <span style="font-size: 0.75rem; opacity: 0.6;">▼</span>
                    </button>
                    
                    <div id="periodDropdownPanel" style="
                        display: none;
                        position: absolute;
                        top: 100%;
                        right: 0;
                        margin-top: 4px;
                        background: var(--surface);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        min-width: 180px;
                        z-index: 100;
                        overflow: hidden;
                    ">
                        <div class="period-option" data-value="current-month" style="padding: 10px 14px; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: background 0.15s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">Bulan Ini</div>
                        <div class="period-option" data-value="last-3-months" style="padding: 10px 14px; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: background 0.15s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">3 Bulan Terakhir</div>
                        <div class="period-option" data-value="last-6-months" style="padding: 10px 14px; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: background 0.15s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">6 Bulan Terakhir</div>
                        <div class="period-option" data-value="last-12-months" style="padding: 10px 14px; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: background 0.15s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">12 Bulan Terakhir</div>
                        <div class="period-option" data-value="custom" style="padding: 10px 14px; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); transition: background 0.15s; border-top: 1px solid var(--border-color);" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">Rentang Khusus...</div>
                    </div>
                </div>
            </div>

            <!-- Insight (Optional) -->
            ${this.getInsightHTML()}

            <!-- Overview Metrics -->
            <div class="analysis-metrics" style="
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
                gap: var(--space-4); 
                margin-bottom: var(--space-6);
            ">
                ${this.getOverviewMetrics()}
            </div>

            <!-- Charts Container -->
            <div style="
                display: grid; 
                grid-template-columns: 1fr;
                gap: var(--space-5);
            ">
                <!-- Expense Composition -->
                <div class="chart-card" style="
                    background: var(--surface-secondary); 
                    border-radius: 12px; 
                    padding: var(--space-5); 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                ">
                    <h3 style="margin: 0 0 var(--space-4) 0; font-size: 1.125rem; color: var(--text-primary);">
                        Komposisi Pengeluaran
                    </h3>
                    <div style="max-width: 400px; margin: 0 auto;">
                        <canvas id="expenseCompositionChart"></canvas>
                    </div>
                </div>

                <!-- Trend Chart -->
                <div class="chart-card" style="
                    background: var(--surface-secondary); 
                    border-radius: 12px; 
                    padding: var(--space-5); 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                ">
                    <h3 style="margin: 0 0 var(--space-4) 0; font-size: 1.125rem; color: var(--text-primary);">
                        Tren Pemasukan vs Pengeluaran
                    </h3>
                    <canvas id="trendChart"></canvas>
                </div>
            </div>

            <!-- Custom Date Range Modal -->
            <div id="customDateRangeModal" class="modal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 style="margin: 0; font-size: 1.125rem; color: var(--text-primary);">Pilih Rentang Tanggal</h3>
                        <button class="close-btn" id="closeCustomDateModal" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            cursor: pointer;
                            color: var(--text-muted);
                            padding: 0;
                            line-height: 1;
                        ">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: var(--space-5) 0;">
                        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                            <div>
                                <label style="display: block; margin-bottom: var(--space-2); font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
                                    Tanggal Mulai
                                </label>
                                <input type="date" id="customStartDate" class="input" style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    border: 1px solid var(--border-color);
                                    border-radius: 8px;
                                    background: var(--surface-secondary);
                                    color: var(--text-primary);
                                    font-size: 0.875rem;
                                ">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--space-2); font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
                                    Tanggal Akhir
                                </label>
                                <input type="date" id="customEndDate" class="input" style="
                                    width: 100%;
                                    padding: 8px 12px;
                                    border: 1px solid var(--border-color);
                                    border-radius: 8px;
                                    background: var(--surface-secondary);
                                    color: var(--text-primary);
                                    font-size: 0.875rem;
                                ">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: var(--space-3); justify-content: flex-end;">
                        <button id="cancelCustomDateBtn" class="btn btn-outline" style="padding: 8px 16px;">
                            Batal
                        </button>
                        <button id="applyCustomDateBtn" class="btn btn-primary" style="padding: 8px 16px;">
                            Terapkan
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        console.log('📊 Analysis View rendered, initializing charts...');
        this.setupEventListeners();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Period selector dropdown toggle
        const periodBtn = document.getElementById('periodSelectorBtn');
        const periodPanel = document.getElementById('periodDropdownPanel');
        const periodText = document.getElementById('periodSelectorText');

        if (periodBtn && periodPanel) {
            // Update button text based on current selection
            const periodLabels = {
                'current-month': 'Bulan Ini',
                'last-3-months': '3 Bulan Terakhir',
                'last-6-months': '6 Bulan Terakhir',
                'last-12-months': '12 Bulan Terakhir',
                'custom': 'Rentang Khusus'
            };
            if (periodText) {
                periodText.textContent = periodLabels[this.selectedPeriod] || 'Bulan Ini';
            }

            // Toggle dropdown
            periodBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                periodPanel.style.display = periodPanel.style.display === 'none' ? 'block' : 'none';
            });

            // Handle period selection
            const periodOptions = periodPanel.querySelectorAll('.period-option');
            periodOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;

                    if (value === 'custom') {
                        periodPanel.style.display = 'none';
                        this.showCustomDateModal();
                    } else {
                        this.selectedPeriod = value;
                        periodText.textContent = e.target.textContent;
                        periodPanel.style.display = 'none';
                        // Trigger full refresh via Single Render Owner
                        this.app.refreshCurrentView();
                    }
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!periodBtn.contains(e.target) && !periodPanel.contains(e.target)) {
                    periodPanel.style.display = 'none';
                }
            });
        }

        // Custom date modal event listeners
        const closeModalBtn = document.getElementById('closeCustomDateModal');
        const cancelBtn = document.getElementById('cancelCustomDateBtn');
        const applyBtn = document.getElementById('applyCustomDateBtn');

        if (closeModalBtn) {
            closeModalBtn.onclick = () => this.closeCustomDateModal();
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeCustomDateModal();
        }

        if (applyBtn) {
            applyBtn.onclick = () => this.applyCustomDateRange();
        }
    }

    showCustomDateModal() {
        const modal = document.getElementById('customDateRangeModal');
        if (!modal) return;

        // Set default values
        const startInput = document.getElementById('customStartDate');
        const endInput = document.getElementById('customEndDate');

        if (startInput && endInput) {
            // Default: last month to today
            if (!this.customStartDate) {
                const defaultStart = new Date();
                defaultStart.setMonth(defaultStart.getMonth() - 1);
                startInput.value = this.formatDateForInput(defaultStart);
            } else {
                startInput.value = this.customStartDate;
            }

            if (!this.customEndDate) {
                endInput.value = this.formatDateForInput(new Date());
            } else {
                endInput.value = this.customEndDate;
            }
        }

        // Open modal via UIManager
        this.app.uiManager.openModal('customDateRangeModal');
    }

    closeCustomDateModal() {
        // Reset selector to previous value if custom was not applied
        const periodSelector = document.getElementById('periodSelector');
        if (periodSelector && this.selectedPeriod !== 'custom') {
            periodSelector.value = this.selectedPeriod;
        }

        // UIManager.closeModal() doesn't need modal ID
        this.app.uiManager.closeModal();
    }

    applyCustomDateRange() {
        const startInput = document.getElementById('customStartDate');
        const endInput = document.getElementById('customEndDate');

        if (startInput && endInput && startInput.value && endInput.value) {
            const startDate = new Date(startInput.value);
            const endDate = new Date(endInput.value);

            if (startDate > endDate) {
                alert('Tanggal mulai harus sebelum tanggal akhir');
                return;
            }

            this.customStartDate = startInput.value;
            this.customEndDate = endInput.value;
            this.selectedPeriod = 'custom';

            this.app.uiManager.closeModal();
            this.app.refreshCurrentView();
        } else {
            alert('Harap isi kedua tanggal');
        }
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    destroy() {
        console.log('🧹 Destroying Analysis View...');

        // Destroy chart instances
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }

        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
    }

    // ====== HTML GENERATION ======

    getInsightHTML() {
        if (!this.app.insightEngine) return '';

        const insight = this.app.insightEngine.getInsight('analysis');
        if (!insight) return ''; // Silence is valid

        let bgColor, borderColor;
        switch (insight.type) {
            case 'positive':
                bgColor = 'rgba(52, 199, 89, 0.1)';
                borderColor = 'rgba(52, 199, 89, 0.3)';
                break;
            case 'awareness':
                bgColor = 'rgba(255, 159, 10, 0.1)';
                borderColor = 'rgba(255, 159, 10, 0.3)';
                break;
            default:
                bgColor = 'rgba(142, 142, 147, 0.1)';
                borderColor = 'rgba(142, 142, 147, 0.3)';
        }

        return `
            <div style="
                margin-bottom: var(--space-5);
                padding: 16px 18px;
                border-radius: 12px;
                background: ${bgColor};
                border-left: 4px solid ${borderColor};
                display: flex;
                align-items: center;
                gap: 14px;
            ">
                <div style="font-size: 1.75rem; line-height: 1;">${insight.icon}</div>
                <div style="flex: 1; font-size: 0.95rem; line-height: 1.5; color: var(--text-primary);">
                    ${insight.message}
                </div>
            </div>
        `;
    }

    getOverviewMetrics() {
        const { startDate, endDate } = this.getPeriodRange();

        // Calculate totals for selected period
        const totalIncome = this.calculateTotalForRange('income', startDate, endDate);
        const totalExpense = this.calculateTotalForRange('expense', startDate, endDate);
        const netCashflow = totalIncome - totalExpense;

        // Dynamic label based on period
        const periodLabel = this.getPeriodLabel();

        return `
            ${this.getMetricCard(`Pemasukan ${periodLabel}`, totalIncome, '💰', 'var(--amount-in, #059669)')}
            ${this.getMetricCard(`Pengeluaran ${periodLabel}`, totalExpense, '💸', 'var(--amount-out, #dc2626)')}
            ${this.getMetricCard('Arus Kas Bersih', netCashflow, '📊', netCashflow >= 0 ? 'var(--amount-in, #059669)' : 'var(--amount-out, #dc2626)')}
        `;
    }

    getMetricCard(label, value, icon, color) {
        return `
            <div style="
                background: var(--surface-secondary, rgba(0,0,0,0.02)); 
                border-radius: 12px; 
                padding: var(--space-4); 
                display: flex;
                flex-direction: column;
                gap: var(--space-2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.875rem; color: var(--text-muted);">${label}</span>
                    <span style="font-size: 1.5rem; opacity: 0.8;">${icon}</span>
                </div>
                <div style="font-size: 1.5rem; font-weight: 600; color: ${color};">
                    ${this.app.calculator.formatCurrency(value)}
                </div>
            </div>
        `;
    }

    // ====== DATA CALCULATION ======

    getPeriodRange() {
        const now = new Date();
        let startDate, endDate;

        switch (this.selectedPeriod) {
            case 'current-month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-3-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-6-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-12-months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'custom':
                startDate = new Date(this.customStartDate);
                endDate = new Date(this.customEndDate);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return { startDate, endDate };
    }

    getPeriodLabel() {
        switch (this.selectedPeriod) {
            case 'current-month': return 'Bulan Ini';
            case 'last-3-months': return '3 Bulan Terakhir';
            case 'last-6-months': return '6 Bulan Terakhir';
            case 'last-12-months': return '12 Bulan Terakhir';
            case 'custom': return 'Periode Khusus';
            default: return 'Bulan Ini';
        }
    }

    calculateTotalForRange(type, startDate, endDate) {
        const transactions = type === 'income'
            ? this.app.state.transactions.income
            : this.app.state.transactions.expenses;

        if (!transactions) return 0;

        return transactions
            .filter(tx => {
                const date = new Date(tx.date);
                return date >= startDate && date <= endDate;
            })
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    getExpenseByCategory() {
        const expenses = this.app.state.transactions.expenses || [];
        const { startDate, endDate } = this.getPeriodRange();
        const byCategory = {};

        expenses
            .filter(exp => {
                const date = new Date(exp.date);
                return date >= startDate && date <= endDate;
            })
            .forEach(exp => {
                // CRITICAL FIX: Resolve category key to name
                const categoryKey = exp.category || 'uncategorized';
                const categoryName = this.app.categoryManager
                    ? this.app.categoryManager.getCategoryName(categoryKey)
                    : (categoryKey || 'Tidak berkategori');

                byCategory[categoryName] = (byCategory[categoryName] || 0) + exp.amount;
            });

        return byCategory;
    }

    getMonthlyTrends() {
        const { startDate, endDate } = this.getPeriodRange();

        // ADAPTIVE GRANULARITY: Detect if period is within same month
        const isSameMonth = startDate.getFullYear() === endDate.getFullYear() &&
            startDate.getMonth() === endDate.getMonth();

        if (isSameMonth) {
            // DAILY AGGREGATION for single-month periods
            return this.getDailyTrends(startDate, endDate);
        } else {
            // MONTHLY AGGREGATION for multi-month periods
            return this.getMonthlyTrendsOriginal(startDate, endDate);
        }
    }

    getDailyTrends(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            // Format: "1", "2", "3", etc.
            labels.push(currentDate.getDate().toString());
            incomeData.push(this.calculateTotalForRange('income', dayStart, dayEnd));
            expenseData.push(this.calculateTotalForRange('expense', dayStart, dayEnd));

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { labels, incomeData, expenseData };
    }

    getMonthlyTrendsOriginal(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        // Generate monthly data points based on selected period
        const monthsDiff = this.getMonthsDifference(startDate, endDate);
        const numPoints = Math.min(monthsDiff + 1, 12); // Cap at 12 months for readability

        for (let i = 0; i < numPoints; i++) {
            const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            labels.push(this.getMonthName(monthDate.getMonth()));
            incomeData.push(this.calculateTotalForRange('income', monthStart, monthEnd));
            expenseData.push(this.calculateTotalForRange('expense', monthStart, monthEnd));
        }

        return { labels, incomeData, expenseData };
    }

    getMonthsDifference(startDate, endDate) {
        return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());
    }

    getMonthName(index) {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][index];
    }

    // ====== CHART INITIALIZATION ======

    initializeCharts() {
        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }

        this.initExpenseChart();
        this.initTrendChart();
    }

    initExpenseChart() {
        const canvas = document.getElementById('expenseCompositionChart');
        if (!canvas) return;

        const byCategory = this.getExpenseByCategory();
        const labels = Object.keys(byCategory);
        const data = Object.values(byCategory);

        if (labels.length === 0) {
            canvas.parentElement.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: var(--space-3); opacity: 0.6;">📭</div>
                    <div>Belum ada data pengeluaran</div>
                </div>
            `;
            return;
        }

        // Generate colors
        const colors = this.generateColors(labels.length);

        // COPY DASHBOARD PATTERN: Dark mode detection
        const isDark = document.body.classList.contains('dark-mode');

        const textColor = isDark
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(0, 0, 0, 0.8)';

        const backgroundColor = isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(255, 255, 255, 0.95)';

        const titleColor = isDark
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(0, 0, 0, 0.9)';

        const bodyColor = isDark
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(0, 0, 0, 0.7)';

        const borderColor = isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(255, 255, 255, 1)';

        this.expenseChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: borderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12, family: 'Inter, sans-serif', weight: '600' },
                            color: textColor,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: backgroundColor,
                        titleColor: titleColor,
                        bodyColor: bodyColor,
                        borderColor: 'rgba(67, 97, 238, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${this.app.calculator.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        const { labels, incomeData, expenseData } = this.getMonthlyTrends();

        if (incomeData.every(v => v === 0) && expenseData.every(v => v === 0)) {
            canvas.parentElement.innerHTML = `
                <div style="text-align: center; padding: var(--space-8); color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: var(--space-3); opacity: 0.6;">📭</div>
                    <div>Belum ada data untuk ditampilkan</div>
                </div>
            `;
            return;
        }

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        const backgroundColor = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        const titleColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
        const bodyColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        const gridColor = this.getGridColor();

        this.trendChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: incomeData,
                        borderColor: 'rgba(5, 150, 105, 1)',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'Pengeluaran',
                        data: expenseData,
                        borderColor: 'rgba(220, 38, 38, 1)',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12, family: 'Inter, sans-serif', weight: '600' },
                            color: textColor,
                            usePointStyle: true,
                            padding: 20,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: backgroundColor,
                        titleColor: titleColor,
                        bodyColor: bodyColor,
                        borderColor: 'rgba(67, 97, 238, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.app.calculator.formatCurrency(context.parsed.y)} `;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: gridColor,
                            drawBorder: false,
                            drawTicks: false
                        },
                        ticks: {
                            color: textColor,
                            font: { size: 11, family: 'Inter, sans-serif', weight: '500' },
                            callback: (value) => {
                                // Mobile: shorten numbers for better readability
                                const isMobile = window.innerWidth < 640;
                                if (isMobile && value >= 1000000) {
                                    const millions = value / 1000000;
                                    return millions % 1 === 0
                                        ? `${millions} jt`
                                        : `${millions.toFixed(1)} jt`;
                                }
                                return this.app.calculator.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: true,
                            color: gridColor,
                            drawBorder: false,
                            drawTicks: false
                        },
                        ticks: {
                            color: textColor,
                            font: { size: 11, family: 'Inter, sans-serif', weight: '500' }
                        }
                    }
                }
            }
        });
    }

    // ====== UTILITIES ======

    generateColors(count) {
        const baseColors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];

        return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
    }

    isDarkMode() {
        return document.body.classList.contains('dark-mode') ||
            document.documentElement.getAttribute('data-theme') === 'dark';
    }

    getTextColor() {
        return this.isDarkMode() ? '#f8fafc' : '#1e293b';
    }

    getSecondaryTextColor() {
        return this.isDarkMode() ? '#cbd5e1' : '#64748b';
    }

    getGridColor() {
        return this.isDarkMode() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    }

    getTooltipBackground() {
        return this.isDarkMode() ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    }
}

export default AnalysisView;
