/* ====== DASHBOARD VIEW MODULE ====== */

class DashboardView {
    constructor(app) {
        this.app = app;
        this.chartManager = app.chartManager;
        this.initialized = false;
        this.hasRenderedChart = false; // Flag untuk track apakah chart sudah dirender
    }

    // NEW ARCHITECTURE: Clean up resources
    destroy() {
        console.log('🧹 Destroying Dashboard View...');

        // Clean up Chart.js instance via ChartManager
        if (this.chartManager && this.chartManager.chartInstance) {
            console.log('📉 Destroying Dashboard Chart...');
            try {
                // Save config before destroying if needed (ChartManager handles state)
                if (typeof this.chartManager.saveChartConfig === 'function') {
                    this.chartManager.saveChartConfig();
                }

                this.chartManager.chartInstance.destroy();
                this.chartManager.chartInstance = null;
                this.chartManager.chartInitialized = false;
                this.hasRenderedChart = false;
            } catch (error) {
                console.error('❌ Error destroying chart:', error);
            }
        }
    }

    // NEW ARCHITECTURE: Return HTML string only
    getHtml() {
        console.log('📊 Getting Dashboard View HTML...');
        return this.getDashboardHTML();
    }

    // NEW ARCHITECTURE: Initialize after DOM injection
    afterRender() {
        console.log('✅ Dashboard View rendered, initializing...');

        // Check if we need to update content around chart (if already rendered) behavior is now handled by Controller clearing DOM,
        // so we always initialize fresh. The previous logic of "updateDashboardContent" might need adjustment 
        // if we want to support partial updates, but for now we enforce full re-render on tab switch.

        this.initializeComponents();
        this.hasRenderedChart = true;
        this.app.uiManager.setupScrollReveal();
    }

    // Legacy render support (deprecated)
    render() {
        console.warn('⚠️ using legacy render on Dashboard');
        const html = this.getHtml();
        this.app.elements.mainContent.innerHTML = html;
        this.app.elements.mainContent.className = 'main-content dashboard-view';
        setTimeout(() => this.afterRender(), 50);
    }

    // TAMBAHKAN method baru untuk update content tanpa merusak chart:
    updateDashboardContent() {
        console.log('📝 Updating dashboard content around chart...');

        // Update stats grid
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            // Re-render is safest for structure, but we want to animate values if elements exist
            // Check if we can just update values
            const netBalanceVal = document.getElementById('totalNetBalance');
            if (netBalanceVal) {
                this.updateFinancialCards();
            } else {
                statsGrid.innerHTML = `
                    <div class="stat-card primary clickable-card" id="netWorthCard">
                        <div class="stat-header">
                            <div>
                                <div class="text-muted mb-2">Kekayaan Bersih</div>
                                <div class="stat-value" id="totalNetBalance" data-value="${this.app.state.finances.netBalance}">
                                    ${this.app.calculator.formatCurrency(this.app.state.finances.netBalance)}
                                </div>
                            </div>
                            <div class="stat-icon">💰</div>
                        </div>
                        <div class="stat-trend">
                            <span style="font-size: 0.8rem; opacity: 0.8;">Ketuk untuk rincian akun 👁️</span>
                        </div>
                    </div>
                    ${this.getStatCardHTML('availableCash', 'Dana Tersedia', this.app.state.finances.availableCash, 'success', '💵')}
                    ${this.getStatCardHTML('allocated', 'Dana Dialokasikan', this.app.state.finances.totalAllocated, 'warning', '🔒')}
                 `;
                this.setupNetWorthAction();
            }
        }

        // Update progress section
        const progressSection = document.querySelector('.progress-section');
        if (progressSection) {
            progressSection.innerHTML = this.getProgressSectionHTML();
        }

        // Update quick actions
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.innerHTML = this.getQuickActionsHTML();
            this.setupQuickActions();
        }

        // Update recent activity
        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity) {
            recentActivity.innerHTML = this.getRecentActivityHTML();
        }

        // Update goals section
        const goalsSection = document.querySelector('.goals-section');
        if (goalsSection) {
            goalsSection.innerHTML = this.getGoalsSectionHTML();
        }

        // Update trends
        this.calculateTrends();

        console.log('✅ Dashboard content updated (chart preserved)');
    }

    updateFinancialCards() {
        const finances = this.app.state.finances;

        // Helper to animate if element exists
        const animateIfFound = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                const current = parseInt(el.getAttribute('data-value') || 0);
                if (current !== value) {
                    this.app.uiManager.animateValue(el, current, value, 1500);
                    el.setAttribute('data-value', value);
                }
            }
        };

        animateIfFound('totalNetBalance', finances.netBalance);
        animateIfFound('totalAvailableCash', finances.availableCash);
        animateIfFound('totalAllocated', finances.totalAllocated);

        animateIfFound('totalAllocated', finances.totalAllocated);
    }


    // TAMBAHKAN method baru untuk memastikan chart container
    ensureChartContainer() {
        // Pastikan chart container tersedia di DOM
        if (!document.getElementById('chartContainer')) {
            console.log('📦 Chart container not in DOM, adding placeholder...');

            // Jika tidak ada, kita akan menambahkannya di getDashboardHTML
        }
    }

    getInsightHTML() {
        if (!this.app.insightEngine) return '';

        const insight = this.app.insightEngine.getInsight();
        if (!insight) return ''; // Silence is OK

        // Map insight types to visual styles
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
            case 'supportive':
                bgColor = 'rgba(88, 86, 214, 0.1)';
                borderColor = 'rgba(88, 86, 214, 0.3)';
                break;
            case 'info':
                bgColor = 'rgba(0, 122, 255, 0.1)';
                borderColor = 'rgba(0, 122, 255, 0.3)';
                break;
            default: // neutral
                bgColor = 'rgba(142, 142, 147, 0.1)';
                borderColor = 'rgba(142, 142, 147, 0.3)';
        }

        return `
            <div class="insight-card animate-fadeInDown" style="
                margin-bottom: 20px;
                padding: 16px 18px;
                border-radius: 12px;
                background: ${bgColor};
                border-left: 4px solid ${borderColor};
                display: flex;
                align-items: center;
                gap: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="font-size: 1.75rem; line-height: 1;">${insight.icon}</div>
                <div style="flex: 1; font-size: 0.95rem; line-height: 1.5; color: var(--text);">
                    ${insight.message}
                </div>
            </div>
        `;
    }

    getDashboardHTML() {
        return `
            <!-- INSIGHT SECTION (NEW) -->
            ${this.getInsightHTML()}

            <!-- STATS GRID -->
            <div class="stats-grid stagger-children">
                <div class="stat-card primary clickable-card" id="netWorthCard">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Kekayaan Bersih</div>
                            <div class="stat-value" id="totalNetBalance" data-value="${this.app.state.finances.netBalance}">
                                ${this.app.calculator.formatCurrency(this.app.state.finances.netBalance)}
                            </div>
                        </div>
                        <div class="stat-icon">💰</div>
                    </div>
                    <div class="stat-trend">
                        <span style="font-size: 0.8rem; opacity: 0.8;">Ketuk untuk rincian akun 👁️</span>
                    </div>
                </div>

                ${this.getStatCardHTML('availableCash', 'Dana Tersedia', this.app.state.finances.availableCash, 'success', '💵')}
                ${this.getStatCardHTML('allocated', 'Dana Dialokasikan', this.app.state.finances.totalAllocated, 'warning', '🔒')}
            </div>
            
            <!-- PROGRESS SECTION -->
            <div class="reveal-on-scroll">
                ${this.getProgressSectionHTML()}
            </div>
            
            <!-- QUICK ACTIONS -->
            <div class="reveal-on-scroll">
                ${this.getQuickActionsHTML()}
            </div>
            
            <!-- DASHBOARD GRID -->
            <div class="dashboard-grid">
                <!-- CHART -->
                <div class="chart-container animate-fadeInUp" style="animation-delay: 0.3s;">
                    <div class="chart-header">
                        <h3 class="section-title">Analytics Trends</h3>
                        <div class="chart-actions">
                            <button class="chart-btn active" data-period="monthly">Bulanan</button>
                            <button class="chart-btn" data-period="yearly">Tahunan</button>
                            <button class="chart-btn" data-period="custom">Custom</button>
                        </div>
                    </div>
                    <!-- CHART CONTAINER AKAN DITAMBAHKAN OLEH initializeChart() -->
                    <div id="chartContainer" class="chart-canvas-wrapper">
                        <!-- Canvas akan dibuat oleh ChartManager -->
                    </div>
                </div>
                
                <!-- RECENT ACTIVITY -->
                <div class="activity-section reveal-on-scroll">
                    <h3 class="section-title">Aktivitas Terbaru</h3>
                    <div class="activity-list" id="recentActivity">
                        ${this.getRecentActivityHTML()}
                    </div>
                </div>
            </div>
            
            <!-- GOALS SECTION -->
            <div class="reveal-on-scroll">
                ${this.getGoalsSectionHTML()}
            </div>
        `;
    }

    initializeBasicComponents() {
        console.log('⚙️ Initializing basic dashboard components...');

        // Calculate trends
        this.calculateTrends();

        // Setup quick actions
        this.setupQuickActions();

        // Setup chart controls (hanya setup event listeners)
        this.setupChartControls();

        console.log('✅ Basic components initialized');
    }

    // TAMBAHKAN method setupChartControls yang sederhana:
    setupNetWorthAction() {
        const netWorthCard = document.getElementById('netWorthCard');
        if (netWorthCard) {
            netWorthCard.style.cursor = 'pointer';
            netWorthCard.addEventListener('click', () => {
                this.showAccountDistribution();
            });
        }
    }

    showAccountDistribution() {
        const listContainer = document.getElementById('accountDistributionList');
        if (listContainer) {
            listContainer.innerHTML = this.getAccountDistributionHTML();
        }
        this.app.uiManager.openModal('accountDistributionModal');
    }

    getAccountDistributionHTML() {
        const accounts = this.app.calculator.getAccountsWithBalances();

        if (accounts.length === 0) {
            return `
                <div class="empty-state-container" style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🏦</div>
                    <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
                        Belum ada sumber dana. Tambahkan di Pengaturan.
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="app.uiManager.closeModal('accountDistributionModal'); app.showView('settings');">
                        Ke Pengaturan
                    </button>
                </div>
            `;
        }

        const activeAccounts = accounts.filter(a => a.active);
        const totalBalance = activeAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

        const listHtml = activeAccounts.map(acc => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-divider);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="background: var(--bg-surface); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 1.2rem;">
                        ${this.getAccountIcon(acc.type)}
                    </div>
                    <div>
                        <div style="font-weight: 500;">${acc.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">${acc.type}</div>
                    </div>
                </div>
                <div style="font-weight: 600; color: var(--text-primary);">
                    ${this.app.calculator.formatCurrency(acc.currentBalance)}
                </div>
            </div>
        `).join('');

        return `
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-divider); display: flex; justify-content: space-between; align-items: center;">
                <span class="text-muted" style="font-weight: 500;">Total Dana Akun</span>
                <span style="font-weight: 700; font-size: 1.1rem; color: var(--primary);">${this.app.calculator.formatCurrency(totalBalance)}</span>
            </div>
            <div class="account-list-scroll" style="max-height: 50vh; overflow-y: auto;">
                ${listHtml}
            </div>
        `;
    }

    getAccountIcon(type) {
        const icons = {
            bank: '🏦',
            ewallet: '📱',
            cash: '💵',
            other: '💳'
        };
        return icons[type] || '💳';
    }

    setupChartControls() {
        const chartActions = document.querySelector('.chart-actions');
        if (!chartActions) return;

        // Remove old event listeners
        const newChartActions = chartActions.cloneNode(true);
        chartActions.parentNode.replaceChild(newChartActions, chartActions);

        // ... (rest of logic handles via bubbling)

        newChartActions.addEventListener('click', (e) => {
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
                <div class="stat-trend" id="${trendId}">
                    <!-- Trend will be injected here by calculateTrends -->
                    <span style="font-size: 0.8rem; color: var(--text-muted);">-</span>
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
                    
                    <button class="action-btn" id="quickTransfer">
                        <div class="action-icon">🔄</div>
                        <div style="font-weight: 600;">Transfer Dana</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Pindah antar akun</div>
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
            return `
                <div class="empty-state empty-activity">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-title">Belum Ada Aktivitas</div>
                    <div class="empty-state-description">Mulai catat pemasukan dan pengeluaranmu hari ini.</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm" onclick="app.uiManager.openModal('addExpenseModal')">Tambah Transaksi</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="stagger-children">
                ${allTransactions.map(transaction => `
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
                `).join('')}
            </div>
        `;
    }

    getGoalsSectionHTML() {
        const goalsHTML = this.getGoalsHTML();

        return `
            <section class="goals-section">
                <h3 class="section-title" style="color: white;">Financial Goals</h3>
                <div class="goals-grid stagger-children" id="goalsGrid">
                    ${goalsHTML}
                </div>
            </section>
        `;
    }

    getGoalsHTML() {
        if (this.app.state.goals.length === 0) {
            return `
                <div class="empty-state empty-goals" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🎯</div>
                    <div class="empty-state-title">Tetapkan Goal Pertamamu</div>
                    <div class="empty-state-description">Wujudkan impianmu dengan menabung secara terencana.</div>
                    <button class="btn btn-sm" onclick="app.uiManager.openModal('addGoalModal')">Buat Goal Baru</button>
                </div>
            `;
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
                <div class="goal-buttons" style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
                    <button class="btn-outline" style="flex: 1; font-size: 0.875rem;" 
                            onclick="handleUpdateGoal(${goal.id})">
                        + Dana
                    </button>
                    <button class="btn-outline" style="width: 40px; font-size: 0.875rem; padding: 0; display: flex; align-items: center; justify-content: center;"
                            onclick="handleEditGoal('${goal.id}')">
                        ✏️
                    </button>
                </div>
            </div>
        `).join('');
    }

    initializeComponents() {
        console.log('⚙️ Initializing dashboard components...');

        // Calculate trends
        this.calculateTrends();

        // Setup quick actions
        this.setupQuickActions();

        // Setup Net Worth Action (Modal)
        this.setupNetWorthAction();

        // Setup chart controls
        this.setupChartControls();

        // Initialize chart jika belum ada
        this.initializeChartIfNeeded();

        this.initialized = true;
        console.log('✅ Dashboard components initialized');
    }

    // TAMBAHKAN method untuk initialize chart jika diperlukan:
    initializeChartIfNeeded() {
        // Cek apakah chart container ada
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) {
            console.error('❌ Chart container not found');
            return;
        }

        // Cek apakah chart sudah ada DAN canvas masih ada di DOM
        if (this.app.chartManager && this.app.chartManager.chartInstance) {
            const isCanvasAttached = this.app.chartManager.chartInstance.canvas &&
                document.body.contains(this.app.chartManager.chartInstance.canvas);

            if (isCanvasAttached) {
                console.log('✅ Chart already exists and attached, updating data...');
                this.updateChartData();
                return;
            }

            console.log('⚠️ Chart DETACHED from DOM, re-initializing...');
            // Reset instance to force re-initialization
            this.app.chartManager.chartInstance.destroy();
            this.app.chartManager.chartInstance = null;
        }

        // Jika belum ada, initialize chart
        if (this.app.chartManager) {
            console.log('📊 Initializing new chart...');

            // Pastikan canvas ada
            if (!chartContainer.querySelector('canvas')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'financeChart';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                chartContainer.appendChild(canvas);
            }

            // Initialize chart
            setTimeout(() => {
                this.app.chartManager.initializeChart();
            }, 200);
        }
    }

    // TAMBAHKAN method untuk update chart data:
    updateChartData() {
        if (!this.app.chartManager || !this.app.chartManager.chartInstance) {
            console.log('ℹ️ No chart instance to update');
            return;
        }

        try {
            const newData = this.app.chartManager.generateChartData();
            this.app.chartManager.chartInstance.data = newData;
            this.app.chartManager.chartInstance.update('none');
            console.log('📊 Chart data updated');
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }


    // TAMBAHKAN method baru untuk inisialisasi chart yang aman
    initializeChartSafely() {
        console.log('🔄 Initializing chart safely...');

        // Tunggu hingga DOM benar-benar siap
        setTimeout(() => {
            const chartContainer = document.getElementById('chartContainer');
            const chartCanvas = document.getElementById('financeChart');

            if (!chartContainer) {
                console.error('❌ Chart container not found in DOM');
                this.showChartFallback('Chart container tidak ditemukan');
                return;
            }

            if (!chartCanvas) {
                console.log('🎨 Creating chart canvas...');
                // Buat canvas jika belum ada
                const canvas = document.createElement('canvas');
                canvas.id = 'financeChart';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                chartContainer.appendChild(canvas);
            }

            // Force layout untuk memastikan container memiliki dimensi
            chartContainer.style.display = 'block';
            chartContainer.style.position = 'relative';
            chartContainer.style.height = '300px';
            chartContainer.style.minHeight = '300px';

            // Tunggu 1 frame untuk layout
            requestAnimationFrame(() => {
                // Cek dimensi container
                const hasDimensions = chartContainer.offsetWidth > 0 && chartContainer.offsetHeight > 0;

                console.log('📏 Chart container dimensions:', {
                    width: chartContainer.offsetWidth,
                    height: chartContainer.offsetHeight,
                    clientWidth: chartContainer.clientWidth,
                    clientHeight: chartContainer.clientHeight
                });

                if (!hasDimensions) {
                    console.warn('⚠️ Chart container has no dimensions, forcing resize...');
                    // Force resize
                    chartContainer.style.width = '100%';
                    chartContainer.style.height = '300px';
                }

                // Tunggu sedikit lagi untuk memastikan layout stabil
                setTimeout(() => {
                    if (this.chartManager) {
                        console.log('🚀 Calling ChartManager.initializeChart()');
                        this.chartManager.initializeChart();
                    } else {
                        console.error('❌ ChartManager not available');
                        this.showChartFallback('Chart manager tidak tersedia');
                    }
                }, 50);
            });
        }, 200); // Delay lebih panjang untuk memastikan DOM siap
    }

    // TAMBAHKAN method untuk fallback chart
    showChartFallback(message) {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <div style="font-weight: 600; margin-bottom: 8px;">Chart tidak tersedia</div>
                <div style="margin-bottom: 20px;">${message}</div>
                <button onclick="app.showView('dashboard')" 
                        style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Coba Lagi
                </button>
            </div>
        `;
    }

    initializeChartWithValidation() {
        // Tunggu sebentar untuk memastikan DOM benar-benar siap
        setTimeout(() => {
            const chartContainer = document.getElementById('chartContainer');

            if (!chartContainer) {
                console.error('❌ Chart container not found in DOM');
                return;
            }

            // Force container untuk memiliki dimensi
            chartContainer.style.minHeight = '300px';
            chartContainer.style.position = 'relative';

            // Tunggu 1 frame untuk memastikan layout stabil
            requestAnimationFrame(() => {
                // Initialize chart melalui app
                if (this.app.chartManager) {
                    console.log('📊 Initializing chart via ChartManager...');
                    this.app.chartManager.initializeChart();
                }
            });
        }, 100);
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

        // Quick transfer (NEW)
        document.getElementById('quickTransfer')?.addEventListener('click', () => {
            // Populate account dropdowns before opening modal
            const fromSelect = document.getElementById('transferFromAccount');
            const toSelect = document.getElementById('transferToAccount');

            if (fromSelect && toSelect) {
                const accountsHTML = this.app.state.accounts
                    .filter(a => a.active)
                    .map(a => `<option value="${a.id}">${a.name} (${this.app.calculator.formatCurrency(this.app.calculator.calculateAccountBalance(a))})</option>`)
                    .join('');

                fromSelect.innerHTML = '<option value="">Pilih akun sumber</option>' + accountsHTML;
                toSelect.innerHTML = '<option value="">Pilih akun tujuan</option>' + accountsHTML;
            }

            this.app.uiManager.openModal('transferModal');
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
        console.log('🔄 Refreshing dashboard...');

        if (!this.initialized) {
            this.render();
            return;
        }

        // Update dashboard content tanpa merusak chart
        this.updateDashboardContent();

        // Update chart data
        this.updateChartData();
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

        // Add stagger-children class to wrapper in the updating method, or ensure items render with animation
        // Since this returns string, we rely on the parent container having .stagger-children or add animations here.
        // Better: wrap the result in a div with .stagger-children if replacing innerHTML
        return `
            <div class="stagger-children">
                ${allTransactions.map(transaction => `
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
                        <button class="btn-icon-only" 
                                title="Duplicate"
                                onclick="handleDuplicateTransaction('${transaction.type === 'income' ? 'income' : 'expenses'}', ${transaction.id})"
                                style="margin-left: 10px; background: none; border: none; cursor: pointer; font-size: 1.2rem;">
                            📄
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getGoalsSectionHTML() {
        const goalsHTML = this.getGoalsHTML();

        return `
            <section class="goals-section">
                <h3 class="section-title" style="color: white;">Financial Goals</h3>
                <div class="goals-grid stagger-children" id="goalsGrid">
                    ${goalsHTML}
                </div>
            </section>
        `;
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