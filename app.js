/* ====== FINANCIAL MASTERPLAN PRO - ENHANCED APP ====== */
/* Menggabungkan semua fitur dari aplikasi lama + fitur premium baru */

// ====== CONFIGURATION & STATE MANAGEMENT ======

class FinancialApp {
    constructor() {
        this.state = {
            // User Data
            user: {
                name: 'Ferdiansyah Lim',
                avatar: 'FL',
                isPremium: true
            },
            
            // Financial Data
            finances: {
                income: 0,
                expenses: 0,
                savings: 0,
                balance: 0
            },
            
            // Transactions
            transactions: {
                income: [],
                expenses: []
            },
            
            // Goals
            goals: [],
            
            // Checklist
            checklist: [],
            
            // Settings
            settings: {
                currency: 'IDR',
                theme: 'light',
                notifications: true,
                autoSave: true
            },
            
            // UI State
            activeTab: 'dashboard',
            isLoading: true
        };
        
        // DOM Elements
        this.elements = {};

        // Chart Instance
        this.chartInstance = null;

        // PWA Install Prompt
        window.deferredPrompt = null;
        
        // Chart initialization flags
        this.chartInitialized = false;
        this.chartRetryCount = 0;
        this.maxChartRetries = 3;

        // Add resize timeout reference
        this.resizeTimeout = null;

        // Initialize
        this.init();
    }
    
    // ====== INITIALIZATION ======
    init() {
        console.log('🚀 Financial Masterplan PRO v2.0 Initializing...');
        
        // Cache DOM Elements
        this.cacheElements();
        
        // Load saved data
        this.loadData();
        
        // Setup Event Listeners
        this.setupEventListeners();
        
        // Setup Service Worker
        this.setupServiceWorker();
        
        // Initialize UI
        this.updateUI();
        
        // Calculate initial finances
        this.calculateFinances();
        
        // Show dashboard
        this.showDashboard();
        
        // Setup animations
        this.setupAnimations();

        this.setupResponsiveDesign();

        this.checkPWAStatus();
        
        console.log('✅ App initialized successfully');
    }

setupResponsiveDesign() {
    // Add responsive meta tag if not exists
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        document.head.appendChild(viewportMeta);
    }
    
    // Add responsive CSS classes only if not already added
    if (!document.querySelector('style[data-responsive-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-responsive-styles', 'true');
        style.textContent = `
            /* Responsive utilities */
            .mobile-only { display: none !important; }
            .desktop-only { display: block !important; }
            
            @media (max-width: 767px) {
                .mobile-only { display: block !important; }
                .desktop-only { display: none !important; }
                
                /* Touch-friendly buttons */
                button, .btn, .btn-outline, .nav-tab {
                    min-height: 44px;
                    min-width: 44px;
                }
                
                /* Better touch targets */
                .activity-item {
                    min-height: 60px;
                }
                
                /* Hide some elements on mobile */
                .text-muted.mobile-hide {
                    display: none;
                }
            }
            
            /* Print styles */
            @media print {
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                
                body {
                    font-size: 12pt;
                    color: #000 !important;
                    background: #fff !important;
                }
                
                .stat-card {
                    break-inside: avoid;
                }
            }
        `;
        document.head.appendChild(style);
    }
}


    checkPWAStatus() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        // Hide jika sudah diinstall
        if (window.matchMedia('(display-mode: standalone)').matches) {
            installBtn.style.display = 'none';
        }
        
        // Hide jika tidak support PWA
        if (!window.deferredPrompt && !('BeforeInstallPromptEvent' in window)) {
            installBtn.style.display = 'none';
        }
    }
}
    
    cacheElements() {
        // Main Containers
        this.elements.app = document.getElementById('app');
        this.elements.mainContent = document.getElementById('mainContent');
        
        // Header
        this.elements.userName = document.getElementById('userName');
        this.elements.userAvatar = document.getElementById('userAvatar');
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.installBtn = document.getElementById('installBtn');
        
        // Navigation
        this.elements.navTabs = document.getElementById('navTabs');
        this.elements.expenseBadge = document.getElementById('expenseBadge');
        this.elements.checklistBadge = document.getElementById('checklistBadge');
        
        // Modals
        this.elements.modalOverlay = document.getElementById('modalOverlay');
        this.elements.addExpenseModal = document.getElementById('addExpenseModal');
        this.elements.addIncomeModal = document.getElementById('addIncomeModal');
        this.elements.addGoalModal = document.getElementById('addGoalModal');
        
        // Forms
        this.elements.expenseForm = document.getElementById('expenseForm');
        this.elements.incomeForm = document.getElementById('incomeForm');
        this.elements.goalForm = document.getElementById('goalForm');
        
        // Footer
        this.elements.storageStatus = document.getElementById('storageStatus');
        this.elements.appMode = document.getElementById('appMode');
        this.elements.appVersion = document.getElementById('appVersion');
        
        // Buttons
        this.elements.clearDataBtn = document.getElementById('clearDataBtn');
        this.elements.helpBtn = document.getElementById('helpBtn');
        this.elements.tipsBtn = document.getElementById('tipsBtn');
        this.elements.exportReport = document.getElementById('exportReport');
    }
    
    // ====== DATA MANAGEMENT ======
    loadData() {
        try {
            // Load from localStorage
            const savedData = localStorage.getItem('financialMasterplanData');
            
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Merge with default state
                this.state = {
                    ...this.state,
                    ...parsed,
                    // Keep current UI state
                    activeTab: this.state.activeTab,
                    isLoading: false
                };
                
                console.log('📁 Data loaded from localStorage');
                this.elements.storageStatus.textContent = 'Local Storage';
            } else {
                // Use sample data for first-time users
                this.loadSampleData();
                this.elements.storageStatus.textContent = 'Sample Data';
            }
            
            // Update online/offline status
            this.updateOnlineStatus();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadSampleData();
        }
    }
    
    saveData(silent = false) {
        try {
            // Don't save UI state
            const dataToSave = {
                user: this.state.user,
                finances: this.state.finances,
                transactions: this.state.transactions,
                goals: this.state.goals,
                checklist: this.state.checklist,
                settings: this.state.settings
            };
            
            const dataString = JSON.stringify(dataToSave);
            
            // Cek ukuran data
            const dataSize = new Blob([dataString]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (dataSize > maxSize) {
                this.showNotification('Data terlalu besar, membersihkan data lama...', 'warning');
                this.cleanupOldData();
                return this.saveData(silent);
            }
            
            localStorage.setItem('financialMasterplanData', dataString);
            console.log('💾 Data saved to localStorage');
            
            if (!silent) {
                this.showNotification('Data tersimpan!', 'success');
            }
            
        } catch (error) {
            console.error('Error saving data:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.showNotification('Penyimpanan penuh, membersihkan data lama...', 'warning');
                this.cleanupOldData();
                this.saveData(silent);
            } else {
                this.showNotification('Gagal menyimpan data', 'error');
            }
        }
    }

    // Method baru: cleanupOldData
    cleanupOldData() {
        // Hapus transaksi yang lebih tua dari 6 bulan
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        this.state.transactions.income = this.state.transactions.income.filter(t => {
            return new Date(t.date) > sixMonthsAgo;
        });
        
        this.state.transactions.expenses = this.state.transactions.expenses.filter(t => {
            return new Date(t.date) > sixMonthsAgo;
        });
        
        this.showNotification('Data lama telah dibersihkan', 'info');
    }
  
    loadSampleData() {
        console.log('📊 Loading sample data...');
        
        this.state.transactions = {
            income: [
                { id: 1, name: 'Gaji Bulanan', amount: 8500000, category: 'gaji', date: new Date().toISOString().split('T')[0] },
                { id: 2, name: 'Freelance Project', amount: 2500000, category: 'freelance', date: '2026-01-01' }
            ],
            expenses: [
                { id: 1, name: 'Belanja Bulanan', amount: 2100000, category: 'kebutuhan', date: new Date().toISOString().split('T')[0] },
                { id: 2, name: 'Bensin Mobil', amount: 450000, category: 'transport', date: '2026-01-01' },
                { id: 3, name: 'Netflix Subscription', amount: 120000, category: 'hiburan', date: '2026-01-01' }
            ]
        };
        
        this.state.goals = [
            { id: 1, name: 'DP Rumah', target: 100000000, current: 45000000, deadline: '2026-01-01', progress: 45 },
            { id: 2, name: 'Liburan Japan', target: 25000000, current: 18000000, deadline: '2026-01-01', progress: 72 },
            { id: 3, name: 'Emergency Fund', target: 50000000, current: 45000000, deadline: '2026-01-01', progress: 99 }
        ];
        
        this.state.checklist = [
            { id: 1, task: 'Bayar listrik bulanan', completed: true },
            { id: 2, task: 'Transfer tabungan', completed: false },
            { id: 3, task: 'Review budget mingguan', completed: false }
        ];
        
        this.state.isLoading = false;
    }
    
    clearData() {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            localStorage.removeItem('financialMasterplanData');
            this.loadSampleData();
            this.calculateFinances();
            this.updateUI();
            this.showNotification('Semua data telah direset', 'warning');
        }
    }
    
    // ====== FINANCIAL CALCULATIONS ======
    calculateFinances() {
        console.log('🧮 Calculating finances...');
        
        // Calculate total income
        const totalIncome = this.state.transactions.income.reduce((sum, item) => sum + item.amount, 0);
        
        // Calculate total expenses
        const totalExpenses = this.state.transactions.expenses.reduce((sum, item) => sum + item.amount, 0);
        
        // Calculate savings (income - expenses)
        const totalSavings = totalIncome - totalExpenses;
        
        // Calculate balance
        const balance = totalSavings;
        
        // Update state
        this.state.finances = {
            income: totalIncome,
            expenses: totalExpenses,
            savings: totalSavings,
            balance: balance
        };
        
        // Auto-save if enabled
        if (this.state.settings.autoSave) {
            this.saveData(true); // ← silent save
        }
    }
    
    formatCurrency(amount) {
        const currency = this.state.settings.currency || 'IDR';
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(amount);
    }
    
    // ====== TRANSACTION MANAGEMENT ======
    addTransaction(type, data) {
        const id = Date.now(); // Simple ID generation
        
        const transaction = {
            id,
            ...data,
            date: data.date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        
        this.state.transactions[type].unshift(transaction);
        
        // Recalculate finances
        this.calculateFinances();
        
        // Update UI
        this.updateUI();
        
        // Show success message
        this.showNotification(
            `${type === 'income' ? 'Pendapatan' : 'Pengeluaran'} berhasil ditambahkan!`,
            'success'
        );
        
        // Close modal
        this.closeModal();

        // Refresh chart jika di dashboard
        if (this.state.activeTab === 'dashboard' && this.chartInstance) {
            setTimeout(() => {
                this.chartInstance.data = this.generateChartData();
                this.chartInstance.update();
                this.calculateTrends(); // Update trends juga
            }, 100);
        }
                
        return transaction;
    }
    
    deleteTransaction(type, id) {
        this.state.transactions[type] = this.state.transactions[type].filter(item => item.id !== id);
        this.calculateFinances();
        this.updateUI();
        this.showNotification('Transaksi dihapus', 'info');
    }
    
    // ====== GOALS MANAGEMENT ======
    addGoal(data) {
        const id = Date.now();
        
        const progress = data.current ? Math.round((data.current / data.target) * 100) : 0;
        
        const goal = {
            id,
            ...data,
            progress,
            created: new Date().toISOString()
        };
        
        this.state.goals.push(goal);
        
        // Update UI
        this.updateGoals();
        
        // Show success message
        this.showNotification('Goal berhasil ditambahkan! 🎯', 'success');
        
        // Close modal
        this.closeModal();
        
        return goal;
    }
    
    updateGoal(id, updates) {
        const goalIndex = this.state.goals.findIndex(g => g.id === id);
        
        if (goalIndex !== -1) {
            const goal = { ...this.state.goals[goalIndex], ...updates };
            
            // Recalculate progress if current amount changed
            if (updates.current !== undefined) {
                goal.progress = Math.round((goal.current / goal.target) * 100);
            }
            
            this.state.goals[goalIndex] = goal;
            
            // Update UI
            this.updateGoals();
            
            this.showNotification('Goal diperbarui!', 'success');
            
            return goal;
        }
    }
    
    // ====== UI UPDATES ======
    updateUI() {
        // Update user info
        this.elements.userName.textContent = this.state.user.name;
        this.elements.userAvatar.textContent = this.state.user.avatar;
        
        // Update badges
        this.updateBadges();
        
        // Update current tab
        this.updateTabContent();
        
        // Update footer
        this.updateFooter();
    }
    
    updateBadges() {
        console.log('🔄 Updating badges...');
        
        // Update expense badge dengan null check
        if (this.elements.expenseBadge) {
            try {
                const pendingExpenses = this.state.transactions.expenses.filter(e => {
                    try {
                        const expenseDate = new Date(e.date);
                        const today = new Date();
                        const diffTime = today - expenseDate;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 3; // Expenses within last 3 days
                    } catch (error) {
                        console.warn('Error processing expense date:', e.date);
                        return false;
                    }
                }).length;
                
                this.elements.expenseBadge.textContent = pendingExpenses;
                console.log(`✅ Expense badge updated: ${pendingExpenses}`);
            } catch (error) {
                console.error('❌ Error updating expense badge:', error);
                this.elements.expenseBadge.textContent = '0';
            }
        } else {
            console.warn('⚠️ expenseBadge element not found');
        }
        
        // Update checklist badge dengan null check
        if (this.elements.checklistBadge) {
            try {
                const incompleteTasks = this.state.checklist.filter(task => !task.completed).length;
                this.elements.checklistBadge.textContent = incompleteTasks;
                console.log(`✅ Checklist badge updated: ${incompleteTasks}`);
            } catch (error) {
                console.error('❌ Error updating checklist badge:', error);
                this.elements.checklistBadge.textContent = '0';
            }
        } else {
            console.warn('⚠️ checklistBadge element not found');
        }
        
        // Juga update di footer jika perlu
        this.updateFooter();
    }
    
    updateTabContent() {
        switch (this.state.activeTab) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'expenses':
                this.showExpenses();
                break;
            case 'income':
                this.showIncome();
                break;
            case 'checklist':
                this.showChecklist();
                break;
            case 'simulation':
                this.showSimulation();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }
    
    updateFooter() {
        // Update app version
        this.elements.appVersion.textContent = '2.0.0';
        
        // Update storage status
        const usedSpace = JSON.stringify(this.state).length;
        const spaceKB = (usedSpace / 1024).toFixed(2);
        this.elements.storageStatus.textContent = `Local (${spaceKB} KB)`;
    }
    
    // ====== DASHBOARD VIEW ======
    showDashboard() {
        console.log('📊 Rendering dashboard...');
        
        const dashboardHTML = `
            <!-- STATS GRID -->
            <div class="stats-grid">
                <div class="stat-card income">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Total Pendapatan</div>
                            <div class="stat-value" id="totalIncome" style="color: var(--success);">
                                ${this.formatCurrency(this.state.finances.income)}
                            </div>
                        </div>
                        <div class="stat-icon">💰</div>
                    </div>
                    <div class="stat-trend trend-up" id="incomeTrend">
                        <span>📈</span> Loading trend...
                    </div>
                </div>
                
                <div class="stat-card expense">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Total Pengeluaran</div>
                            <div class="stat-value" id="totalExpense" style="color: var(--danger);">
                                ${this.formatCurrency(this.state.finances.expenses)}
                            </div>
                        </div>
                        <div class="stat-icon">💸</div>
                    </div>
                    <div class="stat-trend trend-down" id="expenseTrend">
                        <span>📉</span> Loading trend...
                    </div>
                </div>
                
                <div class="stat-card savings">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Total Tabungan</div>
                            <div class="stat-value" id="totalSavings" style="color: var(--primary);">
                                ${this.formatCurrency(this.state.finances.savings)}
                            </div>
                        </div>
                        <div class="stat-icon">🏦</div>
                    </div>
                    <div class="stat-trend trend-up" id="savingsTrend">
                        <span>🚀</span> Loading trend...
                    </div>
                </div>
            </div>
            
            <!-- PROGRESS SECTION -->
            <section class="progress-section">
                <div class="progress-header">
                    <div class="progress-title">Progress Target Financial</div>
                    <div class="progress-badge" id="totalProgress">0% Tercapai</div>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                </div>
                
                <div class="progress-info">
                    <div class="progress-info-item">
                        <div class="progress-info-label">Target</div>
                        <div class="progress-info-value" id="totalTarget">Rp 0</div>
                    </div>
                    <div class="progress-info-item">
                        <div class="progress-info-label">Terkumpul</div>
                        <div class="progress-info-value" id="totalCurrent">Rp 0</div>
                    </div>
                    <div class="progress-info-item">
                        <div class="progress-info-label">Sisa Waktu</div>
                        <div class="progress-info-value" id="daysLeft">- Hari</div>
                    </div>
                </div>
            </section>
            
            <!-- QUICK ACTIONS -->
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
                        ${this.renderRecentActivity()}
                    </div>
                </div>
            </div>
            
            <!-- GOALS SECTION -->
            <section class="goals-section">
                <h3 class="section-title" style="color: white;">Financial Goals</h3>
                <div class="goals-grid" id="goalsGrid">
                    ${this.renderGoals()}
                </div>
            </section>
        `;
        
        this.elements.mainContent.innerHTML = dashboardHTML;
        
        // Initialize dashboard components
        this.initializeDashboard();
    }
    
    renderRecentActivity() {
        // Combine income and expenses, sort by date
        const allTransactions = [
            ...this.state.transactions.income.map(t => ({ ...t, type: 'income' })),
            ...this.state.transactions.expenses.map(t => ({ ...t, type: 'expense' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
         .slice(0, 5); // Show only 5 most recent
        
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
                        <span>${this.formatDate(transaction.date)}</span>
                        <span>•</span>
                        <span>${this.getCategoryName(transaction.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: ${transaction.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
                    ${transaction.type === 'income' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }
    
    renderGoals() {
        if (this.state.goals.length === 0) {
            return '<div class="text-center" style="color: rgba(255,255,255,0.8);">Belum ada goals yang dibuat</div>';
        }
        
        return this.state.goals.map(goal => `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div style="font-weight: 600; margin-bottom: var(--space-2);">${goal.name}</div>
                <div class="text-muted" style="opacity: 0.8;">Target: ${this.formatCurrency(goal.target)}</div>
                <div class="goal-progress" style="margin: var(--space-3) 0;">
                    <div class="goal-progress-bar" style="width: ${goal.progress}%"></div>
                </div>
                <div style="margin-top: var(--space-3); font-size: 0.875rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Terkumpul: ${goal.progress}%</span>
                        <span>${this.formatCurrency(goal.current)}</span>
                    </div>
                    <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px;">
                        Deadline: ${this.formatDate(goal.deadline)}
                    </div>
                </div>
                <button class="btn-outline" style="margin-top: var(--space-3); width: 100%; font-size: 0.875rem;" 
                        onclick="app.updateGoalAmount(${goal.id})">
                    + Tambah Dana
                </button>
            </div>
        `).join('');
    }
    
    initializeDashboard() {
        // Calculate trends
        this.calculateTrends();
        
        // Initialize chart - FIXED: Langsung initialize tanpa delay
        this.initializeChart();
        
        // Update progress section
        this.updateProgressSection();
        
        // Add event listeners for quick actions
        this.setupQuickActions();
        
        // Setup chart controls with delay to ensure DOM ready
        setTimeout(() => {
            this.setupChartControls();
        }, 300);
    }
    
// GANTI method calculateTrends() dengan ini:
calculateTrends() {
    // Calculate REAL trends based on last 2 months
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
    const currentIncome = getMonthTotal(this.state.transactions.income, 0);
    const previousIncome = getMonthTotal(this.state.transactions.income, 1);
    const currentExpense = getMonthTotal(this.state.transactions.expenses, 0);
    const previousExpense = getMonthTotal(this.state.transactions.expenses, 1);
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
    const incomeTrendEl = document.getElementById('incomeTrend');
    const expenseTrendEl = document.getElementById('expenseTrend');
    const savingsTrendEl = document.getElementById('savingsTrend');
    
    if (incomeTrendEl) {
        incomeTrendEl.innerHTML = `
            <span>${incomeTrend === 'up' ? '📈' : '📉'}</span>
            ${incomeTrend === 'up' ? '+' : ''}${incomeChange}% dari bulan lalu
        `;
    }
    
    if (expenseTrendEl) {
        expenseTrendEl.innerHTML = `
            <span>${expenseTrend === 'up' ? '📈' : '📉'}</span>
            ${expenseTrend === 'up' ? '+' : ''}${expenseChange}% dari bulan lalu
        `;
    }
    
    if (savingsTrendEl) {
        savingsTrendEl.innerHTML = `
            <span>${savingsTrend === 'up' ? '🚀' : '📉'}</span>
            ${savingsTrend === 'up' ? '+' : ''}${savingsChange}% dari bulan lalu
        `;
    }
}
    
    updateProgressSection() {
        // Calculate total goals progress
        const totalTarget = this.state.goals.reduce((sum, goal) => sum + goal.target, 0);
        const totalCurrent = this.state.goals.reduce((sum, goal) => sum + goal.current, 0);
        const totalProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
        
        // Calculate days until nearest deadline
        const now = new Date();
        const upcomingDeadlines = this.state.goals
            .map(g => new Date(g.deadline))
            .filter(d => d > now)
            .sort((a, b) => a - b);
        
        const daysLeft = upcomingDeadlines.length > 0 
            ? Math.ceil((upcomingDeadlines[0] - now) / (1000 * 60 * 60 * 24))
            : 0;
        
        // Update progress section
        const progressBar = document.getElementById('progressBar');
        const totalProgressEl = document.getElementById('totalProgress');
        const totalTargetEl = document.getElementById('totalTarget');
        const totalCurrentEl = document.getElementById('totalCurrent');
        const daysLeftEl = document.getElementById('daysLeft');
        
        if (progressBar) {
            progressBar.style.width = `${totalProgress}%`;
            totalProgressEl.textContent = `${totalProgress}% Tercapai`;
            totalTargetEl.textContent = this.formatCurrency(totalTarget);
            totalCurrentEl.textContent = this.formatCurrency(totalCurrent);
            daysLeftEl.textContent = `${daysLeft} Hari`;
        }
    }
    
    updateGoals() {
        const goalsGrid = document.getElementById('goalsGrid');
        if (goalsGrid) {
            goalsGrid.innerHTML = this.renderGoals();
        }
        
        this.updateProgressSection();
    }
    
    // ====== CHART FUNCTIONALITY - FIXED VERSION ======
    initializeChart() {
        console.log('📊 Initializing chart...');
        
        // Reset retry counter
        this.chartRetryCount = 0;
        
        // Coba initialize chart langsung
        this.tryInitializeChart();
    }
    
    tryInitializeChart() {
        this.chartRetryCount++;
        
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) {
            console.error('❌ Chart container not found');
            
            // Retry jika belum mencapai limit
            if (this.chartRetryCount < this.maxChartRetries) {
                console.log(`🔄 Retrying chart initialization (${this.chartRetryCount}/${this.maxChartRetries})...`);
                setTimeout(() => this.tryInitializeChart(), 100 * this.chartRetryCount);
            } else {
                this.showFallbackChart();
            }
            return false;
        }
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded yet');
            
            if (this.chartRetryCount < this.maxChartRetries) {
                console.log(`🔄 Waiting for Chart.js (${this.chartRetryCount}/${this.maxChartRetries})...`);
                setTimeout(() => this.tryInitializeChart(), 200 * this.chartRetryCount);
                return false;
            } else {
                // Load Chart.js dynamically
                this.loadChartJsDynamically();
                return false;
            }
        }
        
        // Check if canvas element exists
        let canvas = document.getElementById('financeChart');
        if (!canvas) {
            // Create canvas element
            chartContainer.innerHTML = '<canvas id="financeChart"></canvas>';
            canvas = document.getElementById('financeChart');
        }
        
        if (!canvas) {
            console.error('❌ Cannot create canvas element');
            this.showFallbackChart();
            return false;
        }
        
        // Cleanup previous chart instance
        this.destroyChart();
        
        try {
            // Create new chart instance
            this.createChartInstance(canvas);
            this.chartInitialized = true;
            console.log('✅ Chart initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error creating chart:', error);
            
            if (this.chartRetryCount < this.maxChartRetries) {
                console.log(`🔄 Retrying after error (${this.chartRetryCount}/${this.maxChartRetries})...`);
                setTimeout(() => this.tryInitializeChart(), 300 * this.chartRetryCount);
            } else {
                this.showFallbackChart(error);
            }
            return false;
        }
    }
    
    createChartInstance(canvas) {
        // Generate chart data
        const data = this.generateChartData();
        
        // Get context
        const ctx = canvas.getContext('2d');
        
        // Create chart
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                            font: {
                                size: 12,
                                family: 'Inter, sans-serif',
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: document.body.classList.contains('dark-mode') 
                            ? 'rgba(30, 41, 59, 0.95)' 
                            : 'rgba(255, 255, 255, 0.95)',
                        titleColor: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                        bodyColor: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
                        borderColor: 'rgba(67, 97, 238, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${this.formatCurrency(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: document.body.classList.contains('dark-mode') 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.03)'
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-muted')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: document.body.classList.contains('dark-mode') 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.03)'
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-muted'),
                            callback: (value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        hoverBorderWidth: 2
                    },
                    line: {
                        tension: 0.3,
                        borderWidth: 3
                    }
                }
            }
        });
        
        // Update chart placeholder
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.classList.remove('chart-placeholder');
            chartContainer.style.background = 'transparent';
            chartContainer.style.border = 'none';
        }
    }
    
// GANTI method generateChartData() dengan ini:
generateChartData() {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    
    // Initialize arrays with zeros
    const incomeData = new Array(12).fill(0);
    const expenseData = new Array(12).fill(0);
    
    // REAL DATA: Aggregate income by month
    this.state.transactions.income.forEach(transaction => {
        try {
            const date = new Date(transaction.date);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth(); // 0-11
                incomeData[month] += transaction.amount;
            }
        } catch (e) {
            console.warn('Invalid date in transaction:', transaction);
        }
    });
    
    // REAL DATA: Aggregate expenses by month
    this.state.transactions.expenses.forEach(transaction => {
        try {
            const date = new Date(transaction.date);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth(); // 0-11
                expenseData[month] += transaction.amount;
            }
        } catch (e) {
            console.warn('Invalid date in transaction:', transaction);
        }
    });
    
    // Jika tidak ada data, show message
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);
    
    if (totalIncome === 0 && totalExpense === 0) {
        console.log('📊 No transaction data for chart, using sample data');
        // Return sample data untuk demo
        return {
            labels: labels,
            datasets: [
                {
                    label: 'Pendapatan',
                    data: [5000000, 6000000, 7000000, 6500000, 8000000, 8500000, 9000000, 9500000, 9200000, 8800000, 9500000, 10000000],
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Pengeluaran',
                    data: [3000000, 3500000, 4000000, 4200000, 4500000, 5000000, 5500000, 6000000, 5800000, 5200000, 4800000, 4500000],
                    borderColor: '#ef233c',
                    backgroundColor: 'rgba(239, 35, 60, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }
            ]
        };
    }
    
    return {
        labels: labels,
        datasets: [
            {
                label: 'Pendapatan',
                data: incomeData,
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            },
            {
                label: 'Pengeluaran',
                data: expenseData,
                borderColor: '#ef233c',
                backgroundColor: 'rgba(239, 35, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }
        ]
    };
}
    
    loadChartJsDynamically() {
        console.log('📦 Loading Chart.js dynamically...');
        
        // Check if already loaded
        if (typeof Chart !== 'undefined') {
            this.tryInitializeChart();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            console.log('✅ Chart.js loaded successfully');
            this.tryInitializeChart();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Chart.js');
            this.showFallbackChart();
        };
        document.head.appendChild(script);
    }
    
    destroyChart() {
        if (this.chartInstance) {
            try {
                this.chartInstance.destroy();
                this.chartInstance = null;
                console.log('🗑️ Previous chart destroyed');
            } catch (error) {
                console.warn('⚠️ Error destroying chart:', error);
            }
        }
        this.chartInitialized = false;
    }
    
    showFallbackChart(error = null) {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;
        
        const errorMessage = error ? `Error: ${error.message}` : 'Chart tidak tersedia';
        
        chartContainer.innerHTML = `
            <div class="fallback-chart">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.7;">📊</div>
                    <div style="font-weight: 700; font-size: 1.25rem; margin-bottom: 8px;">
                        Visualisasi Data
                    </div>
                    <div style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">
                        ${errorMessage}
                    </div>
                    <div style="margin-top: 30px;">
                        ${this.renderSimplifiedChart()}
                    </div>
                    <button onclick="app.initializeChart()" 
                            style="margin-top: 20px; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        🔄 Coba Lagi
                    </button>
                </div>
            </div>
        `;
        
        console.log('📊 Showing fallback chart');
    }
    
    renderSimplifiedChart() {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
        const incomeData = [5, 7, 8, 6, 9, 10];
        const expenseData = [3, 5, 6, 4, 7, 8];
        const maxValue = Math.max(...incomeData, ...expenseData);
        
        let html = '<div style="height: 200px; display: flex; align-items: flex-end; gap: 10px; justify-content: center;">';
        
        labels.forEach((label, index) => {
            const incomeHeight = (incomeData[index] / maxValue) * 150;
            const expenseHeight = (expenseData[index] / maxValue) * 150;
            
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="display: flex; align-items: flex-end; gap: 4px; height: 150px;">
                        <div style="width: 12px; height: ${incomeHeight}px; background: #4cc9f0; border-radius: 3px;"></div>
                        <div style="width: 12px; height: ${expenseHeight}px; background: #ef233c; border-radius: 3px;"></div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);">${label}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add legend
        html += `
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: #4cc9f0; border-radius: 2px;"></div>
                    <span style="color: var(--text-muted);">Pendapatan</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: #ef233c; border-radius: 2px;"></div>
                    <span style="color: var(--text-muted);">Pengeluaran</span>
                </div>
            </div>
        `;
        
        return html;
    }
    
// GANTI method updateChartPeriod() dengan ini:
updateChartPeriod(period) {
    console.log(`📊 Updating chart to ${period} period`);
    
    if (period === 'custom') {
        // Tampilkan modal custom date picker
        this.showCustomDateModal();
        return;
    }
    
    if (!this.chartInstance) {
        console.warn('Chart instance not available');
        return;
    }
    
    try {
        // Update active button
        const chartButtons = document.querySelectorAll('.chart-btn');
        chartButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            }
        });
        
        // Generate data based on period
        const newData = this.generateChartDataByPeriod(period);
        
        // Update chart
        this.chartInstance.data = newData;
        this.chartInstance.update('none');
        
        // Show notification
        const periodNames = {
            'monthly': 'Bulanan',
            'yearly': 'Tahunan', 
            'custom': 'Custom'
        };
        
        this.showNotification(`Chart diperbarui: Periode ${periodNames[period]}`, 'success');
        
    } catch (error) {
        console.error('Error updating chart period:', error);
        this.showNotification('Gagal memperbarui chart', 'error');
    }
}


showCustomDateModal() {
    // Hapus modal yang sudah ada jika ada
    const existingModal = document.getElementById('customDateModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal active" id="customDateModal" style="z-index: 1000;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📅 Custom Periode Chart</h3>
                    <button class="modal-close" id="closeCustomModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="customStartDate">Tanggal Mulai</label>
                        <input type="date" id="customStartDate" 
                               value="${this.getDateMonthsAgo(6)}" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="customEndDate">Tanggal Akhir</label>
                        <input type="date" id="customEndDate" 
                               value="${new Date().toISOString().split('T')[0]}" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="customGroupBy">Group By</label>
                        <select id="customGroupBy" class="form-control">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly" selected>Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    
                    <div class="button-group" style="display: flex; gap: var(--space-3); margin-top: var(--space-6);">
                        <button class="btn-outline" id="cancelCustomModal" style="flex: 1;">
                            Batal
                        </button>
                        <button class="btn" id="applyCustomFilter" style="flex: 1;">
                            Terapkan Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Tambahkan modal ke body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show overlay
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Setup event listeners untuk modal baru
    this.setupCustomModalEvents();
}

// ====== METHOD BARU: setupCustomModalEvents() ======
setupCustomModalEvents() {
    // Close button
    document.getElementById('closeCustomModal')?.addEventListener('click', () => {
        this.closeCustomModal();
    });
    
    // Cancel button
    document.getElementById('cancelCustomModal')?.addEventListener('click', () => {
        this.closeCustomModal();
    });
    
    // Apply button
    document.getElementById('applyCustomFilter')?.addEventListener('click', () => {
        this.applyCustomFilter();
    });
    
    // Close on overlay click
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            this.closeCustomModal();
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeCustomModal();
        }
    });
}

// ====== METHOD BARU: closeCustomModal() ======
closeCustomModal() {
    const modal = document.getElementById('customDateModal');
    if (modal) {
        modal.remove();
    }
    
    // Hide overlay
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
    
    // Remove ESC key listener
    document.removeEventListener('keydown', this.handleEscapeKey);
}

getDateMonthsAgo(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    
    // Format ke YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

applyCustomFilter() {
    const startDate = document.getElementById('customStartDate')?.value;
    const endDate = document.getElementById('customEndDate')?.value;
    const groupBy = document.getElementById('customGroupBy')?.value;
    
    if (!startDate || !endDate) {
        this.showNotification('Pilih tanggal mulai dan akhir', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        this.showNotification('Tanggal mulai tidak boleh setelah tanggal akhir', 'error');
        return;
    }
    
    // Generate custom chart data
    const customData = this.generateCustomChartData(startDate, endDate, groupBy);
    
    // Update chart
    if (this.chartInstance) {
        this.chartInstance.data = customData;
        this.chartInstance.update();
        this.showNotification(`Chart custom diterapkan (${groupBy})`, 'success');
    }
    
    // Update active button
    this.updateCustomChartButton();
    
    // Close modal
    this.closeCustomModal();
}

// ====== METHOD BARU: updateCustomChartButton() ======
updateCustomChartButton() {
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === 'custom') {
            btn.classList.add('active');
        }
    });
}

generateCustomChartData(startDate, endDate, groupBy = 'monthly') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let labels = [];
    let incomeData = [];
    let expenseData = [];
    
    // Generate labels based on groupBy
    switch(groupBy) {
        case 'daily':
            // Generate daily labels
            let current = new Date(start);
            while (current <= end) {
                labels.push(current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
                
                // Calculate daily totals
                const dayIncome = this.state.transactions.income.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate.toDateString() === current.toDateString() ? sum + t.amount : sum;
                }, 0);
                
                const dayExpense = this.state.transactions.expenses.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate.toDateString() === current.toDateString() ? sum + t.amount : sum;
                }, 0);
                
                incomeData.push(dayIncome);
                expenseData.push(dayExpense);
                
                current.setDate(current.getDate() + 1);
            }
            break;
            
        case 'weekly':
            // Generate weekly labels (Minggu 1, Minggu 2, etc.)
            let weekStart = new Date(start);
            let weekCount = 1;
            
            while (weekStart <= end) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                labels.push(`Minggu ${weekCount}`);
                
                // Calculate weekly totals
                const weekIncome = this.state.transactions.income.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= weekStart && transDate <= weekEnd ? sum + t.amount : sum;
                }, 0);
                
                const weekExpense = this.state.transactions.expenses.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= weekStart && transDate <= weekEnd ? sum + t.amount : sum;
                }, 0);
                
                incomeData.push(weekIncome);
                expenseData.push(weekExpense);
                
                weekStart.setDate(weekStart.getDate() + 7);
                weekCount++;
            }
            break;
            
        case 'monthly':
            // Generate monthly labels
            let monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
            
            while (monthStart <= end) {
                const monthName = monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                labels.push(monthName);
                
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                
                // Calculate monthly totals
                const monthIncome = this.state.transactions.income.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= monthStart && transDate <= monthEnd ? sum + t.amount : sum;
                }, 0);
                
                const monthExpense = this.state.transactions.expenses.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= monthStart && transDate <= monthEnd ? sum + t.amount : sum;
                }, 0);
                
                incomeData.push(monthIncome);
                expenseData.push(monthExpense);
                
                monthStart.setMonth(monthStart.getMonth() + 1);
            }
            break;
            
        case 'yearly':
            // Generate yearly labels
            let yearStart = new Date(start.getFullYear(), 0, 1);
            
            while (yearStart <= end) {
                labels.push(yearStart.getFullYear().toString());
                
                const yearEnd = new Date(yearStart.getFullYear(), 11, 31);
                
                // Calculate yearly totals
                const yearIncome = this.state.transactions.income.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= yearStart && transDate <= yearEnd ? sum + t.amount : sum;
                }, 0);
                
                const yearExpense = this.state.transactions.expenses.reduce((sum, t) => {
                    const transDate = new Date(t.date);
                    return transDate >= yearStart && transDate <= yearEnd ? sum + t.amount : sum;
                }, 0);
                
                incomeData.push(yearIncome);
                expenseData.push(yearExpense);
                
                yearStart.setFullYear(yearStart.getFullYear() + 1);
            }
            break;
    }
    
    // If no data, use sample
    if (incomeData.every(v => v === 0) && expenseData.every(v => v === 0)) {
        incomeData = labels.map(() => Math.floor(Math.random() * 10000000) + 2000000);
        expenseData = labels.map(() => Math.floor(Math.random() * 6000000) + 1000000);
    }
    
    return {
        labels: labels,
        datasets: [
            {
                label: 'Pendapatan',
                data: incomeData,
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            },
            {
                label: 'Pengeluaran',
                data: expenseData,
                borderColor: '#ef233c',
                backgroundColor: 'rgba(239, 35, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }
        ]
    };
}


// TAMBAHKAN method baru ini:
generateChartDataByPeriod(period = 'monthly') {
    let labels = [];
    let incomeData = [];
    let expenseData = [];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    switch(period) {
        case 'monthly':
            // Last 12 months
            labels = this.getLast12MonthsLabels();
            
            // Aggregate data for last 12 months
            for (let i = 11; i >= 0; i--) {
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() - i);
                
                const month = targetDate.getMonth();
                const year = targetDate.getFullYear();
                
                // Calculate income for this month
                const monthIncome = this.state.transactions.income.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getMonth() === month && transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                // Calculate expenses for this month
                const monthExpense = this.state.transactions.expenses.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getMonth() === month && transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                incomeData.push(monthIncome || 0);
                expenseData.push(monthExpense || 0);
            }
            break;
            
        case 'yearly':
            // Last 5 years
            labels = [];
            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                labels.push(year.toString());
                
                // Calculate income for this year
                const yearIncome = this.state.transactions.income.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                // Calculate expenses for this year
                const yearExpense = this.state.transactions.expenses.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                incomeData.push(yearIncome || 0);
                expenseData.push(yearExpense || 0);
            }
            break;
            
        case 'custom':
            // Custom: Last 6 months (you can expand this later)
            labels = this.getLast6MonthsLabels();
            
            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() - i);
                
                const month = targetDate.getMonth();
                const year = targetDate.getFullYear();
                
                const monthIncome = this.state.transactions.income.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getMonth() === month && transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                const monthExpense = this.state.transactions.expenses.reduce((total, transaction) => {
                    try {
                        const transDate = new Date(transaction.date);
                        if (transDate.getMonth() === month && transDate.getFullYear() === year) {
                            return total + transaction.amount;
                        }
                    } catch (e) {
                        console.warn('Invalid transaction date:', transaction.date);
                    }
                    return total;
                }, 0);
                
                incomeData.push(monthIncome || 0);
                expenseData.push(monthExpense || 0);
            }
            break;
            
        default:
            // Default to monthly
            return this.generateChartData();
    }
    
    // If no data, use sample data
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);
    
    if (totalIncome === 0 && totalExpense === 0) {
        console.log('📊 No data for period:', period, 'using sample data');
        
        if (period === 'yearly') {
            // Sample yearly data
            incomeData = [5000000, 6000000, 7500000, 8500000, 9200000];
            expenseData = [3000000, 3500000, 4500000, 5000000, 5500000];
        } else {
            // Sample monthly data
            incomeData = labels.map(() => Math.floor(Math.random() * 8000000) + 3000000);
            expenseData = labels.map(() => Math.floor(Math.random() * 5000000) + 2000000);
        }
    }
    
    return {
        labels: labels,
        datasets: [
            {
                label: 'Pendapatan',
                data: incomeData,
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            },
            {
                label: 'Pengeluaran',
                data: expenseData,
                borderColor: '#ef233c',
                backgroundColor: 'rgba(239, 35, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }
        ]
    };
}

// TAMBAHKAN helper method:
getLast12MonthsLabels() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const labels = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - i);
        const monthIndex = targetDate.getMonth();
        labels.push(months[monthIndex]);
    }
    
    return labels;
}

getLast6MonthsLabels() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const labels = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - i);
        const monthIndex = targetDate.getMonth();
        labels.push(months[monthIndex]);
    }
    
    return labels;
}
    
    // ====== OTHER VIEWS ======
    showExpenses() {
        const expensesHTML = `
            <div class="section-title">💸 Pengeluaran</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--danger);">
                        ${this.formatCurrency(this.state.finances.expenses)}
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
                            <div class="stat-value">${this.formatCurrency(Math.round(this.state.finances.expenses / 30))}</div>
                        </div>
                        <div class="stat-icon">📅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Kategori Terbesar</div>
                            <div class="stat-value" id="largestCategory">-</div>
                        </div>
                        <div class="stat-icon">🏷️</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Transaksi</div>
                            <div class="stat-value">${this.state.transactions.expenses.length}</div>
                        </div>
                        <div class="stat-icon">📝</div>
                    </div>
                </div>
            </div>
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Pengeluaran</h3>
                    <div class="text-muted">${this.state.transactions.expenses.length} transaksi</div>
                </div>
                
                <div id="expensesList">
                    ${this.renderExpensesList()}
                </div>
            </div>
        `;
        
        this.elements.mainContent.innerHTML = expensesHTML;
        this.setupExpensesView();
    }
    
    renderExpensesList() {
        if (this.state.transactions.expenses.length === 0) {
            return '<div class="text-center text-muted mt-6">Belum ada pengeluaran</div>';
        }
        
        return this.state.transactions.expenses.map(expense => `
            <div class="activity-item expense-activity" data-expense-id="${expense.id}">
                <div class="activity-icon">💸</div>
                <div class="activity-details">
                    <div class="activity-title">${expense.name}</div>
                    <div class="activity-meta">
                        <span>${this.formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>${this.getCategoryName(expense.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: var(--danger);">
                    - ${this.formatCurrency(expense.amount)}
                </div>
                <button class="btn-outline" style="margin-left: var(--space-2); font-size: 0.875rem;" 
                        onclick="app.deleteExpense(${expense.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }
    
    // ====== INCOME TAB - FULL FUNCTIONALITY ======
    showIncome() {
        const incomeHTML = `
            <div class="section-title">💰 Pendapatan</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--success);">
                        ${this.formatCurrency(this.state.finances.income)}
                    </div>
                    <div class="text-muted">Total pendapatan bulan ini</div>
                </div>
                <button class="btn" id="addIncomeBtn">
                    <span>➕</span> Tambah Pendapatan
                </button>
            </div>
            
            <div class="stats-grid" style="margin-bottom: var(--space-6);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Rata-rata Bulanan</div>
                            <div class="stat-value">${this.formatCurrency(Math.round(this.state.finances.income / 12))}</div>
                        </div>
                        <div class="stat-icon">📅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Sumber Terbesar</div>
                            <div class="stat-value" id="largestSource">-</div>
                        </div>
                        <div class="stat-icon">🏷️</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Transaksi</div>
                            <div class="stat-value">${this.state.transactions.income.length}</div>
                        </div>
                        <div class="stat-icon">📝</div>
                    </div>
                </div>
            </div>
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Pendapatan</h3>
                    <div class="text-muted">${this.state.transactions.income.length} transaksi</div>
                </div>
                
                <div id="incomeList">
                    ${this.renderIncomeList()}
                </div>
            </div>
            
            <!-- Income Analysis -->
            <div class="dashboard-grid mt-6">
                <div class="activity-section">
                    <h3 class="section-title">Analisis Sumber Pendapatan</h3>
                    <div id="incomeAnalysis" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
                        ${this.renderIncomeAnalysis()}
                    </div>
                </div>
                
                <div class="activity-section">
                    <h3 class="section-title">Statistik Bulanan</h3>
                    <div style="padding: var(--space-4);">
                        ${this.renderMonthlyIncomeStats()}
                    </div>
                </div>
            </div>
        `;
        
        this.elements.mainContent.innerHTML = incomeHTML;
        this.setupIncomeView();
    }

    renderIncomeList() {
        if (this.state.transactions.income.length === 0) {
            return '<div class="text-center text-muted mt-6">Belum ada pendapatan</div>';
        }
        
        return this.state.transactions.income.map(income => `
            <div class="activity-item income-activity" data-income-id="${income.id}">
                <div class="activity-icon">💰</div>
                <div class="activity-details">
                    <div class="activity-title">${income.name}</div>
                    <div class="activity-meta">
                        <span>${this.formatDate(income.date)}</span>
                        <span>•</span>
                        <span>${this.getCategoryName(income.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: var(--success);">
                    + ${this.formatCurrency(income.amount)}
                </div>
                <button class="btn-outline" style="margin-left: var(--space-2); font-size: 0.875rem;" 
                        onclick="app.deleteIncome(${income.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    renderIncomeAnalysis() {
        if (this.state.transactions.income.length === 0) {
            return '<div class="text-center text-muted">Tidak ada data untuk dianalisis</div>';
        }
        
        // Group by category
        const categories = {};
        this.state.transactions.income.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + item.amount;
        });
        
        let analysisHTML = '<div style="width: 100%;">';
        for (const [category, amount] of Object.entries(categories)) {
            const percentage = Math.round((amount / this.state.finances.income) * 100);
            analysisHTML += `
                <div style="margin-bottom: var(--space-3);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>${this.getCategoryName(category)}</span>
                        <span style="font-weight: 600;">${percentage}%</span>
                    </div>
                    <div style="height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: var(--success); border-radius: var(--radius-full);"></div>
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 2px;">
                        ${this.formatCurrency(amount)}
                    </div>
                </div>
            `;
        }
        analysisHTML += '</div>';
        
        return analysisHTML;
    }

    renderMonthlyIncomeStats() {
        // Group by month
        const monthlyStats = {};
        this.state.transactions.income.forEach(item => {
            const date = new Date(item.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyStats[monthYear] = (monthlyStats[monthYear] || 0) + item.amount;
        });
        
        if (Object.keys(monthlyStats).length === 0) {
            return '<div class="text-center text-muted">Tidak ada data bulanan</div>';
        }
        
        let statsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-4);">';
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        for (const [monthYear, amount] of Object.entries(monthlyStats)) {
            const [year, month] = monthYear.split('-');
            const monthName = months[parseInt(month) - 1];
            statsHTML += `
                <div style="text-align: center; padding: var(--space-3); background: var(--bg-surface); border-radius: var(--radius-lg);">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${monthName} ${year}</div>
                    <div style="font-weight: 700; color: var(--success); margin-top: 4px;">${this.formatCurrency(amount)}</div>
                </div>
            `;
        }
        
        statsHTML += '</div>';
        return statsHTML;
    }

    setupIncomeView() {
        // Add income button
        document.getElementById('addIncomeBtn')?.addEventListener('click', () => {
            this.openModal('addIncomeModal');
        });
        
        // Calculate largest source
        this.calculateLargestSource();
        
        // Setup delete handlers
        this.setupIncomeDeleteHandlers();
    }

    calculateLargestSource() {
        const sourceTotals = {};
        
        this.state.transactions.income.forEach(income => {
            sourceTotals[income.category] = (sourceTotals[income.category] || 0) + income.amount;
        });
        
        let largestSource = '-';
        let largestAmount = 0;
        
        for (const [category, amount] of Object.entries(sourceTotals)) {
            if (amount > largestAmount) {
                largestAmount = amount;
                largestSource = this.getCategoryName(category);
            }
        }
        
        const element = document.getElementById('largestSource');
        if (element) {
            element.textContent = largestSource;
        }
    }

    setupIncomeDeleteHandlers() {
        // Handlers will be attached in renderIncomeList via onclick
    }

    deleteIncome(id) {
        this.deleteTransaction('income', id);
    }
    
    // ====== CHECKLIST TAB - FULL FUNCTIONALITY ======
    showChecklist() {
        const checklistHTML = `
            <div class="section-title">✅ Checklist Keuangan</div>
            
            <div class="stats-grid" style="margin-bottom: var(--space-6);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Total Tugas</div>
                            <div class="stat-value" id="totalTasksCount">${this.state.checklist.length}</div>
                        </div>
                        <div class="stat-icon">📋</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Selesai</div>
                            <div class="stat-value" id="completedTasksCount">${this.state.checklist.filter(t => t.completed).length}</div>
                        </div>
                        <div class="stat-icon">✅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Progress</div>
                            <div class="stat-value" id="tasksProgress">${this.state.checklist.length > 0 
                                ? Math.round((this.state.checklist.filter(t => t.completed).length / this.state.checklist.length) * 100) + '%' 
                                : '0%'}</div>
                        </div>
                        <div class="stat-icon">📈</div>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions mb-6">
                <h3 class="section-title">Tambah Tugas Baru</h3>
                <div style="display: flex; gap: var(--space-4); margin-top: var(--space-4);">
                    <input type="text" id="newChecklistTask" placeholder="Masukkan tugas baru..." 
                        style="flex: 1; padding: var(--space-3) var(--space-4); border: 2px solid var(--border-color); border-radius: var(--radius-md);">
                    <button class="btn" id="addChecklistBtn">
                        <span>➕</span> Tambah
                    </button>
                </div>
            </div>
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Tugas</h3>
                    <div class="text-muted" id="remainingTasksCount">
                        ${this.state.checklist.filter(t => !t.completed).length} tugas tersisa
                    </div>
                </div>
                
                <div id="checklistItems">
                    ${this.renderChecklistItems()}
                </div>
                
                ${this.state.checklist.filter(t => t.completed).length > 0 ? `
                    <div style="margin-top: var(--space-6);">
                        <h4 style="margin-bottom: var(--space-4); color: var(--text-muted);">Tugas Selesai</h4>
                        <div id="completedChecklistItems">
                            ${this.renderCompletedChecklistItems()}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Quick Templates -->
            <div class="activity-section mt-6">
                <h3 class="section-title">Template Cepat</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Bulanan')">
                        📅 Tugas Bulanan
                    </button>
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Mingguan')">
                        📆 Tugas Mingguan
                    </button>
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Investasi')">
                        💰 Tugas Investasi
                    </button>
                    <button class="btn-outline" onclick="app.clearCompletedTasks()">
                        🗑️ Hapus Selesai
                    </button>
                </div>
            </div>
        `;
        
        this.elements.mainContent.innerHTML = checklistHTML;
        this.setupChecklistView();
    }

    renderChecklistItems() {
        const incompleteTasks = this.state.checklist.filter(task => !task.completed);
        
        if (incompleteTasks.length === 0) {
            return '<div class="text-center text-muted mt-6">Semua tugas selesai! 🎉</div>';
        }
        
        return incompleteTasks.map(task => `
            <div class="activity-item" data-task-id="${task.id}">
                <div class="activity-icon" style="cursor: pointer;" onclick="app.toggleTask(${task.id})">
                    ${task.completed ? '✅' : '⭕'}
                </div>
                <div class="activity-details">
                    <div class="activity-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        ${task.task}
                    </div>
                    <div class="activity-meta">
                        <span>Created: ${this.formatDate(task.created || new Date().toISOString())}</span>
                    </div>
                </div>
                <button class="btn-outline" style="margin-left: auto; font-size: 0.875rem;" 
                        onclick="app.deleteTask(${task.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    renderCompletedChecklistItems() {
        const completedTasks = this.state.checklist.filter(task => task.completed);
        
        return completedTasks.map(task => `
            <div class="activity-item" style="opacity: 0.7;" data-task-id="${task.id}">
                <div class="activity-icon" style="cursor: pointer; background: var(--success);" onclick="app.toggleTask(${task.id})">
                    ✅
                </div>
                <div class="activity-details">
                    <div class="activity-title" style="text-decoration: line-through;">
                        ${task.task}
                    </div>
                    <div class="activity-meta">
                        <span>Selesai: ${this.formatDate(task.completedAt || new Date().toISOString())}</span>
                    </div>
                </div>
                <button class="btn-outline" style="margin-left: auto; font-size: 0.875rem;" 
                        onclick="app.deleteTask(${task.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    setupChecklistView() {
        // Add task button
        document.getElementById('addChecklistBtn')?.addEventListener('click', () => {
            this.addChecklistTask();
        });
        
        // Enter key support
        document.getElementById('newChecklistTask')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addChecklistTask();
            }
        });
    }

    addChecklistTask() {
        const input = document.getElementById('newChecklistTask');
        const task = input?.value.trim();
        
        if (!task) {
            this.showNotification('Masukkan tugas terlebih dahulu', 'error');
            return;
        }
        
        const id = Date.now();
        const newTask = {
            id,
            task,
            completed: false,
            created: new Date().toISOString()
        };
        
        this.state.checklist.unshift(newTask);
        
        // Update UI immediately
        this.updateChecklist();
        this.saveData();
        
        input.value = '';
        this.showNotification('Tugas berhasil ditambahkan!', 'success');
    }

    // Method untuk update UI checklist
    updateChecklist() {
        const checklistItems = document.getElementById('checklistItems');
        const completedItems = document.getElementById('completedChecklistItems');
        
        if (checklistItems) {
            checklistItems.innerHTML = this.renderChecklistItems();
        }
        
        if (completedItems) {
            // Show/hide completed section
            const completedTasks = this.state.checklist.filter(t => t.completed);
            if (completedTasks.length > 0) {
                if (!document.getElementById('completedChecklistItems')) {
                    // Add completed section if not exists
                    const completedSection = `
                        <div style="margin-top: var(--space-6);">
                            <h4 style="margin-bottom: var(--space-4); color: var(--text-muted);">Tugas Selesai</h4>
                            <div id="completedChecklistItems">
                                ${this.renderCompletedChecklistItems()}
                            </div>
                        </div>
                    `;
                    checklistItems.insertAdjacentHTML('afterend', completedSection);
                } else {
                    completedItems.innerHTML = this.renderCompletedChecklistItems();
                }
            } else {
                // Remove completed section if no completed tasks
                const completedSection = document.getElementById('completedChecklistItems')?.parentElement;
                if (completedSection) {
                    completedSection.remove();
                }
            }
        }
        
        // Update stats in checklist tab
        this.updateChecklistStats();
        
        // Update badge
        this.updateBadges();
    }

    // Method untuk update stats di checklist tab
    updateChecklistStats() {
        // Update dengan ID yang spesifik
        const totalTasksEl = document.getElementById('totalTasksCount');
        const completedTasksEl = document.getElementById('completedTasksCount');
        const progressEl = document.getElementById('tasksProgress');
        const remainingTasksEl = document.getElementById('remainingTasksCount');
        
        const total = this.state.checklist.length;
        const completed = this.state.checklist.filter(t => t.completed).length;
        const remaining = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        if (totalTasksEl) {
            totalTasksEl.textContent = total;
        }
        
        if (completedTasksEl) {
            completedTasksEl.textContent = completed;
        }
        
        if (progressEl) {
            progressEl.textContent = `${percentage}%`;
        }
        
        if (remainingTasksEl) {
            remainingTasksEl.textContent = `${remaining} tugas tersisa`;
        }
    }

    // Update deleteTask() juga
    deleteTask(id) {
        this.state.checklist = this.state.checklist.filter(t => t.id !== id);
        
        // Update UI immediately
        this.updateChecklist();
        this.saveData();
        
        this.showNotification('Tugas dihapus!', 'info');
    }

    // Update toggleTask() juga
    toggleTask(id) {
        const taskIndex = this.state.checklist.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            this.state.checklist[taskIndex].completed = !this.state.checklist[taskIndex].completed;
            
            if (this.state.checklist[taskIndex].completed) {
                this.state.checklist[taskIndex].completedAt = new Date().toISOString();
            }
            
            // Update UI immediately
            this.updateChecklist();
            this.saveData();
            
            this.showNotification('Status tugas diperbarui!', 'success');
        }
    }

    addTemplateChecklist(type) {
        const templates = {
            'Bulanan': [
                'Bayar tagihan listrik',
                'Bayar tagihan air',
                'Bayar internet/streaming',
                'Transfer tabungan bulanan',
                'Review budget bulan lalu'
            ],
            'Mingguan': [
                'Catat pengeluaran mingguan',
                'Transfer dana darurat',
                'Cek portofolio investasi',
                'Plan meal prep untuk hemat'
            ],
            'Investasi': [
                'Research saham baru',
                'Review reksadana',
                'Analisis return investasi',
                'Diversifikasi portofolio'
            ]
        };
        
        const tasks = templates[type] || [];
        let addedCount = 0;
        
        tasks.forEach(taskText => {
            // Check if task already exists
            if (!this.state.checklist.some(t => t.task === taskText)) {
                const id = Date.now() + Math.random();
                this.state.checklist.push({
                    id,
                    task: taskText,
                    completed: false,
                    created: new Date().toISOString()
                });
                addedCount++;
            }
        });
        
        // Update UI immediately
        this.updateChecklist();
        this.saveData();
        
        this.showNotification(`✅ ${addedCount} tugas ${type} ditambahkan!`, 'success');
    }

    clearCompletedTasks() {
        const completedCount = this.state.checklist.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('Tidak ada tugas selesai', 'info');
            return;
        }
        
        if (confirm(`Hapus ${completedCount} tugas yang sudah selesai?`)) {
            this.state.checklist = this.state.checklist.filter(t => !t.completed);
            
            // Update UI immediately
            this.updateChecklist();
            this.saveData();
            
            this.showNotification(`${completedCount} tugas dihapus!`, 'success');
        }
    }
    
    // ====== SIMULATION TAB - INVESTMENT CALCULATOR ======
    showSimulation() {
        const simulationHTML = `
            <div class="section-title">📈 Simulasi Keuangan</div>
            
            <div class="dashboard-grid">
                <!-- Investment Calculator -->
                <div class="activity-section">
                    <h3 class="section-title">Kalkulator Investasi</h3>
                    <div style="padding: var(--space-4);">
                        <div class="form-group">
                            <label for="initialInvestment">Investasi Awal (Rp)</label>
                            <input type="number" id="initialInvestment" value="10000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="monthlyContribution">Kontribusi Bulanan (Rp)</label>
                            <input type="number" id="monthlyContribution" value="1000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="investmentPeriod">Jangka Waktu (tahun)</label>
                            <input type="number" id="investmentPeriod" value="10" min="1" max="50">
                        </div>
                        
                        <div class="form-group">
                            <label for="expectedReturn">Return Tahunan (%)</label>
                            <input type="number" id="expectedReturn" value="12" min="0" max="50" step="0.1">
                        </div>
                        
                        <button class="btn w-full" id="calculateInvestment">
                            🧮 Hitung Investasi
                        </button>
                        
                        <div id="investmentResult" style="margin-top: var(--space-6); display: none;">
                            <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                                <h4 style="margin-bottom: var(--space-4);">Hasil Simulasi</h4>
                                <div id="resultDetails"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Loan Calculator -->
                <div class="activity-section">
                    <h3 class="section-title">Kalkulator Pinjaman</h3>
                    <div style="padding: var(--space-4);">
                        <div class="form-group">
                            <label for="loanAmount">Jumlah Pinjaman (Rp)</label>
                            <input type="number" id="loanAmount" value="50000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="loanTerm">Jangka Waktu (tahun)</label>
                            <input type="number" id="loanTerm" value="5" min="1" max="30">
                        </div>
                        
                        <div class="form-group">
                            <label for="interestRate">Bunga Tahunan (%)</label>
                            <input type="number" id="interestRate" value="8" min="0" max="30" step="0.1">
                        </div>
                        
                        <div class="form-group">
                            <label for="loanType">Jenis Pinjaman</label>
                            <select id="loanType">
                                <option value="flat">Flat Rate</option>
                                <option value="annuity">Anuitas</option>
                            </select>
                        </div>
                        
                        <button class="btn w-full" id="calculateLoan">
                            🧮 Hitung Pinjaman
                        </button>
                        
                        <div id="loanResult" style="margin-top: var(--space-6); display: none;">
                            <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                                <h4 style="margin-bottom: var(--space-4);">Detail Pinjaman</h4>
                                <div id="loanDetails"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Investment Scenarios -->
            <div class="activity-section mt-6">
                <h3 class="section-title">Skenario Investasi Populer</h3>
                <div class="actions-grid" style="margin-top: var(--space-4);">
                    <button class="action-btn" onclick="app.loadInvestmentScenario('saving')">
                        <div class="action-icon">🏦</div>
                        <div style="font-weight: 600;">Tabungan Dana Darurat</div>
                        <div class="text-muted" style="font-size: 0.875rem;">6x pengeluaran bulanan</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('dp_rumah')">
                        <div class="action-icon">🏠</div>
                        <div style="font-weight: 600;">DP Rumah</div>
                        <div class="text-muted" style="font-size: 0.875rem;">20% dari harga rumah</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('pensiun')">
                        <div class="action-icon">👴</div>
                        <div style="font-weight: 600;">Dana Pensiun</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Persiapan masa tua</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('pendidikan')">
                        <div class="action-icon">🎓</div>
                        <div style="font-weight: 600;">Dana Pendidikan</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Biaya kuliah anak</div>
                    </button>
                </div>
            </div>
            
            <!-- Investment Tips -->
            <div class="activity-section mt-6">
                <h3 class="section-title">💡 Tips Investasi</h3>
                <div style="margin-top: var(--space-4);">
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Mulai Sedini Mungkin</div>
                        <div style="color: var(--text-muted);">Compound interest bekerja paling baik dalam jangka panjang.</div>
                    </div>
                    
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Diversifikasi</div>
                        <div style="color: var(--text-muted);">Jangan taruh semua telur dalam satu keranjang.</div>
                    </div>
                    
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Risk Management</div>
                        <div style="color: var(--text-muted);">Sesuaikan risiko dengan usia dan tujuan finansial.</div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.mainContent.innerHTML = simulationHTML;
        this.setupSimulationView();
    }

    setupSimulationView() {
        // Investment calculator
        document.getElementById('calculateInvestment')?.addEventListener('click', () => {
            this.calculateInvestment();
        });
        
        // Loan calculator
        document.getElementById('calculateLoan')?.addEventListener('click', () => {
            this.calculateLoan();
        });
    }

    calculateInvestment() {
        const initial = parseInt(document.getElementById('initialInvestment').value) || 0;
        const monthly = parseInt(document.getElementById('monthlyContribution').value) || 0;
        const years = parseInt(document.getElementById('investmentPeriod').value) || 1;
        const annualReturn = parseFloat(document.getElementById('expectedReturn').value) || 0;
        
        const monthlyReturn = annualReturn / 12 / 100;
        const months = years * 12;
        
        // Future value calculation
        let futureValue = initial * Math.pow(1 + monthlyReturn, months);
        
        // Add monthly contributions
        for (let i = 0; i < months; i++) {
            futureValue += monthly * Math.pow(1 + monthlyReturn, months - i - 1);
        }
        
        const totalContributions = initial + (monthly * months);
        const totalEarnings = futureValue - totalContributions;
        
        const resultHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Nilai Masa Depan</div>
                    <div style="font-weight: 700; font-size: 1.5rem; color: var(--success);">
                        ${this.formatCurrency(Math.round(futureValue))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Investasi</div>
                    <div style="font-weight: 700; font-size: 1.25rem;">
                        ${this.formatCurrency(totalContributions)}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Keuntungan</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">
                        ${this.formatCurrency(Math.round(totalEarnings))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">ROI</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--warning);">
                        ${Math.round((totalEarnings / totalContributions) * 100)}%
                    </div>
                </div>
            </div>
            
            <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-color);">
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    <strong>Catatan:</strong> Perhitungan menggunakan asumsi return konsisten ${annualReturn}% per tahun. 
                    Hasil aktual mungkin berbeda tergantung kondisi pasar.
                </div>
            </div>
        `;
        
        document.getElementById('resultDetails').innerHTML = resultHTML;
        document.getElementById('investmentResult').style.display = 'block';
        
        this.showNotification('Simulasi investasi selesai!', 'success');
    }

    calculateLoan() {
        const amount = parseInt(document.getElementById('loanAmount').value) || 0;
        const years = parseInt(document.getElementById('loanTerm').value) || 1;
        const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const type = document.getElementById('loanType').value;
        
        const months = years * 12;
        const monthlyRate = annualRate / 12 / 100;
        
        let monthlyPayment = 0;
        let totalPayment = 0;
        let totalInterest = 0;
        
        if (type === 'flat') {
            // Flat rate calculation
            totalInterest = amount * annualRate / 100 * years;
            totalPayment = amount + totalInterest;
            monthlyPayment = totalPayment / months;
        } else {
            // Annuity calculation
            monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                            (Math.pow(1 + monthlyRate, months) - 1);
            totalPayment = monthlyPayment * months;
            totalInterest = totalPayment - amount;
        }
        
        const resultHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Cicilan Bulanan</div>
                    <div style="font-weight: 700; font-size: 1.5rem; color: var(--danger);">
                        ${this.formatCurrency(Math.round(monthlyPayment))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Bayar</div>
                    <div style="font-weight: 700; font-size: 1.25rem;">
                        ${this.formatCurrency(Math.round(totalPayment))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Bunga</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--warning);">
                        ${this.formatCurrency(Math.round(totalInterest))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Efektif Bunga</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">
                        ${(totalInterest / amount * 100 / years).toFixed(1)}%
                    </div>
                </div>
            </div>
            
            <div style="margin-top: var(--space-4);">
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    <strong>Perbandingan:</strong> Dengan bunga flat ${annualRate}%, total bunga yang dibayar adalah 
                    ${Math.round(totalInterest / amount * 100)}% dari pokok pinjaman.
                </div>
            </div>
        `;
        
        document.getElementById('loanDetails').innerHTML = resultHTML;
        document.getElementById('loanResult').style.display = 'block';
        
        this.showNotification('Simulasi pinjaman selesai!', 'success');
    }

    loadInvestmentScenario(type) {
        const scenarios = {
            'saving': {
                initial: 0,
                monthly: Math.round(this.state.finances.expenses * 6 / 12), // 6 months expenses spread over 1 year
                years: 1,
                return: 5
            },
            'dp_rumah': {
                initial: 0,
                monthly: 3000000,
                years: 3,
                return: 8
            },
            'pensiun': {
                initial: 10000000,
                monthly: 2000000,
                years: 20,
                return: 10
            },
            'pendidikan': {
                initial: 5000000,
                monthly: 1500000,
                years: 10,
                return: 9
            }
        };
        
        const scenario = scenarios[type];
        if (!scenario) return;
        
        document.getElementById('initialInvestment').value = scenario.initial;
        document.getElementById('monthlyContribution').value = scenario.monthly;
        document.getElementById('investmentPeriod').value = scenario.years;
        document.getElementById('expectedReturn').value = scenario.return;
        
        this.showNotification(`Skenario ${type} dimuat!`, 'success');
        
        // Auto calculate
        setTimeout(() => {
            this.calculateInvestment();
        }, 300);
    }
    
    showSettings() {
        console.log('⚙️ Rendering settings page...');
        
        const settingsHTML = `
            <!-- SETTINGS HEADER -->
            <div class="settings-header">
                <div class="section-title">⚙️ Pengaturan Aplikasi</div>
                <div class="text-muted" style="margin-top: var(--space-2);">
                    Kelola pengaturan akun, aplikasi, dan data keuangan Anda
                </div>
            </div>
            
            <!-- SETTINGS GRID -->
            <div class="settings-grid">
                
                <!-- PROFILE SETTINGS -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <div class="settings-section-title">
                            <div class="settings-icon">👤</div>
                            <div>
                                <div style="font-weight: 600;">Profil Pengguna</div>
                                <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                    Kelola informasi akun Anda
                                </div>
                            </div>
                        </div>
                        <button class="btn-outline" onclick="app.editProfile()" id="editProfileBtn">
                            ✏️ Edit
                        </button>
                    </div>
                    
                    <div class="settings-content">
                        <div class="profile-display">
                            <div class="avatar-large" id="profileAvatar">${this.state.user.avatar}</div>
                            <div class="profile-info">
                                <div style="font-weight: 700; font-size: 1.25rem;" id="profileName">${this.state.user.name}</div>
                                <div class="profile-badge ${this.state.user.isPremium ? 'premium' : 'free'}">
                                    ${this.state.user.isPremium ? '⭐ PREMIUM USER' : '🆓 FREE USER'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-stats">
                            <div class="profile-stat">
                                <div class="stat-label">Bergabung</div>
                                <div class="stat-value">${this.formatDate(new Date().toISOString())}</div>
                            </div>
                            <div class="profile-stat">
                                <div class="stat-label">Total Transaksi</div>
                                <div class="stat-value">${this.state.transactions.income.length + this.state.transactions.expenses.length}</div>
                            </div>
                            <div class="profile-stat">
                                <div class="stat-label">Goals Aktif</div>
                                <div class="stat-value">${this.state.goals.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- APP SETTINGS -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <div class="settings-section-title">
                            <div class="settings-icon">⚙️</div>
                            <div>
                                <div style="font-weight: 600;">Pengaturan Aplikasi</div>
                                <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                    Kustomisasi pengalaman penggunaan
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <!-- Theme Setting -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Tema</div>
                                <div class="setting-description">Pilih tampilan light atau dark mode</div>
                            </div>
                            <div class="setting-control">
                                <select id="themeSelect" class="setting-select" onchange="app.changeTheme(this.value)">
                                    <option value="auto" ${this.state.settings.theme === 'auto' ? 'selected' : ''}>Sesuai Sistem</option>
                                    <option value="light" ${this.state.settings.theme === 'light' ? 'selected' : ''}>Light Mode</option>
                                    <option value="dark" ${this.state.settings.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Currency Setting -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Mata Uang</div>
                                <div class="setting-description">Format mata uang untuk semua transaksi</div>
                            </div>
                            <div class="setting-control">
                                <select id="currencySelect" class="setting-select" onchange="app.changeCurrency(this.value)">
                                    <option value="IDR" ${this.state.settings.currency === 'IDR' ? 'selected' : ''}>IDR (Rp)</option>
                                    <option value="USD" ${this.state.settings.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="EUR" ${this.state.settings.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                    <option value="SGD" ${this.state.settings.currency === 'SGD' ? 'selected' : ''}>SGD (S$)</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Auto-save Setting -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Auto-save</div>
                                <div class="setting-description">Simpan data otomatis saat ada perubahan</div>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="autoSaveToggle" ${this.state.settings.autoSave ? 'checked' : ''} 
                                           onchange="app.toggleSetting('autoSave', this.checked)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Notifications Setting -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Notifikasi</div>
                                <div class="setting-description">Aktifkan notifikasi pengingat</div>
                            </div>
                            <div class="setting-control">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="notificationsToggle" ${this.state.settings.notifications ? 'checked' : ''}
                                           onchange="app.toggleSetting('notifications', this.checked)">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- DATA MANAGEMENT -->
                <div class="settings-section">
                    <div class="settings-section-header">
                        <div class="settings-section-title">
                            <div class="settings-icon">💾</div>
                            <div>
                                <div style="font-weight: 600;">Manajemen Data</div>
                                <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                    Backup, restore, dan kelola data Anda
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <!-- Export Options -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Export Data</div>
                                <div class="setting-description">Ekspor data ke berbagai format</div>
                            </div>
                            <div class="setting-control">
                                <div class="button-group">
                                    <button class="btn-outline" onclick="app.exportData('json')" style="font-size: 0.875rem;">
                                        JSON
                                    </button>
                                    <button class="btn-outline" onclick="app.exportData('csv')" style="font-size: 0.875rem;">
                                        CSV
                                    </button>
                                    <button class="btn-outline" onclick="app.generateProfessionalPDF()" style="font-size: 0.875rem;">
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Import Data -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-title">Import Data</div>
                                <div class="setting-description">Impor data dari file backup</div>
                            </div>
                            <div class="setting-control">
                                <button class="btn-outline" onclick="app.importData()" style="font-size: 0.875rem;">
                                    📥 Pilih File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- DANGER ZONE -->
                <div class="settings-section danger-zone">
                    <div class="settings-section-header">
                        <div class="settings-section-title">
                            <div class="settings-icon">⚠️</div>
                            <div>
                                <div style="font-weight: 600; color: var(--danger);">Zona Berbahaya</div>
                                <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                    Aksi ini tidak dapat dibatalkan
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="danger-actions">
                            <button class="btn-outline danger" onclick="app.resetSettingsToDefault()">
                                <span>🔄</span> Reset Pengaturan
                            </button>
                            <button class="btn danger" onclick="app.clearData()">
                                <span>💥</span> Hapus Semua Data
                            </button>
                        </div>
                        <div class="danger-warning">
                            <span style="color: var(--danger);">⚠️ PERINGATAN:</span> 
                            Data yang dihapus tidak dapat dikembalikan. Pastikan Anda sudah backup data penting.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.mainContent.innerHTML = settingsHTML;
        
        // Setup settings page
        this.setupSettingsPage();
    }
    
    setupSettingsPage() {
        console.log('⚙️ Setting up settings page...');
        
        // Update real-time status
        this.updateAppStatus();
    }
    
    updateAppStatus() {
        // Update online/offline status
        const appStatus = document.getElementById('appStatus');
        if (appStatus) {
            appStatus.textContent = navigator.onLine ? '🟢 Online' : '🔴 Offline';
            appStatus.className = `app-info-value status-${navigator.onLine ? 'online' : 'offline'}`;
        }
    }
    
    // ====== SETTINGS ACTION FUNCTIONS ======
    editProfile() {
        const newName = prompt('Masukkan nama baru:', this.state.user.name);
        if (newName && newName.trim() !== '') {
            this.state.user.name = newName.trim();
            this.state.user.avatar = newName.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            this.updateUI();
            this.saveData();
            this.showNotification('Profil berhasil diperbarui!', 'success');
        }
    }
    
    changeTheme(theme) {
        this.state.settings.theme = theme;
        
        // Apply theme immediately
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').innerHTML = '☀️ Light Mode';
        } else if (theme === 'light') {
            document.body.classList.remove('dark-mode');
            document.getElementById('darkModeToggle').innerHTML = '🌙 Dark Mode';
        } else {
            // Auto - follow system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode');
                document.getElementById('darkModeToggle').innerHTML = '☀️ Light Mode';
            } else {
                document.body.classList.remove('dark-mode');
                document.getElementById('darkModeToggle').innerHTML = '🌙 Dark Mode';
            }
        }
        
        this.saveData();
        this.showNotification(`Tema diubah ke: ${theme}`, 'success');
    }
    
    changeCurrency(currency) {
        if (confirm(`Ubah mata uang ke ${currency}? Semua nilai akan dikonversi secara visual.`)) {
            this.state.settings.currency = currency;
            this.saveData();
            this.updateUI();
            this.showNotification(`Mata uang diubah ke: ${currency}`, 'success');
        } else {
            // Reset select to previous value
            const select = document.getElementById('currencySelect');
            if (select) {
                select.value = this.state.settings.currency;
            }
        }
    }
    
    exportData(format = 'json') {
        if (format === 'json') {
            // Original JSON export
            const dataStr = JSON.stringify(this.state, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } else if (format === 'csv') {
            // CSV export
            this.exportToCSV();
        }
        
        this.showNotification(`Data berhasil diexport dalam format ${format.toUpperCase()}!`, 'success');
    }
    
    exportToCSV() {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Header
            csvContent += "Tipe,Nama,Jumlah,Kategori,Tanggal,ID\n";
            
            // Income transactions
            this.state.transactions.income.forEach(transaction => {
                const row = [
                    'Income',
                    `"${transaction.name}"`,
                    transaction.amount,
                    transaction.category,
                    transaction.date,
                    transaction.id
                ].join(',');
                csvContent += row + "\n";
            });
            
            // Expense transactions
            this.state.transactions.expenses.forEach(transaction => {
                const row = [
                    'Expense',
                    `"${transaction.name}"`,
                    transaction.amount,
                    transaction.category,
                    transaction.date,
                    transaction.id
                ].join(',');
                csvContent += row + "\n";
            });
            
            // Goals
            csvContent += "\n\nGOALS\n";
            csvContent += "Nama,Target,Terkumpul,Progress,Deadline,ID\n";
            this.state.goals.forEach(goal => {
                const row = [
                    `"${goal.name}"`,
                    goal.target,
                    goal.current,
                    `${goal.progress}%`,
                    goal.deadline,
                    goal.id
                ].join(',');
                csvContent += row + "\n";
            });
            
            // Checklist
            csvContent += "\n\nCHECKLIST\n";
            csvContent += "Task,Completed,CreatedAt,ID\n";
            this.state.checklist.forEach(task => {
                const row = [
                    `"${task.task}"`,
                    task.completed ? 'Yes' : 'No',
                    task.created || '',
                    task.id
                ].join(',');
                csvContent += row + "\n";
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `financial-data-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('✅ Data berhasil diexport ke CSV!', 'success');
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.showNotification('Gagal export ke CSV', 'error');
        }
    }
    
    resetSettingsToDefault() {
        if (confirm('Reset semua pengaturan ke default? Data transaksi tidak akan terpengaruh.')) {
            this.state.settings = {
                currency: 'IDR',
                theme: 'auto',
                notifications: true,
                autoSave: true,
                dataRetention: 90
            };
            this.saveData();
            this.showSettings(); // Refresh settings page
            this.showNotification('✅ Pengaturan direset ke default', 'success');
        }
    }
    
    // ====== EVENT HANDLERS ======
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // ====== NAVIGATION ======
        this.elements.navTabs.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.nav-tab');
            if (!tabButton) return;
            
            const tab = tabButton.dataset.tab;
            if (tab) {
                this.switchTab(tab);
            }
        });
        
        // ====== HEADER SCROLL EFFECT ======
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // ====== FOOTER LINKS ======
        document.querySelectorAll('.footer-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.dataset.action;
                const tab = link.dataset.tab;
                
                if (action) {
                    switch(action) {
                        case 'exportReport':
                            this.generatePrintableReport();
                            break;
                        case 'help':
                            this.showHelp();
                            break;
                        case 'tips':
                            this.showTips();
                            break;
                        case 'clearData':
                            this.clearData();
                            break;
                    }
                } else if (tab) {
                    this.switchTab(tab);
                }
            });
        });
        
        // ====== HEADER BUTTONS ======
        
        // Export Data button (Header) - Export JSON
        this.elements.exportBtn.addEventListener('click', () => {
            console.log('📤 Exporting all data as JSON...');
            this.exportData('json');
        });
        
        // Install PWA button
        this.elements.installBtn.addEventListener('click', () => {
            this.handlePWAInstall();
        });
        
        // ====== MODAL HANDLERS ======
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        // Modal overlay
        this.elements.modalOverlay.addEventListener('click', () => this.closeModal());
        
        // ====== FORM SUBMISSIONS ======
        
        // Expense form
        if (this.elements.expenseForm) {
            this.elements.expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddExpense();
            });
        }
        
        // Income form
        if (this.elements.incomeForm) {
            this.elements.incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddIncome();
            });
        }
        
        // Goal form
        if (this.elements.goalForm) {
            this.elements.goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddGoal();
            });
        }
        
        // ====== FOOTER BUTTONS ======
        
        // Export Report button (Footer) - Printable Report
        this.elements.exportReport.addEventListener('click', () => {
            console.log('📊 Generating printable report...');
            this.generatePrintableReport();
        });
        
        // Clear Data button
        this.elements.clearDataBtn.addEventListener('click', () => this.clearData());
        
        // Help button
        this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        
        // Tips button
        this.elements.tipsBtn.addEventListener('click', () => this.showTips());
        
        // ====== SYSTEM EVENTS ======
        
        // Online/offline detection
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            this.handleBeforeInstallPrompt(e);
        });
        
        // PWA installed
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.showNotification('Aplikasi berhasil diinstal! 🎉', 'success');
            if (this.elements.installBtn) {
                this.elements.installBtn.style.display = 'none';
            }
        });
        
        // ====== DARK MODE TOGGLE ======
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
        
        // ====== FORM INPUT VALIDATION ======
        this.setupFormValidation();
        
        // ====== WINDOW RESIZE ======
        this.resizeTimeout = null;
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // ====== ORIENTATION CHANGE (MOBILE) ======
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.performResizeActions();
            }, 300);
        });
        
        // ====== PAGE VISIBILITY ======
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, refresh data
                setTimeout(() => {
                    this.calculateFinances();
                    this.updateBadges();
                }, 100);
            }
        });
        
        // ====== BEFORE UNLOAD (SAVE DATA) ======
        window.addEventListener('beforeunload', () => {
            if (this.state.settings.autoSave) {
                this.saveData(true); // Silent save
            }
        });
        
        // ====== KEYBOARD SHORTCUTS ======
        document.addEventListener('keydown', (e) => {
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showNotification('Data disimpan!', 'success');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCustomModal();
            }
            
            // Ctrl+E to export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData('json');
            }
            
            // Number keys for quick navigation (1-6)
            if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
                const tabIndex = parseInt(e.key) - 1;
                const tabs = ['dashboard', 'expenses', 'income', 'checklist', 'simulation', 'settings'];
                if (tabs[tabIndex]) {
                    e.preventDefault();
                    this.switchTab(tabs[tabIndex]);
                }
            }
        });
        
        // ====== INITIAL RESIZE CALL ======
        setTimeout(() => {
            this.performResizeActions();
        }, 500);
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            setTimeout(() => {
                this.handleChartResize();
            }, 200);
        });
        
        // ====== TOUCH EVENTS FOR MOBILE ======
        if ('ontouchstart' in window) {
            // Add touch feedback
            document.querySelectorAll('button, .btn, .nav-tab').forEach(btn => {
                btn.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                });
                
                btn.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                });
            });
        }
        
        // ====== DRAG AND DROP (FUTURE FEATURE) ======
        this.setupDragAndDrop();
        
        console.log('✅ Event listeners setup complete');
    }

    // ====== METHOD handleResize() ======
    handleResize() {
        console.log('🔄 Handling window resize...');
        
        // Debounce resize untuk performance
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.performResizeActions();
        }, 250);
    }

    // ====== METHOD performResizeActions() ======
    performResizeActions() {
        const windowWidth = window.innerWidth;
        const isMobile = windowWidth < 768;
        const isTablet = windowWidth >= 768 && windowWidth < 1024;
        const isDesktop = windowWidth >= 1024;
        
        console.log(`📱 Window: ${windowWidth}px (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`);
        
        // 1. Update chart jika ada
        this.handleChartResize();
        
        // 2. Update UI layout berdasarkan screen size
        this.updateLayoutForScreenSize(isMobile, isTablet, isDesktop);
        
        // 3. Update responsive classes
        this.updateResponsiveClasses(isMobile);
        
        // 4. Adjust modal positions jika terbuka
        this.adjustModalPositions();
        
        // 5. Update dashboard grid jika perlu
        this.updateDashboardGrid();
        
        // 6. Check dan update PWA install button visibility
        this.updatePWAButtonVisibility();
    }

    // ====== METHOD handleChartResize() ======
    handleChartResize() {
        if (this.chartInstance && this.state.activeTab === 'dashboard') {
            try {
                // Check jika chart container masih ada
                const chartContainer = document.getElementById('chartContainer');
                if (!chartContainer) {
                    console.warn('Chart container not found during resize');
                    return;
                }
                
                // Get current dimensions
                const containerWidth = chartContainer.clientWidth;
                const containerHeight = chartContainer.clientHeight;
                
                console.log(`📊 Chart container: ${containerWidth}x${containerHeight}`);
                
                // Only resize if dimensions are valid
                if (containerWidth > 50 && containerHeight > 50) {
                    // Update chart options for mobile
                    const isMobile = window.innerWidth < 768;
                    
                    if (isMobile) {
                        // Adjust for mobile
                        this.chartInstance.options.plugins.legend.position = 'top';
                        this.chartInstance.options.plugins.legend.labels.boxWidth = 12;
                        this.chartInstance.options.plugins.legend.labels.font.size = 10;
                        
                        this.chartInstance.options.scales.x.ticks.maxRotation = 45;
                        this.chartInstance.options.scales.y.ticks.callback = (value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                            return value;
                        };
                    } else {
                        // Desktop settings
                        this.chartInstance.options.plugins.legend.position = 'top';
                        this.chartInstance.options.plugins.legend.labels.boxWidth = 16;
                        this.chartInstance.options.plugins.legend.labels.font.size = 12;
                        
                        this.chartInstance.options.scales.x.ticks.maxRotation = 0;
                    }
                    
                    // Resize chart
                    this.chartInstance.resize();
                    this.chartInstance.update('none');
                    
                    console.log('✅ Chart resized successfully');
                }
            } catch (error) {
                console.error('❌ Error resizing chart:', error);
            }
        }
    }

    // ====== METHOD updateLayoutForScreenSize() ======
    updateLayoutForScreenSize(isMobile, isTablet, isDesktop) {
        // Update stats grid layout
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            if (isMobile) {
                statsGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
                statsGrid.style.gap = 'var(--space-3)';
            } else if (isTablet) {
                statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                statsGrid.style.gap = 'var(--space-4)';
            } else {
                statsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                statsGrid.style.gap = 'var(--space-4)';
            }
        }
        
        // Update quick actions grid
        const actionsGrid = document.querySelector('.actions-grid');
        if (actionsGrid) {
            if (isMobile) {
                actionsGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
            } else if (isTablet) {
                actionsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                actionsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }
        }
        
        // Update dashboard grid
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (dashboardGrid) {
            if (isMobile) {
                dashboardGrid.style.gridTemplateColumns = '1fr';
                dashboardGrid.style.gap = 'var(--space-4)';
            } else {
                dashboardGrid.style.gridTemplateColumns = '2fr 1fr';
                dashboardGrid.style.gap = 'var(--space-6)';
            }
        }
        
        // Update goals grid
        const goalsGrid = document.getElementById('goalsGrid');
        if (goalsGrid) {
            if (isMobile) {
                goalsGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
            } else if (isTablet) {
                goalsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                goalsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            }
        }
        
        // Update font sizes for mobile
        if (isMobile) {
            this.adjustFontSizesForMobile();
        }
    }

    // ====== METHOD adjustFontSizesForMobile() ======
    adjustFontSizesForMobile() {
        // Adjust section titles
        document.querySelectorAll('.section-title').forEach(title => {
            title.style.fontSize = '1.1rem';
        });
        
        // Adjust stat values
        document.querySelectorAll('.stat-value').forEach(stat => {
            if (window.innerWidth < 400) {
                stat.style.fontSize = '1.25rem';
            }
        });
        
        // Adjust activity items
        document.querySelectorAll('.activity-item').forEach(item => {
            item.style.padding = 'var(--space-2) var(--space-3)';
        });
    }

    // ====== METHOD updateResponsiveClasses() ======
    updateResponsiveClasses(isMobile) {
        const body = document.body;
        const appContainer = document.getElementById('app');
        
        if (isMobile) {
            body.classList.add('mobile-view');
            body.classList.remove('desktop-view');
            if (appContainer) {
                appContainer.classList.add('mobile');
                appContainer.classList.remove('desktop');
            }
        } else {
            body.classList.add('desktop-view');
            body.classList.remove('mobile-view');
            if (appContainer) {
                appContainer.classList.add('desktop');
                appContainer.classList.remove('mobile');
            }
        }
        
        // Update header untuk mobile
        const header = document.querySelector('.header');
        if (header) {
            if (isMobile) {
                header.style.padding = 'var(--space-3) var(--space-4)';
            } else {
                header.style.padding = 'var(--space-4) var(--space-6)';
            }
        }
    }

    // ====== METHOD adjustModalPositions() ======
    adjustModalPositions() {
        const modals = document.querySelectorAll('.modal.active');
        
        modals.forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                if (window.innerWidth < 768) {
                    // Mobile modal styling
                    modalContent.style.maxWidth = '90%';
                    modalContent.style.maxHeight = '80vh';
                    modalContent.style.margin = '20px auto';
                    modalContent.style.borderRadius = '12px';
                } else {
                    // Desktop modal styling
                    modalContent.style.maxWidth = '500px';
                    modalContent.style.maxHeight = '90vh';
                    modalContent.style.margin = '0';
                }
            }
        });
    }

    // ====== METHOD updateDashboardGrid() ======
    updateDashboardGrid() {
        // Update chart controls untuk mobile
        const chartControls = document.querySelector('.chart-actions');
        if (chartControls) {
            if (window.innerWidth < 768) {
                chartControls.style.flexDirection = 'column';
                chartControls.style.gap = 'var(--space-2)';
                
                document.querySelectorAll('.chart-btn').forEach(btn => {
                    btn.style.padding = 'var(--space-2) var(--space-3)';
                    btn.style.fontSize = '0.875rem';
                });
            } else {
                chartControls.style.flexDirection = 'row';
                chartControls.style.gap = 'var(--space-3)';
                
                document.querySelectorAll('.chart-btn').forEach(btn => {
                    btn.style.padding = 'var(--space-2) var(--space-4)';
                    btn.style.fontSize = '0.9rem';
                });
            }
        }
    }

    // ====== METHOD updateMobileLayout() ======
    updateMobileLayout() {
        // Update stats grid untuk mobile
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
        }
        
        // Update dashboard grid untuk mobile
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (dashboardGrid) {
            dashboardGrid.style.gridTemplateColumns = '1fr';
        }
    }

    // ====== METHOD updatePWAButtonVisibility() ======
    updatePWAButtonVisibility() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            // Hide on very small screens or if already installed
            if (window.innerWidth < 350 || window.matchMedia('(display-mode: standalone)').matches) {
                installBtn.style.display = 'none';
            } else if (window.deferredPrompt && window.innerWidth >= 350) {
                installBtn.style.display = 'flex';
            }
        }
    }

    // ====== METHOD setupFormValidation() ======
    setupFormValidation() {
        // Real-time validation for amount inputs
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number' && e.target.id.includes('Amount')) {
                this.validateAmountInput(e.target);
            }
        });
        
        // Date validation
        document.addEventListener('change', (e) => {
            if (e.target.type === 'date') {
                this.validateDateInput(e.target);
            }
        });
    }

    // ====== METHOD validateAmountInput() ======
    validateAmountInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        
        if (isNaN(value) || value < min) {
            input.style.borderColor = 'var(--danger)';
            input.style.boxShadow = '0 0 0 2px rgba(239, 35, 60, 0.2)';
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    // ====== METHOD validateDateInput() ======
    validateDateInput(input) {
        const value = input.value;
        if (!value) return;
        
        const date = new Date(value);
        const today = new Date();
        
        if (date > today) {
            input.style.borderColor = 'var(--warning)';
            this.showNotification('Tanggal di masa depan mungkin tidak valid', 'warning');
        } else {
            input.style.borderColor = '';
        }
    }

    // ====== METHOD setupDragAndDrop() ======
    setupDragAndDrop() {
        // Future feature for drag and drop CSV import
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileDrop(files[0]);
                }
            });
        }
    }

    // ====== METHOD handleFileDrop() ======
    handleFileDrop(file) {
        if (file.type === 'application/json') {
            this.importDataFromFile(file);
        } else if (file.type === 'text/csv') {
            this.importCSVFromFile(file);
        } else {
            this.showNotification('Format file tidak didukung', 'error');
        }
    }

    handlePWAInstall() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ User accepted PWA install');
                    this.showNotification('Menginstal aplikasi...', 'info');
                } else {
                    console.log('❌ User dismissed PWA install');
                    this.showNotification('Instalasi dibatalkan', 'info');
                }
                
                // Reset the deferred prompt variable
                window.deferredPrompt = null;
                
                // Hide install button
                if (this.elements.installBtn) {
                    this.elements.installBtn.style.display = 'none';
                }
            });
        } else {
            // App already installed or not installable
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.showNotification('Aplikasi sudah terinstal', 'info');
            } else {
                this.showNotification('Instalasi tidak tersedia', 'warning');
            }
        }
    }

    handleBeforeInstallPrompt(e) {
        e.preventDefault();
        
        // Store the event for later use
        window.deferredPrompt = e;
        
        // Show install button if it exists
        // Show install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'flex'; // atau 'block' tergantung CSS
            installBtn.addEventListener('click', this.handlePWAInstall.bind(this));
        }
        
        console.log('📱 PWA install prompt available');
        
        // Auto-show prompt after 5 seconds on first visit
        const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
        if (!hasSeenPrompt && this.elements.installBtn) {
            setTimeout(() => {
                if (window.deferredPrompt && this.elements.installBtn.style.display === 'block') {
                    this.showNotification('Ingin instal aplikasi untuk pengalaman lebih baik?', 'info', 5000);
                }
            }, 5000);
            localStorage.setItem('hasSeenInstallPrompt', 'true');
        }
    }

    toggleDarkMode() {
        const isDark = !document.body.classList.contains('dark-mode');
        
        // Toggle class
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Update button text
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
            toggleBtn.style.color = isDark ? '#f8fafc' : '';
        }
        
        // Update settings if they exist
        if (this.state.settings) {
            this.state.settings.theme = isDark ? 'dark' : 'light';
            this.saveData();
        }
        
        // Update chart if exists
        if (this.chartInstance && typeof this.chartInstance.update === 'function') {
            setTimeout(() => {
                this.chartInstance.update('none');
            }, 100);
        }
        
        this.showNotification(
            isDark ? 'Dark mode diaktifkan' : 'Light mode diaktifkan', 
            'success'
        );
    }

    setupFormValidation() {
        // Real-time validation for amount inputs
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number' && e.target.id.includes('Amount')) {
                this.validateAmountInput(e.target);
            }
        });
    }

    validateAmountInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        
        if (isNaN(value) || value < min) {
            input.style.borderColor = 'var(--danger)';
            input.style.boxShadow = '0 0 0 2px rgba(239, 35, 60, 0.2)';
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

// ====== REPORT & PDF FUNCTIONS ======

// Method 1: generatePrintableReport() - Untuk print report HTML
generatePrintableReport() {
    console.log('📄 Generating printable report...');
    
    try {
        const reportDate = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const printWindow = window.open('', '_blank');
        
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Keuangan - ${reportDate}</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 0.5in;
                        }
                        .print-actions { display: none !important; }
                        body { 
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                    
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    
                    .no-print { display: none !important; }
                    
                    h1, h2, h3 { 
                        color: #2d3748;
                        margin-top: 30px;
                        margin-bottom: 15px;
                    }
                    
                    h1 { 
                        font-size: 28px; 
                        border-bottom: 3px solid #4361ee;
                        padding-bottom: 10px;
                    }
                    
                    h2 { 
                        font-size: 22px; 
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 8px;
                    }
                    
                    .summary-grid { 
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 25px 0;
                    }
                    
                    .summary-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 20px;
                        text-align: center;
                        background: #f8fafc;
                    }
                    
                    .summary-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 14px;
                        page-break-inside: avoid;
                    }
                    
                    th {
                        background-color: #f1f5f9 !important;
                        font-weight: 600;
                        text-align: left;
                    }
                    
                    th, td {
                        border: 1px solid #e2e8f0;
                        padding: 12px 15px;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                        text-align: center;
                        font-size: 12px;
                        color: #718096;
                    }
                    
                    @media screen and (max-width: 768px) {
                        .summary-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-actions no-print" style="margin-bottom: 30px; text-align: center;">
                    <button onclick="window.print()" style="
                        background: #4361ee;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        margin: 0 10px;
                    ">
                        🖨️ Cetak Laporan
                    </button>
                    <button onclick="window.close()" style="
                        background: #718096;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        margin: 0 10px;
                    ">
                        ✖️ Tutup
                    </button>
                </div>
                
                <div class="report-content">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1>📊 LAPORAN KEUANGAN</h1>
                        <div style="color: #718096; font-size: 16px; margin-top: 10px;">
                            <div>Tanggal: <strong>${reportDate}</strong></div>
                            <div>User: <strong>${this.state.user.name}</strong></div>
                        </div>
                    </div>
                    
                    <!-- Summary Section -->
                    <div>
                        <h2>📈 RINGKASAN FINANSIAL</h2>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <div style="font-size: 14px; color: #718096;">TOTAL PENDAPATAN</div>
                                <div class="summary-value" style="color: #06d6a0;">
                                    ${this.formatCurrency(this.state.finances.income)}
                                </div>
                                <div style="font-size: 12px; color: #06d6a0;">
                                    ${this.state.transactions.income.length} transaksi
                                </div>
                            </div>
                            
                            <div class="summary-card">
                                <div style="font-size: 14px; color: #718096;">TOTAL PENGELUARAN</div>
                                <div class="summary-value" style="color: #ef233c;">
                                    ${this.formatCurrency(this.state.finances.expenses)}
                                </div>
                                <div style="font-size: 12px; color: #ef233c;">
                                    ${this.state.transactions.expenses.length} transaksi
                                </div>
                            </div>
                            
                            <div class="summary-card">
                                <div style="font-size: 14px; color: #718096;">TOTAL TABUNGAN</div>
                                <div class="summary-value" style="color: #4361ee;">
                                    ${this.formatCurrency(this.state.finances.savings)}
                                </div>
                                <div style="font-size: 12px; color: #4361ee;">
                                    ${this.calculateSavingsRate()}% dari pendapatan
                                </div>
                            </div>
                            
                            <div class="summary-card">
                                <div style="font-size: 14px; color: #718096;">SALDO AKHIR</div>
                                <div class="summary-value" style="color: #7209b7;">
                                    ${this.formatCurrency(this.state.finances.balance)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Transactions -->
                    <div style="margin-top: 50px;">
                        <h2>💸 TRANSAKSI TERBARU</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Tipe</th>
                                    <th>Kategori</th>
                                    <th>Deskripsi</th>
                                    <th style="text-align: right;">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getRecentTransactionsForReport()}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Goals Section -->
                    ${this.state.goals.length > 0 ? `
                    <div style="margin-top: 50px;">
                        <h2>🎯 TARGET FINANSIAL</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nama Target</th>
                                    <th>Target</th>
                                    <th>Terkumpul</th>
                                    <th>Progress</th>
                                    <th>Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.state.goals.map(goal => `
                                    <tr>
                                        <td>${goal.name}</td>
                                        <td>${this.formatCurrency(goal.target)}</td>
                                        <td>${this.formatCurrency(goal.current)}</td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                    <div style="width: ${goal.progress}%; height: 100%; background: #4361ee;"></div>
                                                </div>
                                                <span>${goal.progress}%</span>
                                            </div>
                                        </td>
                                        <td>${this.formatDate(goal.deadline)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                    
                    <!-- Footer -->
                    <div class="footer">
                        <p>📄 Laporan ini dibuat otomatis oleh <strong>Financial Masterplan PRO v2.0</strong></p>
                        <p>© ${new Date().getFullYear()} • financialmasterplan.com</p>
                    </div>
                </div>
                
                <script>
                    // Auto print after load
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        this.showNotification('✅ Laporan siap dicetak!', 'success');
        
    } catch (error) {
        console.error('❌ Error generating printable report:', error);
        this.showNotification('Gagal membuat laporan printable', 'error');
    }
}

// Helper method untuk transactions table
getRecentTransactionsForReport() {
    const recentTransactions = [
        ...this.state.transactions.income.map(t => ({ ...t, type: 'Pendapatan' })),
        ...this.state.transactions.expenses.map(t => ({ ...t, type: 'Pengeluaran' }))
    ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);
    
    if (recentTransactions.length === 0) {
        return '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #718096;">Belum ada transaksi</td></tr>';
    }
    
    return recentTransactions.map(t => `
        <tr>
            <td>${this.formatDate(t.date)}</td>
            <td>${t.type}</td>
            <td>${this.getCategoryName(t.category)}</td>
            <td>${t.name}</td>
            <td style="text-align: right; color: ${t.type === 'Pendapatan' ? '#06d6a0' : '#ef233c'};">
                ${t.type === 'Pendapatan' ? '+' : '-'} ${this.formatCurrency(t.amount)}
            </td>
        </tr>
    `).join('');
}

// Method 2: generateProfessionalPDF() - Untuk PDF yang lebih profesional
generateProfessionalPDF() {
    this.showNotification('Membuat laporan PDF...', 'info');
    
    // Cek dulu apakah library tersedia
    if (typeof jspdf === 'undefined') {
        this.loadPDFLibrary(() => {
            // Coba versi kompleks dulu, jika error fallback ke simple
            try {
                this.createPDF();
            } catch (error) {
                console.warn('Complex PDF failed, trying simple version:', error);
                this.generateSimplePDF();
            }
        });
        return;
    }
    
    // Jika sudah ada, coba versi kompleks dulu
    try {
        this.createPDF();
    } catch (error) {
        console.warn('Complex PDF failed, trying simple version:', error);
        this.generateSimplePDF();
    }
}

// Method 3: createPDF() - Membuat PDF dengan jsPDF - FIXED COLOR VERSION
createPDF() {
    try {
        // Pastikan jspdf tersedia
        if (typeof jspdf === 'undefined') {
            throw new Error('jsPDF belum dimuat. Silakan coba lagi.');
        }
        
        // Buat instance jsPDF
        const doc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        // Page dimensions
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        let yPos = margin;
        
        // ====== HEADER ======
        doc.setFillColor(67, 97, 238); // Primary color
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN KEUANGAN', pageWidth / 2, 12, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })} ${new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        })}`, pageWidth / 2, 18, { align: 'center' });
        
        // User info
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text(`User: ${this.state.user.name}`, margin, 35);
        doc.text(`Status: ${this.state.user.isPremium ? 'PREMIUM' : 'STANDARD'}`, 
                pageWidth - margin, 35, { align: 'right' });
        
        yPos = 45;
        
        // ====== EXECUTIVE SUMMARY ======
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN FINANSIAL', margin, yPos);
        yPos += 10;

        // Summary box
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 35);

        // Hitung posisi yang lebih baik
        const boxWidth = pageWidth - 2 * margin;
        const columnWidth = boxWidth / 4; // 4 kolom

        // Income - Kolom 1
        doc.setTextColor(6, 214, 160); // Green
        doc.setFontSize(16); // Ukuran lebih kecil agar muat
        doc.text(String(this.formatCurrency(this.state.finances.income)), 
                margin + columnWidth * 0.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Pendapatan', margin + columnWidth * 0.5, yPos + 17, { align: 'center' });

        // Expenses - Kolom 2
        doc.setTextColor(239, 35, 60); // Red
        doc.setFontSize(16);
        doc.text(String(this.formatCurrency(this.state.finances.expenses)), 
                margin + columnWidth * 1.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Pengeluaran', margin + columnWidth * 1.5, yPos + 17, { align: 'center' });

        // Savings - Kolom 3
        doc.setTextColor(67, 97, 238); // Blue
        doc.setFontSize(16);
        doc.text(String(this.formatCurrency(this.state.finances.savings)), 
                margin + columnWidth * 2.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Tabungan', margin + columnWidth * 2.5, yPos + 17, { align: 'center' });

        // Savings Rate - Kolom 4
        const savingsRate = this.calculateSavingsRate();
        doc.setTextColor(114, 9, 183); // Purple
        doc.setFontSize(14); // Sedikit lebih kecil
        doc.text(`${savingsRate}%`, margin + columnWidth * 3.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Rasio Tabungan', margin + columnWidth * 3.5, yPos + 17, { align: 'center' });

        yPos += 45;
        
        // ====== KEY METRICS ======
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('METRIK UTAMA', margin, yPos);
        yPos += 8;
        
        // Definisikan metrics dengan warna yang sudah divalidasi
        const metrics = [
            { 
                label: 'Income Growth', 
                value: `${this.calculateIncomeGrowth()}%`, 
                r: 6, g: 214, b: 160
            },
            { 
                label: 'Expense Ratio', 
                value: `${this.calculateExpenseRatio()}%`, 
                r: 239, g: 35, b: 60
            },
            { 
                label: 'Financial Health', 
                value: this.calculateFinancialHealthForPDF(), // ← GUNAKAN METHOD BARU
                r: 67, g: 97, b: 238
            },
            { 
                label: 'Transactions', 
                value: String(this.state.transactions.income.length + this.state.transactions.expenses.length),
                r: 247, g: 37, b: 133
            }
        ];
        
        metrics.forEach((metric, index) => {
            const x = margin + (index % 2) * 90;
            const y = yPos + Math.floor(index / 2) * 15;
            
            // Pastikan warna dalam range 0-255
            const r = Math.max(0, Math.min(255, metric.r));
            const g = Math.max(0, Math.min(255, metric.g));
            const b = Math.max(0, Math.min(255, metric.b));
            
            doc.setTextColor(r, g, b);
            doc.setFontSize(10);
            doc.text(String(metric.value), x, y);
            
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(metric.label, x, y + 4);
        });
        
        yPos += 40;
        
        // ====== RECENT TRANSACTIONS ======
        // Cek jika perlu page baru
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('TRANSAKSI TERBARU', margin, yPos);
        yPos += 8;
        
        // Table header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Tanggal', margin + 2, yPos + 5);
        doc.text('Deskripsi', margin + 30, yPos + 5);
        doc.text('Kategori', margin + 90, yPos + 5);
        doc.text('Jumlah', pageWidth - margin - 20, yPos + 5, { align: 'right' });
        
        yPos += 9;
        
        // Recent transactions
        const recentTransactions = [
            ...this.state.transactions.income.map(t => ({ ...t, type: 'income' })),
            ...this.state.transactions.expenses.map(t => ({ ...t, type: 'expense' }))
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);
        
        recentTransactions.forEach((transaction, index) => {
            // Cek jika perlu page baru
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = margin + 8;
                
                // Tambah header lagi di page baru
                doc.setFillColor(241, 245, 249);
                doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 7, 'F');
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                doc.text('Tanggal', margin + 2, yPos - 3);
                doc.text('Deskripsi', margin + 30, yPos - 3);
                doc.text('Kategori', margin + 90, yPos - 3);
                doc.text('Jumlah', pageWidth - margin - 20, yPos - 3, { align: 'right' });
            }
            
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
            }
            
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            
            // Date
            const date = new Date(transaction.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
            doc.text(String(formattedDate), margin + 2, yPos + 4);
            
            // Description (truncated)
            const description = transaction.name.length > 25 
                ? transaction.name.substring(0, 22) + '...' 
                : transaction.name;
            doc.text(String(description), margin + 30, yPos + 4);
            
            // Category
            const categoryName = this.getCategoryName(transaction.category);
            doc.text(String(categoryName), margin + 90, yPos + 4);
            
            // Amount with color - Gunakan setTextColor dengan RGB terpisah
            const amount = this.formatCurrency(transaction.amount);
            if (transaction.type === 'income') {
                doc.setTextColor(6, 214, 160); // Green for income
            } else {
                doc.setTextColor(239, 35, 60); // Red for expense
            }
            doc.text(String(`${transaction.type === 'income' ? '+' : '-'} ${amount}`), 
                    pageWidth - margin - 2, yPos + 4, { align: 'right' });
            
            yPos += 6;
        });
        
        yPos += 10;
        
        // ====== GOALS PROGRESS ======
        if (this.state.goals.length > 0 && yPos < pageHeight - 50) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('PROGRESS TARGET', margin, yPos);
            yPos += 8;
            
            this.state.goals.slice(0, 3).forEach((goal, index) => {
                if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = margin;
                }
                
                // Goal name
                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
                doc.text(String(goal.name), margin, yPos);
                
                // Progress bar background
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.rect(margin, yPos + 2, 80, 4);
                
                // Progress bar fill
                doc.setFillColor(67, 97, 238);
                doc.rect(margin, yPos + 2, 80 * (goal.progress / 100), 4, 'F');
                
                // Progress text
                const progressText = `${goal.progress}% • ${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}`;
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(String(progressText), margin + 85, yPos + 5);
                
                // Deadline
                const deadlineText = `Deadline: ${this.formatDate(goal.deadline)}`;
                doc.text(String(deadlineText), margin, yPos + 12);
                
                yPos += 20;
            });
        }
        
        // ====== FOOTER ======
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Page number
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Footer text
            doc.text('Financial Masterplan PRO • www.financialmasterplan.com', 
                    pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        // ====== SAVE PDF ======
        const fileName = `Laporan_Keuangan_${this.state.user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        this.showNotification('✅ Laporan PDF berhasil dibuat!', 'success');
        
    } catch (error) {
        console.error('Error creating PDF:', error);
        this.showNotification(`Gagal membuat PDF: ${error.message}`, 'error');
        
        // Fallback ke simple report
        setTimeout(() => {
            this.generateSimpleReport();
        }, 1000);
    }
}

generateSimplePDF() {
    try {
        if (typeof jspdf === 'undefined') {
            this.loadPDFLibrary(() => this.generateSimplePDF());
            return;
        }
        
        const doc = new jspdf.jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 30);
        doc.text(`User: ${this.state.user.name}`, 20, 37);
        
        // Financial Summary
        doc.setFontSize(16);
        doc.text('Ringkasan Finansial', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Total Pendapatan: ${this.formatCurrency(this.state.finances.income)}`, 30, 60);
        doc.text(`Total Pengeluaran: ${this.formatCurrency(this.state.finances.expenses)}`, 30, 67);
        doc.text(`Total Tabungan: ${this.formatCurrency(this.state.finances.savings)}`, 30, 74);
        doc.text(`Rasio Tabungan: ${this.calculateSavingsRate()}%`, 30, 81);
        
        // Recent Transactions
        doc.setFontSize(16);
        doc.text('Transaksi Terbaru', 20, 95);
        
        let yPos = 105;
        const recentTransactions = [
            ...this.state.transactions.income.map(t => ({ ...t, type: 'Pendapatan' })),
            ...this.state.transactions.expenses.map(t => ({ ...t, type: 'Pengeluaran' }))
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
        
        doc.setFontSize(10);
        recentTransactions.forEach((t, i) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            
            const date = new Date(t.date).toLocaleDateString('id-ID', { 
                day: '2-digit', 
                month: '2-digit' 
            });
            
            doc.text(`${date} ${t.name.substring(0, 30)}`, 20, yPos);
            doc.text(`${t.type === 'Pendapatan' ? '+' : '-'} ${this.formatCurrency(t.amount)}`, 180, yPos, { align: 'right' });
            yPos += 7;
        });
        
        // Footer
        doc.setFontSize(8);
        doc.text('Dibuat oleh Financial Masterplan PRO', 105, 290, { align: 'center' });
        
        // Save
        const fileName = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        this.showNotification('✅ Laporan PDF sederhana berhasil dibuat!', 'success');
        
    } catch (error) {
        console.error('Error in generateSimplePDF:', error);
        this.showNotification('Gagal membuat PDF, mencoba format lain...', 'warning');
        this.generateSimpleReport();
    }
}


// ====== TAMBAHKAN method untuk testing ======
testPDFGeneration() {
    console.log('🧪 Testing PDF Generation...');
    
    // Test 1: Check if formatCurrency returns string
    const testAmount = 1000000;
    const formatted = this.formatCurrency(testAmount);
    console.log('Format Currency Test:', typeof formatted, formatted);
    
    // Test 2: Check if calculateFinancialHealth returns string
    const health = this.calculateFinancialHealth();
    console.log('Financial Health Test:', typeof health, health);
    
    // Test 3: Test color validation
    console.log('Color Validation Test:');
    const testColors = [
        { r: 6, g: 214, b: 160 },
        { r: 239, g: 35, b: 60 },
        { r: 67, g: 97, b: 238 },
        { r: 247, g: 37, b: 133 }
    ];
    
    testColors.forEach((color, i) => {
        const valid = color.r >= 0 && color.r <= 255 && 
                     color.g >= 0 && color.g <= 255 && 
                     color.b >= 0 && color.b <= 255;
        console.log(`Color ${i + 1}:`, color, 'Valid:', valid);
    });
    
    // Run actual PDF generation dengan fallback
    console.log('Running PDF generation...');
    this.generateProfessionalPDF();
}

// Method 4: loadPDFLibrary() - Memuat library jsPDF
loadPDFLibrary(callback) {
    this.showNotification('Memuat library PDF...', 'info');
    
    // Cek jika sudah loading
    if (window.pdfLoading) {
        setTimeout(() => {
            if (typeof jspdf !== 'undefined') {
                callback();
            } else {
                this.loadPDFLibrary(callback);
            }
        }, 500);
        return;
    }
    
    window.pdfLoading = true;
    
    // Cek apakah sudah ada script
    if (document.querySelector('script[src*="jspdf"]')) {
        // Script sudah ada, tunggu sampai loaded
        setTimeout(() => {
            if (typeof jspdf !== 'undefined') {
                window.pdfLoading = false;
                callback();
            } else {
                this.loadPDFLibrary(callback);
            }
        }, 300);
        return;
    }
    
    // Load jsPDF dari CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.integrity = 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
        console.log('✅ jsPDF loaded successfully');
        window.pdfLoading = false;
        
        // Tunggu sedikit untuk memastikan library siap
        setTimeout(() => {
            if (typeof jspdf !== 'undefined') {
                this.showNotification('Library PDF siap!', 'success');
                callback();
            } else {
                this.showNotification('Gagal memuat library PDF', 'error');
                this.generateSimpleReport();
            }
        }, 100);
    };
    
    script.onerror = (error) => {
        console.error('❌ Failed to load jsPDF:', error);
        window.pdfLoading = false;
        this.showNotification('Gagal memuat library PDF, menggunakan format sederhana', 'warning');
        
        // Fallback ke simple report
        setTimeout(() => {
            this.generateSimpleReport();
        }, 500);
    };
    
    document.head.appendChild(script);
}

// Method 5: generateSimpleReport() - Fallback report dalam format TXT
generateSimpleReport() {
    console.log('📝 Generating simple text report...');
    
    try {
        const reportDate = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let reportText = '';
        reportText += '='.repeat(50) + '\n';
        reportText += 'LAPORAN KEUANGAN\n';
        reportText += '='.repeat(50) + '\n';
        reportText += `Tanggal : ${reportDate}\n`;
        reportText += `User    : ${this.state.user.name}\n`;
        reportText += `Status  : ${this.state.user.isPremium ? 'PREMIUM' : 'STANDARD'}\n`;
        reportText += '-'.repeat(50) + '\n\n';
        
        // Financial Summary
        reportText += 'RINGKASAN FINANSIAL\n';
        reportText += '-'.repeat(30) + '\n';
        reportText += `Total Pendapatan : ${this.formatCurrency(this.state.finances.income)}\n`;
        reportText += `Total Pengeluaran: ${this.formatCurrency(this.state.finances.expenses)}\n`;
        reportText += `Total Tabungan   : ${this.formatCurrency(this.state.finances.savings)}\n`;
        reportText += `Rasio Tabungan   : ${this.calculateSavingsRate()}%\n`;
        reportText += `Kesehatan Finansial: ${this.calculateFinancialHealthForPDF()}\n\n`;

        
        // Metrics
        reportText += 'METRIK UTAMA\n';
        reportText += '-'.repeat(30) + '\n';
        reportText += `Pertumbuhan Pendapatan: ${this.calculateIncomeGrowth()}%\n`;
        reportText += `Rasio Pengeluaran: ${this.calculateExpenseRatio()}%\n`;
        reportText += `Total Transaksi: ${this.state.transactions.income.length + this.state.transactions.expenses.length}\n\n`;
        
        // Recent Transactions
        reportText += 'TRANSAKSI TERBARU (10 terakhir)\n';
        reportText += '-'.repeat(50) + '\n';
        
        const recentTransactions = [
            ...this.state.transactions.income.map(t => ({ ...t, type: 'PENDAPATAN' })),
            ...this.state.transactions.expenses.map(t => ({ ...t, type: 'PENGELUARAN' }))
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
        
        if (recentTransactions.length === 0) {
            reportText += 'Belum ada transaksi.\n';
        } else {
            recentTransactions.forEach(t => {
                const date = new Date(t.date).toLocaleDateString('id-ID', { 
                    day: '2-digit', 
                    month: 'short' 
                });
                reportText += `${date.padEnd(8)} ${t.type.padEnd(12)} ${t.name.substring(0, 25).padEnd(27)} ${(t.type === 'PENDAPATAN' ? '+' : '-') + this.formatCurrency(t.amount).padStart(15)}\n`;
            });
        }
        
        reportText += '\n';
        
        // Goals
        if (this.state.goals.length > 0) {
            reportText += 'TARGET FINANSIAL\n';
            reportText += '-'.repeat(50) + '\n';
            
            this.state.goals.forEach((goal, index) => {
                reportText += `${index + 1}. ${goal.name}\n`;
                reportText += `   Target    : ${this.formatCurrency(goal.target)}\n`;
                reportText += `   Terkumpul : ${this.formatCurrency(goal.current)} (${goal.progress}%)\n`;
                reportText += `   Deadline  : ${this.formatDate(goal.deadline)}\n`;
                reportText += `   ${'█'.repeat(Math.floor(goal.progress / 5))}${'░'.repeat(20 - Math.floor(goal.progress / 5))} ${goal.progress}%\n\n`;
            });
        }
        
        // Footer
        reportText += '='.repeat(50) + '\n';
        reportText += 'Dibuat oleh Financial Masterplan PRO v2.0\n';
        reportText += `© ${new Date().getFullYear()} - financialmasterplan.com\n`;
        reportText += '='.repeat(50) + '\n';
        
        // Create dan download text file
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('✅ Report teks berhasil dibuat!', 'success');
        
    } catch (error) {
        console.error('Error generating simple report:', error);
        this.showNotification('Gagal membuat report sederhana', 'error');
    }
}

// Helper methods untuk calculations
calculateSavingsRate() {
    if (this.state.finances.income === 0) return 0;
    const rate = (this.state.finances.savings / this.state.finances.income) * 100;
    return Math.round(rate * 10) / 10; // 1 decimal place
}

calculateIncomeGrowth() {
    if (this.state.transactions.income.length < 2) return 0;
    
    // Hitung rata-rata 3 bulan terakhir vs 3 bulan sebelumnya
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const getQuarterTotal = (monthOffset) => {
        let total = 0;
        for (let i = 0; i < 3; i++) {
            const targetMonth = currentMonth - monthOffset - i;
            const targetYear = currentYear - (targetMonth < 0 ? 1 : 0);
            const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
            
            total += this.state.transactions.income.reduce((sum, transaction) => {
                try {
                    const date = new Date(transaction.date);
                    if (date.getMonth() === actualMonth && date.getFullYear() === targetYear) {
                        return sum + transaction.amount;
                    }
                } catch (e) {}
                return sum;
            }, 0);
        }
        return total;
    };
    
    const currentQuarter = getQuarterTotal(0);
    const previousQuarter = getQuarterTotal(3);
    
    if (previousQuarter === 0) return 100;
    
    const growth = ((currentQuarter - previousQuarter) / previousQuarter) * 100;
    return Math.round(growth * 10) / 10;
}

calculateExpenseRatio() {
    if (this.state.finances.income === 0) return 0;
    const ratio = (this.state.finances.expenses / this.state.finances.income) * 100;
    return Math.round(ratio * 10) / 10;
}

calculateFinancialHealth() {
    const savingsRate = this.calculateSavingsRate();
    const expenseRatio = this.calculateExpenseRatio();
    
    if (savingsRate >= 20 && expenseRatio <= 60) return 'Sangat Baik 🏆';
    if (savingsRate >= 15 && expenseRatio <= 70) return 'Baik 👍';
    if (savingsRate >= 10 && expenseRatio <= 80) return 'Cukup 👌';
    if (savingsRate >= 5 && expenseRatio <= 90) return 'Perlu Perbaikan ⚠️';
    return 'Kritis ❌';
}

calculateFinancialHealthForPDF() {
    const savingsRate = this.calculateSavingsRate();
    const expenseRatio = this.calculateExpenseRatio();
    
    if (savingsRate >= 20 && expenseRatio <= 60) return 'EXCELLENT';
    if (savingsRate >= 15 && expenseRatio <= 70) return 'GOOD';
    if (savingsRate >= 10 && expenseRatio <= 80) return 'FAIR';
    if (savingsRate >= 5 && expenseRatio <= 90) return 'NEEDS IMPROVEMENT';
    return 'CRITICAL';
}

getRecentTransactionsForReport() {
    const recentTransactions = [
        ...this.state.transactions.income.map(t => ({ ...t, type: 'Pendapatan' })),
        ...this.state.transactions.expenses.map(t => ({ ...t, type: 'Pengeluaran' }))
    ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);
    
    if (recentTransactions.length === 0) {
        return '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #718096;">Belum ada transaksi</td></tr>';
    }
    
    return recentTransactions.map(t => `
        <tr>
            <td>${this.formatDate(t.date)}</td>
            <td>${t.type}</td>
            <td>${this.getCategoryName(t.category)}</td>
            <td>${t.name}</td>
            <td style="text-align: right; color: ${t.type === 'Pendapatan' ? '#06d6a0' : '#ef233c'};">
                ${t.type === 'Pendapatan' ? '+' : '-'} ${this.formatCurrency(t.amount)}
            </td>
        </tr>
    `).join('');
}
   
    setupQuickActions() {
        // Quick add expense
        const quickAddExpense = document.getElementById('quickAddExpense');
        if (quickAddExpense) {
            quickAddExpense.addEventListener('click', () => {
                this.openModal('addExpenseModal');
            });
        }
        
        // Quick add income
        const quickAddIncome = document.getElementById('quickAddIncome');
        if (quickAddIncome) {
            quickAddIncome.addEventListener('click', () => {
                this.openModal('addIncomeModal');
            });
        }
        
        // Quick add goal
        const quickAddGoal = document.getElementById('quickAddGoal');
        if (quickAddGoal) {
            quickAddGoal.addEventListener('click', () => {
                this.openModal('addGoalModal');
            });
        }
        
        // Quick generate report
        const quickGenerateReport = document.getElementById('quickGenerateReport');
        if (quickGenerateReport) {
            quickGenerateReport.addEventListener('click', () => {
                this.generatePrintableReport();
            });
        }
    }
    
setupChartControls() {
    const chartActions = document.querySelector('.chart-actions');
    if (!chartActions) return;

    // Hapus event listener yang lama jika ada
    if (this._chartControlsHandler) {
        chartActions.removeEventListener('click', this._chartControlsHandler);
    }

    // Buat handler baru
    this._chartControlsHandler = (e) => {
        const btn = e.target.closest('.chart-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        // Remove active class from all buttons
        const buttons = chartActions.querySelectorAll('.chart-btn');
        buttons.forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Get period
        const period = btn.dataset.period;

        // Update chart based on period
        this.updateChartPeriod(period);
    };

    // Tambahkan event listener
    chartActions.addEventListener('click', this._chartControlsHandler);
}
    
    setupExpensesView() {
        // Add expense button
        document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
            this.openModal('addExpenseModal');
        });
        
        // Calculate largest category
        this.calculateLargestCategory();
    }
    
    // ====== FORM HANDLERS ======
    handleAddExpense() {
        const name = document.getElementById('expenseName').value;
        const amount = parseInt(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;
        
        if (!name || !amount || !category || !date) {
            this.showNotification('Harap isi semua field', 'error');
            return;
        }
        
        this.addTransaction('expenses', { name, amount, category, date });
        
        // Reset form
        this.elements.expenseForm.reset();
        
        // Set default date to today
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }
    
    handleAddIncome() {
        const name = document.getElementById('incomeName').value;
        const amount = parseInt(document.getElementById('incomeAmount').value);
        const category = document.getElementById('incomeCategory').value;
        const date = document.getElementById('incomeDate').value;
        
        if (!name || !amount || !category || !date) {
            this.showNotification('Harap isi semua field', 'error');
            return;
        }
        
        this.addTransaction('income', { name, amount, category, date });
        
        // Reset form
        this.elements.incomeForm.reset();
        
        // Set default date to today
        document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    }
    
    handleAddGoal() {
        const name = document.getElementById('goalName').value;
        const target = parseInt(document.getElementById('goalTarget').value);
        const deadline = document.getElementById('goalDeadline').value;
        const current = parseInt(document.getElementById('goalCurrent').value) || 0;
        
        if (!name || !target || !deadline) {
            this.showNotification('Harap isi semua field yang diperlukan', 'error');
            return;
        }
        
        if (current > target) {
            this.showNotification('Jumlah saat ini tidak boleh melebihi target', 'error');
            return;
        }
        
        this.addGoal({ name, target, deadline, current });
        
        // Reset form
        this.elements.goalForm.reset();
        
        // Set default deadline to 3 months from now
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        document.getElementById('goalDeadline').value = threeMonthsLater.toISOString().split('T')[0];
    }
    
    // ====== UTILITY FUNCTIONS ======
    // GANTI method switchTab() dengan ini:
switchTab(tabName) {
    console.log(`🔀 Switching to tab: ${tabName}`);
    
    // Skip jika tab sudah aktif
    if (this.state.activeTab === tabName) {
        console.log(`ℹ️ Tab ${tabName} already active, skipping...`);
        return;
    }
    
    // Update active tab
    this.state.activeTab = tabName;
    
    // Update tab indicators
    const tabs = this.elements.navTabs.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show loading state
    this.showTabLoading(tabName);
    
    // Use timeout untuk ensure DOM siap
    setTimeout(() => {
        try {
            // Update main content
            this.updateTabContent();
            
            // Initialize chart jika di dashboard
            if (tabName === 'dashboard') {
                setTimeout(() => {
                    this.initializeChart();
                    
                    // Setup chart controls lagi
                    setTimeout(() => {
                        this.setupChartControls();
                    }, 200);
                }, 100);
            }
            
            // Update badges
            this.updateBadges();
            
            // Scroll to top untuk mobile
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error(`❌ Error switching to tab ${tabName}:`, error);
            this.showNotification(`Gagal membuka tab ${tabName}`, 'error');
        }
    }, 10);
}

// TAMBAHKAN method ini:
showTabLoading(tabName) {
    const mainContent = this.elements.mainContent;
    if (!mainContent) return;
    
    const tabNames = {
        'dashboard': '📊 Dashboard',
        'expenses': '💸 Pengeluaran', 
        'income': '💰 Pendapatan',
        'checklist': '✅ Checklist',
        'simulation': '📈 Simulasi',
        'settings': '⚙️ Pengaturan'
    };
    
    const displayName = tabNames[tabName] || tabName;
    
    mainContent.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Memuat ${displayName}...</p>
        </div>
    `;
}
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = this.elements.modalOverlay;
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const dateInputs = modal.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                if (!input.value) {
                    input.value = today;
                }
            });
        }
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        this.elements.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        return dateString;
    }
}
    
    getCategoryName(category) {
        const categories = {
            'kebutuhan': 'Kebutuhan',
            'hiburan': 'Hiburan',
            'transport': 'Transportasi',
            'makanan': 'Makanan',
            'gaji': 'Gaji',
            'freelance': 'Freelance',
            'investasi': 'Investasi',
            'lainnya': 'Lainnya'
        };
        
        return categories[category] || category;
    }
    
    calculateLargestCategory() {
        const categoryTotals = {};
        
        this.state.transactions.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        
        let largestCategory = '-';
        let largestAmount = 0;
        
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > largestAmount) {
                largestAmount = amount;
                largestCategory = this.getCategoryName(category);
            }
        }
        
        const element = document.getElementById('largestCategory');
        if (element) {
            element.textContent = largestCategory;
        }
    }
    
    // ====== NOTIFICATIONS & FEEDBACK ======
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : 
                        type === 'error' ? 'var(--danger)' : 'var(--info)'};
            color: white;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ====== EXPORT & IMPORT ======
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validate imported data
                    if (importedData && importedData.finances) {
                        this.state = {
                            ...this.state,
                            ...importedData,
                            activeTab: this.state.activeTab
                        };
                        
                        this.calculateFinances();
                        this.updateUI();
                        this.saveData();
                        
                        this.showNotification('Data berhasil diimport!', 'success');
                    } else {
                        this.showNotification('Format data tidak valid', 'error');
                    }
                } catch (error) {
                    this.showNotification('Gagal membaca file', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // ====== SERVICE WORKER SETUP ======
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration);
                    this.elements.appMode.textContent = 'PWA Ready';
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                    this.elements.appMode.textContent = 'Web App';
                });
        }
    }
    
    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const appModeElement = document.getElementById('appMode');
        
        if (appModeElement) {
            appModeElement.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
            appModeElement.style.color = isOnline ? 'var(--success)' : 'var(--danger)';
        }
        
        if (!isOnline) {
            this.showNotification('Anda sedang offline. Data disimpan lokal.', 'warning', 3000);
        } else {
            // Sync data jika ada perubahan
            this.autoSyncData();
        }
    }

    // Method baru: autoSyncData
    autoSyncData() {
        // Untuk versi mendatang bisa ditambahkan sync ke cloud
        console.log('🔄 Online, siap untuk sync data');
    }
    
    // ====== ANIMATIONS ======
    setupAnimations() {
        // Add scroll effect to header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // ====== PUBLIC METHODS (for onclick handlers) ======
    deleteExpense(id) {
        this.deleteTransaction('expenses', id);
    }

    deleteIncome(id) {
        this.deleteTransaction('income', id);
    }

    updateGoalAmount(goalId) {
        const amount = prompt('Masukkan jumlah tambahan dana:');
        if (amount && !isNaN(parseInt(amount))) {
            const goal = this.state.goals.find(g => g.id === goalId);
            if (goal) {
                const newCurrent = goal.current + parseInt(amount);
                this.updateGoal(goalId, { current: newCurrent });
            }
        } else if (amount) {
            this.showNotification('Masukkan angka yang valid', 'error');
        }
    }

    toggleSetting(setting, value) {
        this.state.settings[setting] = value;
        
        if (setting === 'autoSave') {
            this.saveData(false);
            this.showNotification(
                value ? 'Auto-save diaktifkan' : 'Auto-save dimatikan', 
                'success'
            );
        } else {
            this.saveData(true);
        }
    }

    showHelp() {
        this.showNotification('Bantuan dan dokumentasi sedang disiapkan', 'info');
    }

    showTips() {
        const tips = [
            "💡 Tip: Catat semua pengeluaran kecil untuk kontrol yang lebih baik",
            "💰 Tip: Alokasikan 20% dari pendapatan untuk tabungan",
            "📈 Tip: Review budget Anda setiap minggu",
            "🎯 Tip: Buat goals yang spesifik dan terukur",
            "🔄 Tip: Otomatiskan pembayaran berulang jika memungkinkan"
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showNotification(randomTip, 'info');
    }
} // Close FinancialApp class

// ====== INITIALIZE APP ======
let app;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded, initializing Financial Masterplan PRO...');
    app = new FinancialApp();
    
    // Expose app to global scope for onclick handlers
    window.app = app;
});
