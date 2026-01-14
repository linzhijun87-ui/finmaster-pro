/* ====== EXPENSES VIEW MODULE ====== */

class ExpensesView {
    constructor(app) {
        this.app = app;
    }

    render() {
        console.log('💸 Rendering Expenses View...');
        
        const html = this.getExpensesHTML();
        this.app.elements.mainContent.innerHTML = html;
        
        // Initialize after DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 50);
    }

    getExpensesHTML() {
        const totalExpenses = this.app.calculator.formatCurrency(this.app.state.finances.expenses);
        const transactionCount = this.app.state.transactions.expenses.length;
        const avgDaily = Math.round(this.app.state.finances.expenses / 30);
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
        
        return this.app.state.transactions.expenses.map(expense => `
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
                <button class="btn-outline" style="margin-left: var(--space-2); font-size: 0.875rem;" 
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
        const expensesListEl = document.getElementById('expensesList');
        if (expensesListEl) {
            expensesListEl.innerHTML = this.getExpensesListHTML();
        }
        
        const largestCategoryEl = document.getElementById('largestCategory');
        if (largestCategoryEl) {
            largestCategoryEl.textContent = this.getLargestCategory();
        }
        
        // Update transaction count
        const transactionCountEl = document.querySelector('.activity-section .text-muted');
        if (transactionCountEl) {
            transactionCountEl.textContent = `${this.app.state.transactions.expenses.length} transaksi`;
        }
    }
}

export default ExpensesView;