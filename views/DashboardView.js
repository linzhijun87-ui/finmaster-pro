/* ====== DASHBOARD VIEW MODULE ====== */

class DashboardView {
    constructor(app) {
        this.app = app;
        this.chartManager = app.chartManager;
        this.initialized = false;
    }

    render() {
        console.log('📊 Rendering Dashboard...');
        
        const html = this.getDashboardHTML();
        this.app.elements.mainContent.innerHTML = html;
        
        // Tampilkan loading state untuk chart
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="chart-loading">
                    <div class="loading-spinner"></div>
                    <p>Memuat chart...</p>
                </div>
            `;
        }
        
        // Initialize components setelah DOM ready
        setTimeout(() => {
            this.initializeComponents();
        }, 50);
    }

    getDashboardHTML() {
        return `
            <!-- STATS GRID -->
            <div class="stats-grid">
                ${this.getStatCardHTML('income', 'Total Pendapatan', this.app.state.finances.income, 'success', '💰')}
                ${this.getStatCardHTML('expense', 'Total Pengeluaran', this.app.state.finances.expenses, 'danger', '💸')}
                ${this.getStatCardHTML('savings', 'Total Tabungan', this.app.state.finances.savings, 'primary', '🏦')}
            </div>
            
            <!-- PROGRESS SECTION -->
            ${this.getProgressSectionHTML()}
            
            <!-- QUICK ACTIONS -->
            ${this.getQuickActionsHTML()}
            
            <!-- DASHBOARD GRID -->
            <div class="dashboard-grid">
                <!-- CHART -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="section-title">Analytics Trends</h3>
                        <div class="chart-actions">
                            <button class="chart-btn active" data-period="monthly">Bulanan</button>
                            <button class="chart-btn" data-period="yearly">Tahunan</button>
                            <button class="chart-btn" data-period="custom">Custom</button>
                        </div>
                    </div>
                    <div class="chart-placeholder" id="chartContainer">
                        <canvas id="financeChart"></canvas>
                    </div>
                </div>
                
                <!-- RECENT ACTIVITY -->
                <div class="activity-section">
                    <h3 class="section-title">Aktivitas Terbaru</h3>
                    <div class="activity-list" id="recentActivity">
                        ${this.getRecentActivityHTML()}
                    </div>
                </div>
            </div>
            
            <!-- GOALS SECTION -->
            ${this.getGoalsSectionHTML()}
        `;
    }

    getStatCardHTML(type, title, amount, color, icon) {
        const trendId = `${type}Trend`;
        const formattedAmount = this.app.calculator.formatCurrency(amount);
        
        return `
            <div class="stat-card ${type}">
                <div class="stat-header">
                    <div>
                        <div class="text-muted mb-2">${title}</div>
                        <div class="stat-value" id="total${this.capitalizeFirstLetter(type)}" style="color: var(--${color});">
                            ${formattedAmount}
                        </div>
                    </div>
                    <div class="stat-icon">${icon}</div>
                </div>
                <div class="stat-trend trend-up" id="${trendId}">
                    <span>📈</span> Loading trend...
                </div>
            </div>
        `;
    }

    getProgressSectionHTML() {
        const progressData = this.calculateTotalProgress();
        
        return `
            <section class="progress-section">
                <div class="progress-header">
                    <div class="progress-title">Progress Target Financial</div>
                    <div class="progress-badge" id="totalProgress">${progressData.progress}% Tercapai</div>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar" style="width: ${progressData.progress}%"></div>
                </div>
                
                <div class="progress-info">
                    <div class="progress-info-item">
                        <div class="progress-info-label">Target</div>
                        <div class="progress-info-value" id="totalTarget">${this.app.calculator.formatCurrency(progressData.target)}</div>
                    </div>
                    <div class="progress-info-item">
                        <div class="progress-info-label">Terkumpul</div>
                        <div class="progress-info-value" id="totalCurrent">${this.app.calculator.formatCurrency(progressData.current)}</div>
                    </div>
                    <div class="progress-info-item">
                        <div class="progress-info-label">Sisa Waktu</div>
                        <div class="progress-info-value" id="daysLeft">${progressData.daysLeft} Hari</div>
                    </div>
                </div>
            </section>
        `;
    }

    getQuickActionsHTML() {
        return `
            <section class="quick-actions">
                <h3 class="section-title">Aksi Cepat</h3>
                <div class="actions-grid">
                    <button class="action-btn" id="quickAddExpense">
                        <div class="action-icon">➕</div>
                        <div style="font-weight: 600;">Tambah Pengeluaran</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Catat pengeluaran baru</div>
                    </button>
                    
                    <button class="action-btn" id="quickAddIncome">
                        <div class="action-icon">💳</div>
                        <div style="font-weight: 600;">Tambah Pendapatan</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Input pendapatan baru</div>
                    </button>
                    
                    <button class="action-btn" id="quickGenerateReport">
                        <div class="action-icon">📊</div>
                        <div style="font-weight: 600;">Generate Report</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Buat laporan bulanan</div>
                    </button>
                    
                    <button class="action-btn" id="quickAddGoal">
                        <div class="action-icon">🎯</div>
                        <div style="font-weight: 600;">Set Goal Baru</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Buat target baru</div>
                    </button>
                </div>
            </section>
        `;
    }

    getRecentActivityHTML() {
        const allTransactions = [
            ...this.app.state.transactions.income.map(t => ({ ...t, type: 'income' })),
            ...this.app.state.transactions.expenses.map(t => ({ ...t, type: 'expense' }))
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
        
        if (allTransactions.length === 0) {
            return '<div class="text-center text-muted mt-4">Belum ada aktivitas</div>';
        }
        
        return allTransactions.map(transaction => `
            <div class="activity-item ${transaction.type}-activity">
                <div class="activity-icon">
                    ${transaction.type === 'income' ? '💰' : '💸'}
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.name}</div>
                    <div class="activity-meta">
                        <span>${this.app.uiManager.formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span>${this.app.uiManager.getCategoryName(transaction.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: ${transaction.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
                    ${transaction.type === 'income' ? '+' : '-'} ${this.app.calculator.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }

    getGoalsSectionHTML() {
        const goalsHTML = this.getGoalsHTML();
        
        return `
            <section class="goals-section">
                <h3 class="section-title" style="color: white;">Financial Goals</h3>
                <div class="goals-grid" id="goalsGrid">
                    ${goalsHTML}
                </div>
            </section>
        `;
    }

    getGoalsHTML() {
        if (this.app.state.goals.length === 0) {
            return '<div class="text-center" style="color: rgba(255,255,255,0.8);">Belum ada goals yang dibuat</div>';
        }
        
        return this.app.state.goals.map(goal => `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div style="font-weight: 600; margin-bottom: var(--space-2);">${goal.name}</div>
                <div class="text-muted" style="opacity: 0.8;">Target: ${this.app.calculator.formatCurrency(goal.target)}</div>
                <div class="goal-progress" style="margin: var(--space-3) 0;">
                    <div class="goal-progress-bar" style="width: ${goal.progress}%"></div>
                </div>
                <div style="margin-top: var(--space-3); font-size: 0.875rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Terkumpul: ${goal.progress}%</span>
                        <span>${this.app.calculator.formatCurrency(goal.current)}</span>
                    </div>
                    <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px;">
                        Deadline: ${this.app.uiManager.formatDate(goal.deadline)}
                    </div>
                </div>
                <button class="btn-outline" style="margin-top: var(--space-3); width: 100%; font-size: 0.875rem;" 
                        onclick="handleUpdateGoal(${goal.id})">
                    + Tambah Dana
                </button>
            </div>
        `).join('');
    }

    initializeComponents() {
        console.log('⚙️ Initializing dashboard components...');
        
        // Calculate trends
        this.calculateTrends();
        
        // Setup quick actions
        this.setupQuickActions();
        
        // Setup chart controls
        this.setupChartControls();
        
        // Initialize chart dengan delay yang lebih tepat
        setTimeout(() => {
            if (this.chartManager) {
                this.chartManager.initializeChart();
            }
        }, 300); // Beri waktu untuk DOM benar-benar siap
        
        this.initialized = true;
    }

    calculateTrends() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Helper function to get total for a specific month
        const getMonthTotal = (transactions, monthOffset = 0) => {
            const targetMonth = currentMonth - monthOffset;
            const targetYear = currentYear - (targetMonth < 0 ? 1 : 0);
            const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
            
            return transactions.reduce((total, transaction) => {
                try {
                    const date = new Date(transaction.date);
                    if (date.getMonth() === actualMonth && date.getFullYear() === targetYear) {
                        return total + transaction.amount;
                    }
                } catch (e) {
                    // Skip invalid dates
                }
                return total;
            }, 0);
        };
        
        // Get current and previous month totals
        const currentIncome = getMonthTotal(this.app.state.transactions.income, 0);
        const previousIncome = getMonthTotal(this.app.state.transactions.income, 1);
        const currentExpense = getMonthTotal(this.app.state.transactions.expenses, 0);
        const previousExpense = getMonthTotal(this.app.state.transactions.expenses, 1);
        const currentSavings = currentIncome - currentExpense;
        const previousSavings = previousIncome - previousExpense;
        
        // Calculate percentage changes
        const incomeChange = previousIncome > 0 
            ? ((currentIncome - previousIncome) / previousIncome * 100).toFixed(1)
            : '0.0';
        const expenseChange = previousExpense > 0
            ? ((currentExpense - previousExpense) / previousExpense * 100).toFixed(1)
            : '0.0';
        const savingsChange = previousSavings > 0 && currentSavings > 0
            ? ((currentSavings - previousSavings) / previousSavings * 100).toFixed(1)
            : currentSavings > 0 ? '100.0' : '0.0';
        
        // Determine trends
        const incomeTrend = currentIncome >= previousIncome ? 'up' : 'down';
        const expenseTrend = currentExpense <= previousExpense ? 'down' : 'up';
        const savingsTrend = currentSavings >= previousSavings ? 'up' : 'down';
        
        // Update trend displays
        this.updateTrendElement('incomeTrend', incomeTrend, incomeChange);
        this.updateTrendElement('expenseTrend', expenseTrend, expenseChange);
        this.updateTrendElement('savingsTrend', savingsTrend, savingsChange);
    }

    updateTrendElement(elementId, trend, change) {
        const element = document.getElementById(elementId);
        if (element) {
            const icon = trend === 'up' ? '📈' : '📉';
            if (elementId === 'savingsTrend') {
                element.innerHTML = `<span>${trend === 'up' ? '🚀' : '📉'}</span> ${trend === 'up' ? '+' : ''}${change}% dari bulan lalu`;
            } else {
                element.innerHTML = `<span>${icon}</span> ${trend === 'up' ? '+' : ''}${change}% dari bulan lalu`;
            }
        }
    }

    calculateTotalProgress() {
        const totalTarget = this.app.state.goals.reduce((sum, goal) => sum + goal.target, 0);
        const totalCurrent = this.app.state.goals.reduce((sum, goal) => sum + goal.current, 0);
        const totalProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
        
        // Calculate days until nearest deadline
        const now = new Date();
        const upcomingDeadlines = this.app.state.goals
            .map(g => new Date(g.deadline))
            .filter(d => d > now)
            .sort((a, b) => a - b);
        
        const daysLeft = upcomingDeadlines.length > 0 
            ? Math.ceil((upcomingDeadlines[0] - now) / (1000 * 60 * 60 * 24))
            : 0;
        
        return {
            target: totalTarget,
            current: totalCurrent,
            progress: totalProgress,
            daysLeft: daysLeft
        };
    }

    setupQuickActions() {
        // Quick add expense
        document.getElementById('quickAddExpense')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addExpenseModal');
        });
        
        // Quick add income
        document.getElementById('quickAddIncome')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addIncomeModal');
        });
        
        // Quick add goal
        document.getElementById('quickAddGoal')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addGoalModal');
        });
        
        // Quick generate report
        document.getElementById('quickGenerateReport')?.addEventListener('click', () => {
            this.app.reportGenerator.generatePrintableReport();
        });
    }

    setupChartControls() {
        const chartActions = document.querySelector('.chart-actions');
        if (!chartActions) return;
        
        // Remove old event listeners
        const newChartActions = chartActions.cloneNode(true);
        chartActions.parentNode.replaceChild(newChartActions, chartActions);
        
        // Add new event listeners
        document.querySelector('.chart-actions').addEventListener('click', (e) => {
            const btn = e.target.closest('.chart-btn');
            if (!btn) return;
            
            e.preventDefault();
            
            // Remove active class from all buttons
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get period and update chart
            const period = btn.dataset.period;
            if (period === 'custom') {
                this.app.chartManager.showCustomDateModal();
            } else {
                this.app.chartManager.currentPeriod = period;
                this.app.chartManager.updateChart();
                this.app.uiManager.showNotification(`Chart diperbarui: Periode ${period}`, 'success');
            }
        });
    }

    refresh() {
        if (!this.initialized) return;
        
        // Update stats
        this.updateStats();
        
        // Update recent activity
        this.updateRecentActivity();
        
        // Update goals
        this.updateGoals();
        
        // Update progress section
        this.updateProgressSection();
        
        // Update chart if needed
        if (this.chartManager && this.chartManager.chartInstance) {
            setTimeout(() => {
                this.chartManager.updateChart();
            }, 100);
        }
    }

    updateStats() {
        // Update income
        const incomeEl = document.getElementById('totalIncome');
        if (incomeEl) {
            incomeEl.textContent = this.app.calculator.formatCurrency(this.app.state.finances.income);
        }
        
        // Update expense
        const expenseEl = document.getElementById('totalExpense');
        if (expenseEl) {
            expenseEl.textContent = this.app.calculator.formatCurrency(this.app.state.finances.expenses);
        }
        
        // Update savings
        const savingsEl = document.getElementById('totalSavings');
        if (savingsEl) {
            savingsEl.textContent = this.app.calculator.formatCurrency(this.app.state.finances.savings);
        }
        
        // Update trends
        this.calculateTrends();
    }

    updateRecentActivity() {
        const recentActivityEl = document.getElementById('recentActivity');
        if (recentActivityEl) {
            recentActivityEl.innerHTML = this.getRecentActivityHTML();
        }
    }

    updateGoals() {
        const goalsGridEl = document.getElementById('goalsGrid');
        if (goalsGridEl) {
            goalsGridEl.innerHTML = this.getGoalsHTML();
        }
    }

    updateProgressSection() {
        const progressData = this.calculateTotalProgress();
        
        const progressBar = document.getElementById('progressBar');
        const totalProgressEl = document.getElementById('totalProgress');
        const totalTargetEl = document.getElementById('totalTarget');
        const totalCurrentEl = document.getElementById('totalCurrent');
        const daysLeftEl = document.getElementById('daysLeft');
        
        if (progressBar) {
            progressBar.style.width = `${progressData.progress}%`;
        }
        if (totalProgressEl) {
            totalProgressEl.textContent = `${progressData.progress}% Tercapai`;
        }
        if (totalTargetEl) {
            totalTargetEl.textContent = this.app.calculator.formatCurrency(progressData.target);
        }
        if (totalCurrentEl) {
            totalCurrentEl.textContent = this.app.calculator.formatCurrency(progressData.current);
        }
        if (daysLeftEl) {
            daysLeftEl.textContent = `${progressData.daysLeft} Hari`;
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

export default DashboardView;