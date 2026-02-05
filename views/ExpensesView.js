/**
 * ⚠️ DEPRECATED VIEW (Phase 4)
 * This view is hidden from navigation.
 * TransactionsView is now the unified transaction hub.
 * Do NOT add features here.
 * Preserved for rollback safety only.
 */
/* ====== EXPENSES VIEW MODULE ====== */

class ExpensesView {
    constructor(app) {
        this.app = app;
        // Track selected chart period (null = ALL)
        this.selectedMonth = null;
        this.selectedYear = null;
    }

    // NEW ARCHITECTURE: Return HTML string only
    getHtml() {
        console.log('💸 Getting Expenses View HTML...');
        return this.getExpensesHTML();
    }

    // NEW ARCHITECTURE: Initialize after DOM injection
    afterRender() {
        console.log('✅ Expenses View rendered, initializing...');
        this.initialize();
    }

    getExpensesHTML() {
        // Calculate monthly total (current month only)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = this.app.state.transactions.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear;
        });

        const monthlyTotal = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = this.app.calculator.formatCurrency(monthlyTotal);
        const transactionCount = this.app.state.transactions.expenses.length;
        const avgDaily = Math.round(monthlyTotal / 30);
        const largestCategory = this.getLargestCategory();

        return `
            <div class="section-title">💸 Pengeluaran</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--danger);">
                        ${totalExpenses}
                    </div>
                    <div class="text-muted">Total pengeluaran bulan ini</div>
                </div>
                <button class="btn" id="addExpenseBtn">
                    <span>➕</span> Tambah Pengeluaran
                </button>
            </div>
            
            <div class="stats-grid" style="margin-bottom: var(--space-6);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Rata-rata Harian</div>
                            <div class="stat-value">${this.app.calculator.formatCurrency(avgDaily)}</div>
                        </div>
                        <div class="stat-icon">📅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Kategori Terbesar</div>
                            <div class="stat-value" id="largestCategory">${largestCategory}</div>
                        </div>
                        <div class="stat-icon">🏷️</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Transaksi</div>
                            <div class="stat-value">${transactionCount}</div>
                        </div>
                        <div class="stat-icon">📝</div>
                    </div>
                </div>
            </div>
            
            ${this.getExpenseChartHTML()}
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Pengeluaran</h3>
                    <div class="text-muted">${transactionCount} transaksi</div>
                </div>
                
                <div id="expensesList">
                    ${this.getExpensesListHTML()}
                </div>
            </div>
        `;
    }

    getExpensesListHTML() {
        if (this.app.state.transactions.expenses.length === 0) {
            return '<div class="text-center text-muted mt-6">Belum ada pengeluaran</div>';
        }

        // Sort by date DESC
        const sortedExpenses = [...this.app.state.transactions.expenses].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        return sortedExpenses.map(expense => `
            <div class="activity-item expense-activity" data-expense-id="${expense.id}">
                <div class="activity-icon">💸</div>
                <div class="activity-details">
                    <div class="activity-title">${expense.name}</div>
                    <div class="activity-meta">
                        <span>${this.app.uiManager.formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>${this.app.uiManager.getCategoryName(expense.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: var(--danger);">
                    - ${this.app.calculator.formatCurrency(expense.amount)}
                </div>
                
                <!-- Inline buttons for desktop -->
                <div class="expense-actions-desktop" style="display: flex; gap: 8px;">
                     <button class="btn-outline btn-sm" 
                            onclick="handleDuplicateTransaction('expenses', ${expense.id})"
                            style="padding: 6px 12px; font-size: 0.875rem;">
                        📄 Copy
                    </button>
                    <button class="btn-outline btn-sm" 
                            onclick="handleEditExpense(${expense.id})"
                            style="padding: 6px 12px; font-size: 0.875rem;">
                        ✏️ Edit
                    </button>
                    <button class="btn-outline btn-delete btn-sm" 
                            onclick="handleDeleteTransaction('expenses', ${expense.id})">
                        🗑️ Hapus
                    </button>
                </div>
                
                <!-- Overflow menu for mobile -->
                <div class="expense-actions-mobile">
                    <button class="expense-overflow-btn" onclick="toggleExpenseMenu(${expense.id})" aria-label="More actions">
                        ⋮
                    </button>
                    <div class="expense-overflow-menu" id="expense-menu-${expense.id}">
                        <button class="expense-menu-item" onclick="handleDuplicateTransaction('expenses', ${expense.id}); closeExpenseMenu(${expense.id})">
                            <span>📄</span> Duplicate
                        </button>
                        <button class="expense-menu-item" onclick="handleEditExpense(${expense.id}); closeExpenseMenu(${expense.id})">
                            <span>✏️</span> Edit
                        </button>
                        <button class="expense-menu-item expense-menu-delete" onclick="handleDeleteTransaction('expenses', ${expense.id}); closeExpenseMenu(${expense.id})">
                            <span>🗑️</span> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getLargestCategory() {
        const categoryTotals = {};

        this.app.state.transactions.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        let largestCategory = '-';
        let largestAmount = 0;

        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > largestAmount) {
                largestAmount = amount;
                largestCategory = this.app.uiManager.getCategoryName(category);
            }
        }

        return largestCategory;
    }

    getExpenseChartHTML() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Initialize selected filters to current month/year on first render
        if (this.selectedMonth === undefined) {
            this.selectedMonth = currentMonth;
            this.selectedYear = currentYear;
        }

        // Generate month options with ALL
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        // USER ENHANCEMENT: Add ALL option to month filter
        const monthOptions = '<option value="all">Semua Bulan</option>' +
            months.map((name, index) =>
                `<option value="${index}" ${index === currentMonth ? 'selected' : ''}>${name}</option>`
            ).join('');

        // Generate year options with ALL (current year and 2 years back)
        const years = [];
        for (let i = 0; i < 3; i++) {
            years.push(currentYear - i);
        }

        // USER ENHANCEMENT: Add ALL option to year filter  
        const yearOptions = '<option value="all">Semua Tahun</option>' +
            years.map(year =>
                `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
            ).join('');

        return `
            <div class="chart-section" style="margin-bottom: var(--space-6); background: var(--card-bg); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin: 0;">
                        📊 Distribusi Pengeluaran
                    </h3>
                    <div style="display: flex; gap: 8px;">
                        <select id="expenseChartMonth" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); font-size: 0.875rem; cursor: pointer;">
                            ${monthOptions}
                        </select>
                        <select id="expenseChartYear" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); font-size: 0.875rem; cursor: pointer;">
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                
                <div id="chartContainer" style="position: relative; height: 300px; margin-bottom: var(--space-4);">
                    <canvas id="expenseChart"></canvas>
                </div>
                
                <div id="chartSummary" style="padding-top: var(--space-4); border-top: 1px solid var(--border-divider);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="text-muted" style="font-size: 0.875rem; margin-bottom: 4px;">
                                Total untuk <span id="chartPeriodLabel">${months[currentMonth]} ${currentYear}</span>
                            </div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);" id="chartTotalAmount">
                                Rp 0
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getChartData(month, year) {
        // USER ENHANCEMENT: Handle ALL filter combinations
        let filteredExpenses;

        if (month === 'all' && year === 'all') {
            // Show all expenses (all time)
            filteredExpenses = this.app.state.transactions.expenses;
        } else if (month === 'all' && year !== 'all') {
            // Show entire year
            filteredExpenses = this.app.state.transactions.expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === parseInt(year);
            });
        } else if (month !== 'all' && year === 'all') {
            // This combination doesn't make logical sense, but handle it by showing specific month across all years
            filteredExpenses = this.app.state.transactions.expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === parseInt(month);
            });
        } else {
            // Specific month and year
            filteredExpenses = this.app.state.transactions.expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === parseInt(month) && expenseDate.getFullYear() === parseInt(year);
            });
        }

        // Check if empty
        if (filteredExpenses.length === 0) {
            return null; // Signal empty state
        }

        // Group by category
        const categoryTotals = {};
        filteredExpenses.forEach(expense => {
            const categoryName = this.app.uiManager.getCategoryName(expense.category);
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount;
        });

        // Convert to arrays for Chart.js
        const labels = [];
        const data = [];
        const colors = [];

        // Color palette for categories
        const colorPalette = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        let colorIndex = 0;
        for (const [category, amount] of Object.entries(categoryTotals)) {
            labels.push(category);
            data.push(amount);
            colors.push(colorPalette[colorIndex % colorPalette.length]);
            colorIndex++;
        }

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 8
            }]
        };
    }

    initializeExpenseChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) {
            console.warn('⚠️ Chart canvas not found');
            return;
        }

        // USER BUG FIX: Read selected values from DOM dropdowns, not defaults
        const monthSelect = document.getElementById('expenseChartMonth');
        const yearSelect = document.getElementById('expenseChartYear');

        const selectedMonth = monthSelect?.value || String(new Date().getMonth());
        const selectedYear = yearSelect?.value || String(new Date().getFullYear());

        // Track selected filters
        this.selectedMonth = selectedMonth;
        this.selectedYear = selectedYear;

        console.log('📊 Initializing chart with filter:', { month: selectedMonth, year: selectedYear });

        const chartData = this.getChartData(selectedMonth, selectedYear);

        // Handle empty state
        if (!chartData) {
            this.showEmptyChartState(selectedMonth, selectedYear);
            return;
        }

        // Destroy existing chart if it exists
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        // Calculate total for tooltip percentage
        const total = chartData.datasets[0].data.reduce((sum, val) => sum + val, 0);

        // Create new chart
        this.expenseChart = new Chart(canvas, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-primary').trim() || '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const formatted = this.app.calculator.formatCurrency(value);
                                // USER CLARIFICATION: Calculate percentage from dataset total
                                const datasetTotal = context.dataset.data.reduce((s, v) => s + v, 0);
                                const percentage = ((value / datasetTotal) * 100).toFixed(1);
                                return `${label}: ${formatted} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Update summary
        this.updateChartSummary(total, selectedMonth, selectedYear);

        console.log('✅ Expense chart initialized');
    }

    showEmptyChartState(month, year) {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        // USER BUG FIX: Generate period label based on selected filter, not current date
        const periodLabel = this.getPeriodLabel(month, year);

        // USER CLARIFICATION: Empty state handling
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📊</div>
                <div style="font-size: 1rem; font-weight: 500; margin-bottom: 0.5rem;">Tidak Ada Data</div>
                <div style="font-size: 0.875rem;">Belum ada pengeluaran untuk ${periodLabel}</div>
            </div>
        `;

        // Update summary to show zero
        this.updateChartSummary(0, month, year);
    }

    getPeriodLabel(month, year) {
        // USER ENHANCEMENT: Generate appropriate label for ALL combinations
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        if (month === 'all' && year === 'all') {
            return 'Semua Periode';
        } else if (month === 'all' && year !== 'all') {
            return `Tahun ${year}`;
        } else if (month !== 'all' && year === 'all') {
            return `${months[parseInt(month)]} (Semua Tahun)`;
        } else {
            return `${months[parseInt(month)]} ${year}`;
        }
    }

    updateChartSummary(total, month, year) {
        const periodLabel = this.getPeriodLabel(month, year);

        const periodLabelEl = document.getElementById('chartPeriodLabel');
        if (periodLabelEl) {
            periodLabelEl.textContent = periodLabel;
        }

        const totalAmount = document.getElementById('chartTotalAmount');
        if (totalAmount) {
            totalAmount.textContent = this.app.calculator.formatCurrency(total);
        }
    }

    setupChartFilters() {
        const monthSelect = document.getElementById('expenseChartMonth');
        const yearSelect = document.getElementById('expenseChartYear');

        if (monthSelect) {
            monthSelect.addEventListener('change', () => this.updateChart());
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', () => this.updateChart());
        }

        console.log('✅ Chart filters initialized');
    }

    updateChart() {
        // USER CRITICAL FIX: Prevent chart updates if view is not active
        if (this.app.state.activeTab !== 'expenses') {
            console.log('⚠️ ExpensesView.updateChart() called but view is not active, skipping');
            return;
        }

        // USER BUG FIX: Read values as strings to properly handle 'all' option
        const monthSelect = document.getElementById('expenseChartMonth');
        const yearSelect = document.getElementById('expenseChartYear');

        const month = monthSelect?.value || String(new Date().getMonth());
        const year = yearSelect?.value || String(new Date().getFullYear());

        // Track selected filters
        this.selectedMonth = month;
        this.selectedYear = year;

        console.log(`🔄 Updating chart for period: ${this.getPeriodLabel(month, year)}`);

        const chartData = this.getChartData(month, year);

        // Handle empty state
        if (!chartData) {
            // USER BUG FIX: Destroy chart and restore canvas before showing empty state
            if (this.expenseChart) {
                this.expenseChart.destroy();
                this.expenseChart = null;
            }

            // Restore canvas element
            const container = document.getElementById('chartContainer');
            if (container && !document.getElementById('expenseChart')) {
                container.innerHTML = '<canvas id="expenseChart"></canvas>';
            }

            this.showEmptyChartState(month, year);
            return;
        }

        // USER BUG FIX: Always destroy and reinitialize chart to prevent stale state
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }

        // Restore canvas if needed
        const container = document.getElementById('chartContainer');
        if (container && !document.getElementById('expenseChart')) {
            container.innerHTML = '<canvas id="expenseChart"></canvas>';
        }

        // Reinitialize chart with new data
        this.initializeExpenseChart();
    }

    initialize() {
        // Add expense button
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addExpenseModal');
        });

        // Setup delete handlers
        this.setupDeleteHandlers();

        // Setup chart filters and initialize chart
        this.setupChartFilters();
        this.initializeExpenseChart();
    }

    destroy() {
        // USER BUG FIX: Proper cleanup when switching away from Expenses view
        console.log('🧹 Cleaning up ExpensesView...');

        // Destroy Chart.js instance
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
            console.log('✅ Chart.js instance destroyed');
        }

        // Clear selected filter state
        this.selectedMonth = null;
        this.selectedYear = null;

        // Note: Global event listeners (toggleExpenseMenu, closeExpenseMenu, click-outside)
        // are attached to window/document and will be reused on next render
        // They don't need to be removed as they won't cause issues

        console.log('✅ ExpensesView cleanup complete');
    }

    setupDeleteHandlers() {
        // Handlers are attached via onclick in the HTML
    }

    refresh() {
        // USER CRITICAL FIX: Prevent refresh if this view is not currently active
        // This prevents ExpensesView from manipulating Dashboard's DOM
        if (this.app.state.activeTab !== 'expenses') {
            console.log('⚠️ ExpensesView.refresh() called but view is not active, skipping');
            return;
        }

        // 1. HITUNG ULANG TOTAL PENGELUARAN BULAN INI
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = this.app.state.transactions.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear;
        });

        const totalExpenses = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

        // Update state
        this.app.state.finances.expenses = totalExpenses;

        // 2. UPDATE UI: TOTAL PENGELUARAN BULAN INI
        // Cari element yang menampilkan total (biasanya setelah section-title)
        const totalExpenseEl = document.querySelector('.section-title + div div:first-child div:first-child');
        if (totalExpenseEl) {
            totalExpenseEl.textContent = this.app.calculator.formatCurrency(totalExpenses);
            totalExpenseEl.style.color = 'var(--danger)'; // Pastikan warna merah
        }

        // 3. UPDATE EXPENSES LIST
        const expensesListEl = document.getElementById('expensesList');
        if (expensesListEl) {
            expensesListEl.innerHTML = this.getExpensesListHTML();
        }

        // 4. UPDATE LARGEST CATEGORY
        const largestCategoryEl = document.getElementById('largestCategory');
        if (largestCategoryEl) {
            largestCategoryEl.textContent = this.getLargestCategory();
        }

        // 5. UPDATE EXPENSE ANALYSIS
        const expenseAnalysisEl = document.getElementById('expenseAnalysis');
        if (expenseAnalysisEl) {
            expenseAnalysisEl.innerHTML = this.getExpenseAnalysis();
        }

        // 6. UPDATE TRANSACTION COUNT (di activity section)
        const transactionCountEl = document.querySelector('.activity-section .text-muted');
        if (transactionCountEl) {
            transactionCountEl.textContent = `${this.app.state.transactions.expenses.length} transaksi`;
        }

        // 7. UPDATE AVG MONTHLY (stat card pertama)
        const avgMonthly = Math.round(totalExpenses / 12);
        const avgMonthlyEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
        if (avgMonthlyEl) {
            avgMonthlyEl.textContent = this.app.calculator.formatCurrency(avgMonthly);
        }

        // 8. UPDATE TRANSACTION COUNT IN STAT CARD (stat card ketiga)
        const transactionCountCardEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
        if (transactionCountCardEl) {
            transactionCountCardEl.textContent = this.app.state.transactions.expenses.length;
        }

        // 9. UPDATE MONTHLY STATS
        const monthlyStatsEl = document.querySelector('.dashboard-grid:nth-of-type(2) .activity-section > div');
        if (monthlyStatsEl && monthlyStatsEl.parentElement.querySelector('.section-title').textContent.includes('Bulanan')) {
            monthlyStatsEl.innerHTML = this.getMonthlyStats();
        }

        // USER BUG FIX: Update chart when data changes (added/edited/deleted expense)
        // This ensures chart reflects current data without requiring page refresh
        if (this.expenseChart || document.getElementById('expenseChart')) {
            this.updateChart();
        }

        console.log('Expense view refreshed with total:', totalExpenses);
    }
}

// Global handler for editing expenses
window.handleEditExpense = function (id) {
    const expense = window.app.state.transactions.expenses.find(e => e.id == id);
    if (!expense) {
        console.error('❌ Expense not found:', id);
        return;
    }

    console.log('✏️ Editing expense:', expense);

    // Populate form fields
    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseCategory').value = expense.category;
    document.getElementById('editExpenseAccount').value = expense.accountId || '';
    document.getElementById('editExpenseDate').value = expense.date;
    document.getElementById('editExpenseNote').value = expense.note || '';

    // Populate dropdowns
    window.app.formHandlers.populateAccountSelect('#editExpenseAccount');
    window.app.formHandlers.populateCategorySelect('#editExpenseCategory', 'expense');

    // Open modal
    window.app.uiManager.openModal('editExpenseModal');
};

// Global handlers for overflow menu (mobile)
window.toggleExpenseMenu = function (id) {
    const menu = document.getElementById(`expense-menu-${id}`);
    if (!menu) return;

    // Close all other menus first
    document.querySelectorAll('.expense-overflow-menu').forEach(m => {
        if (m.id !== `expense-menu-${id}`) {
            m.classList.remove('active');
        }
    });

    // Toggle this menu
    menu.classList.toggle('active');
};

window.closeExpenseMenu = function (id) {
    const menu = document.getElementById(`expense-menu-${id}`);
    if (menu) {
        menu.classList.remove('active');
    }
};

// Close menu when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.expense-actions-mobile')) {
        document.querySelectorAll('.expense-overflow-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

export default ExpensesView;