/* ====== EXPENSES VIEW MODULE ====== */

class ExpensesView {
    constructor(app) {
        this.app = app;
    }

    render() {
        console.log('💸 Rendering Expenses View...');

        const html = this.getExpensesHTML();
        this.app.elements.mainContent.innerHTML = html;
        this.app.elements.mainContent.className = 'main-content expenses-view';

        // Initialize after DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 50);
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
                <button class="btn-outline btn-delete btn-delete-sm" 
                        onclick="handleDeleteTransaction('expenses', ${expense.id})">
                    Hapus
                </button>
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

    initialize() {
        // Add expense button
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addExpenseModal');
        });

        // Setup delete handlers
        this.setupDeleteHandlers();
    }

    setupDeleteHandlers() {
        // Handlers are attached via onclick in the HTML
    }

    refresh() {
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

        console.log('Expense view refreshed with total:', totalExpenses);
    }
}

export default ExpensesView;