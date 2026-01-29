/* ====== BUDGET VIEW MODULE ====== */

class BudgetView {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        this.currentFilter = 'all'; // 'all' or specific category
        this.isFlipped = false;
    }

    render() {
        console.log('📊 Rendering Budget View...');

        const html = this.getBudgetHTML();
        this.app.elements.mainContent.innerHTML = html;
        this.app.elements.mainContent.className = 'main-content budget-view';

        // Initialize components
        setTimeout(() => {
            this.initializeComponents();
            this.app.uiManager.setupScrollReveal();
        }, 100);
    }

    getBudgetHTML() {
        return `
            <div class="section-title">📊 Budget</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <div class="text-muted">Kelola batasan pengeluaran</div>
                
                <div style="display: flex; gap: var(--space-3); align-items: center;">
                    <button class="btn btn-primary btn-sm" id="addBudgetBtn">
                        <span style="margin-right:4px">➕</span> Tambah Budget
                    </button>
                    
                    <div class="filter-wrapper" style="min-width: 160px;">
                        <select id="categoryFilter" class="filter-select input-sm" style="padding: 8px 12px; font-size: 0.875rem; width: 100%;">
                            <option value="all">Semua Kategori</option>
                            <option value="kebutuhan">🛒 Kebutuhan</option>
                            <option value="hiburan">🎮 Hiburan</option>
                            <option value="transport">🚗 Transport</option>
                            <option value="kesehatan">🏥 Kesehatan</option>
                            <option value="pendidikan">📚 Pendidikan</option>
                            <option value="lainnya">📦 Lainnya</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- BUDGET CARDS GRID -->
            <div class="budget-grid reveal-on-scroll" id="budgetGrid">
                ${this.getBudgetCardsHTML()}
            </div>

            <!-- COMPACT SUMMARY STATS (FOOTER) -->
            <div class="budget-summary-footer reveal-on-scroll">
                 ${this.getStatsHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const budgets = this.app.state.budgets || [];
        const budgetsWithSpending = this.app.calculator.getBudgetsWithSpending();

        const totalBudgets = budgets.length;
        const totalAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
        const overspentCount = budgetsWithSpending.filter(b => b.status === 'overspent').length;
        const activeBudgets = budgetsWithSpending.filter(b => b.progress > 0).length;

        return `
            <div class="compact-stats-bar">
                <div class="compact-stat-item">
                    <span class="compact-stat-label">Total Anggaran:</span>
                    <span class="compact-stat-value">${this.app.calculator.formatCurrency(totalAmount)}</span>
                </div>
                <div class="compact-stat-divider">|</div>
                <div class="compact-stat-item">
                    <span class="compact-stat-label">Total Budget:</span>
                    <span class="compact-stat-value">${totalBudgets}</span>
                </div>
                <div class="compact-stat-divider">|</div>
                <div class="compact-stat-item">
                    <span class="compact-stat-label">Overspent:</span>
                    <span class="compact-stat-value ${overspentCount > 0 ? 'text-danger' : ''}">${overspentCount}</span>
                </div>
            </div>
        `;
    }

    // Removed getBudgetListHTML since we don't need the flip card back anymore
    // Keeping getBudgetCardsHTML as is logic

    getBudgetCardsHTML() {
        const budgetsWithSpending = this.app.calculator.getBudgetsWithSpending();

        // Apply filter
        const filteredBudgets = this.currentFilter === 'all'
            ? budgetsWithSpending
            : budgetsWithSpending.filter(b => b.category === this.currentFilter);

        if (filteredBudgets.length === 0) {
            return `
                <div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-8) var(--space-4);">
                    <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: var(--space-3);">📊</div>
                    <div class="empty-state-title" style="font-size: 1.25rem;">Belum Ada Budget</div>
                    <div class="empty-state-description" style="max-width: 300px; margin: 0 auto;">
                        ${this.currentFilter === 'all'
                    ? 'Mulai kelola pengeluaranmu dengan tombol Tambah Budget di atas.'
                    : 'Tidak ada budget untuk kategori ini.'}
                    </div>
                </div>
            `;
        }

        return filteredBudgets.map(budget => this.getBudgetCardHTML(budget)).join('');
    }

    getBudgetCardHTML(budget) {
        const remaining = this.app.calculator.getBudgetRemaining(budget);
        const durationLabel = this.getDurationLabel(budget.duration);

        return `
            <div class="budget-card ${budget.status}" data-budget-id="${budget.id}">
                <div class="budget-card-header">
                    <div class="budget-card-title">
                        <h3>${budget.name}</h3>
                        <span class="budget-duration">${durationLabel}</span>
                    </div>
                    <button class="budget-card-menu" onclick="handleEditBudget('${budget.id}')">
                        ⋮
                    </button>
                </div>

                <div class="budget-card-category">
                    ${this.getCategoryIcon(budget.category)} ${this.app.dataManager.getCategoryName(budget.category)}
                </div>

                <div class="budget-card-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar ${budget.status}" style="width: ${Math.min(budget.progress, 100)}%">
                            <span class="progress-text">${budget.progress}%</span>
                        </div>
                    </div>
                </div>

                <div class="budget-card-amounts">
                    <div class="amount-item">
                        <span class="amount-label">Terpakai</span>
                        <span class="amount-value spent">${this.app.calculator.formatCurrency(budget.spent)}</span>
                    </div>
                    <div class="amount-item">
                        <span class="amount-label">Sisa</span>
                        <span class="amount-value remaining ${budget.status === 'overspent' ? 'negative' : ''}">${this.app.calculator.formatCurrency(remaining)}</span>
                    </div>
                    <div class="amount-item">
                        <span class="amount-label">Total</span>
                        <span class="amount-value total">${this.app.calculator.formatCurrency(budget.amount)}</span>
                    </div>
                </div>

                ${budget.status === 'overspent' ? `
                    <div class="budget-alert overspent">
                        ⚠️ Budget terlampaui ${this.app.calculator.formatCurrency(budget.spent - budget.amount)}
                    </div>
                ` : budget.status === 'danger' ? `
                    <div class="budget-alert danger">
                        ⚠️ Budget hampir habis!
                    </div>
                ` : ''}
            </div>
        `;
    }

    initializeComponents() {
        console.log('⚙️ Initializing budget components...');

        // Setup add budget button
        const addBtn = document.getElementById('addBudgetBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.app.uiManager.openModal('addBudgetModal');
            });
        }

        // Setup category filter
        const filterSelect = document.getElementById('categoryFilter');
        if (filterSelect) {
            filterSelect.value = this.currentFilter;
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.refreshBudgetGrid();
            });
        }

        // Setup event listeners
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Budget components initialized');
    }

    setupEventListeners() {
        // Listen for budget changes
        document.addEventListener('budget-changed', (e) => {
            console.log('📊 Budget changed event received:', e.detail);
            if (this.app.state.activeTab === 'budget') {
                this.refresh();
            }
        });

        // Listen for expense changes
        document.addEventListener('expense-changed', (e) => {
            console.log('💸 Expense changed event received:', e.detail);
            if (this.app.state.activeTab === 'budget') {
                this.refresh();
            }
        });
    }

    refresh() {
        console.log('🔄 Refreshing budget view...');

        if (!this.initialized) {
            this.render();
            return;
        }

        // Just re-render everything for simplicity in this strict mode, or target Budget Overview if exists
        // Since we removed flip card, we can just reload the grid and stats

        // This is a simpler strategy: re-render the view content if structure is staticish
        // Or update specific parts

        this.render();
    }

    refreshBudgetGrid() {
        const budgetGrid = document.getElementById('budgetGrid');
        if (budgetGrid) {
            budgetGrid.innerHTML = this.getBudgetCardsHTML();
        }
    }

    getCategoryIcon(category) {
        const icons = {
            kebutuhan: '🛒',
            hiburan: '🎮',
            transport: '🚗',
            kesehatan: '🏥',
            pendidikan: '📚',
            lainnya: '📦'
        };
        return icons[category] || '📦';
    }

    getDurationLabel(duration) {
        const labels = {
            monthly: '📅 Bulanan',
            weekly: '📆 Mingguan',
            yearly: '🗓️ Tahunan'
        };
        return labels[duration] || '📅 Bulanan';
    }
}

// ====== GLOBAL HELPER FUNCTIONS ======
window.handleEditBudget = function (budgetId) {
    const budget = window.app.state.budgets.find(b => b.id == budgetId);
    if (!budget) return;

    // Populate edit modal
    document.getElementById('editBudgetId').value = budget.id;
    document.getElementById('editBudgetName').value = budget.name;
    document.getElementById('editBudgetAmount').value = budget.amount;

    // Open modal
    window.app.uiManager.openModal('editBudgetModal');
};

export default BudgetView;
