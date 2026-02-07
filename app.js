/* ====== FINANCIAL MASTERPLAN PRO - MAIN APP ENTRY POINT ====== */

// Import modules
import DataManager from './modules/DataManager.js';
import FinanceCalculator from './modules/FinanceCalculator.js';
import UIManager from './modules/UIManager.js';
import ChartManager from './modules/ChartManager.js';
import ReportGenerator from './modules/ReportGenerator.js';
import EventManager from './modules/EventManager.js';
import PWAInstaller from './modules/PWAInstaller.js';
import FinancialAssistant from './modules/FinancialAssistant.js';
import FormHandlers from './modules/FormHandlers.js';
import { BackupManager } from './modules/BackupManager.js';
import CategoryManager from './modules/CategoryManager.js';
import { RecurringManager } from './modules/RecurringManager.js'; // Recurring Manager
import InsightEngine from './modules/InsightEngine.js'; // Insight Engine

// Import views
import DashboardView from './views/DashboardView.js';
import ExpensesView from './views/ExpensesView.js'; // DEPRECATED - kept for rollback
import IncomeView from './views/IncomeView.js'; // DEPRECATED - kept for rollback
import TransactionsView from './views/TransactionsView.js'; // NEW - replaces Expenses + Income
import ChecklistView from './views/ChecklistView.js';
import SimulationView from './views/SimulationView.js';
import SettingsView from './views/SettingsView.js';
import BudgetView from './views/BudgetView.js';

// Import constants
import { APP_CONFIG } from './utils/Constants.js';

class FinancialApp {
    constructor() {
        window.app = this; // Expose to window for global handlers
        console.log('🚀 Initializing Financial Masterplan PRO v2.1');

        // Initialize state
        this.state = {
            user: {
                name: 'Ferdiansyah Lim',
                avatar: 'FL',
                isPremium: true,
                joinedDate: new Date().toISOString()
            },
            finances: {
                income: 0,
                expenses: 0,
                savings: 0,
                balance: 0,
                monthlyIncome: 0,
                monthlyExpenses: 0
            },
            transactions: {
                income: [],
                expenses: []
            },
            goals: [],
            checklist: [],
            budgets: [], // Budget data
            accounts: [], // Account data (bank, cash, ewallet)
            categories: [], // User-defined categories
            transfers: [], // Internal account transfers
            categories: [], // User-defined categories
            transfers: [], // Internal account transfers
            recurring: [], // Recurring transactions
            settings: {
                currency: 'IDR',
                theme: 'auto',
                notifications: true,
                autoSave: true
            },
            activeTab: null, // Start with null to force initial render
            isLoading: true,
            isChartReady: false
        };

        // DOM Elements cache
        this.elements = {};

        // Undo state management
        this.pendingDeletions = new Map(); // deleteId -> {type, transaction, timeout, index}

        // Initialize modules
        this.initModules();

        // Start app
        this.init();
    }

    initModules() {
        console.log('📦 Initializing modules...');

        // Core modules
        this.dataManager = new DataManager(this);
        this.calculator = new FinanceCalculator(this);
        this.uiManager = new UIManager(this);
        this.chartManager = new ChartManager(this);
        this.assistant = new FinancialAssistant(this); // Initialize Assistant
        this.reportGenerator = new ReportGenerator(this);
        this.eventManager = new EventManager(this);
        this.pwaInstaller = new PWAInstaller(this);
        this.formHandlers = new FormHandlers(this); // Form handling module
        this.backupManager = new BackupManager(this); // Backup module
        this.categoryManager = new CategoryManager(this); // Category manager
        this.recurringManager = new RecurringManager(this); // Recurring manager
        this.insightEngine = new InsightEngine(this); // Insight engine

        // Initialize Views Registry
        this.views = {
            dashboard: new DashboardView(this),
            // PHASE 4: NEW - Unified Transactions View
            transactions: new TransactionsView(this),
            // DEPRECATED (Phase 4) - kept for rollback only, not accessible via navigation
            expenses: new ExpensesView(this),
            income: new IncomeView(this),
            // Active views
            checklist: new ChecklistView(this),
            simulation: new SimulationView(this),
            settings: new SettingsView(this),
            budget: new BudgetView(this)
        };

        console.log('✅ All modules initialized successfully');
    }

    init() {
        console.log('🚀 Starting app initialization...');

        // Cache DOM elements
        this.cacheElements();

        // Load data
        this.dataManager.loadData();

        // Initialize categories (after data load)
        this.categoryManager.initializeCategories();

        // Sync Goals
        this.assistant.syncGoals();



        // Setup event listeners
        this.eventManager.setupEventListeners();

        // Setup PWA
        this.pwaInstaller.initialize();

        // Apply theme
        this.uiManager.applyTheme();

        // MIGRATION: Perform data migration to new model
        this.performMigration();

        // Calculate initial finances (re-calculate after migration just in case)
        this.calculator.calculateFinances();

        // Update UI
        this.uiManager.updateUI();

        // Initialize Form Handlers (NEW)
        if (this.formHandlers) {
            this.formHandlers.initialize();
        }

        // Initialize Recurring Manager
        if (this.recurringManager) {
            this.recurringManager.initialize();
        }

        // Show dashboard dengan sedikit delay untuk memastikan DOM siap
        setTimeout(() => {
            this.showView('dashboard');
        }, 100);

        // Setup responsive design
        this.uiManager.setupResponsiveDesign();

        // Listen for chart ready event
        this.setupChartReadyListener();

        console.log('✅ App initialized successfully');
    }

    performMigration() {
        if (this.state.settings.migrationCompleted) {
            return;
        }

        console.log('🚧 Performing migration to Net Balance Model...');

        // 1. Recalculate finances with new logic (Net Balance - Allocation = Available)
        this.calculator.calculateFinances();

        // 2. Check for negative available cash
        const { availableCash } = this.state.finances;

        if (availableCash < 0) {
            setTimeout(() => {
                alert(
                    '⚠️ PERHATIAN MIGRASI SISTEM ⚠️\n\n' +
                    'Sistem telah diperbarui ke model Net Balance.\n' +
                    `Total alokasi goal Anda melebihi dana tunai yang tersedia sebesar ${this.calculator.formatCurrency(Math.abs(availableCash))}.\n\n` +
                    'Mohon tinjau kembali goal Anda dan sesuaikan target/alokasi agar sesuai dengan saldo riil.'
                );
            }, 1000);
        } else {
            this.uiManager.showNotification('Sistem keuangan diperbarui ke versi Net Balance', 'success');
        }

        // 3. Mark migration as complete
        this.state.settings.migrationCompleted = true;
        this.dataManager.saveData(true);
    }

    setupChartReadyListener() {
        document.addEventListener('chartReady', (event) => {
            console.log('📊 Chart is ready!', event.detail);

            // Update UI atau lakukan aksi lain saat chart siap
            // Contoh: Update badge atau tampilkan notifikasi
            this.uiManager.showNotification('Chart siap! 📊', 'success', 2000);

            // Update chart controls jika perlu
            if (this.chartManager) {
                this.chartManager.setupChartControls();
            }
        });
    }

    cacheElements() {
        console.log('🔍 Caching DOM elements...');

        // Main containers
        this.elements.app = document.getElementById('app');
        this.elements.mainContent = document.getElementById('mainContent');
        this.elements.navTabs = document.getElementById('navTabs');
        this.elements.modalOverlay = document.getElementById('modalOverlay');

        // Header elements
        this.elements.userName = document.getElementById('userName');
        this.elements.userAvatar = document.getElementById('userAvatar');
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.installBtn = document.getElementById('installBtn');

        // Navigation badges
        this.elements.expenseBadge = document.getElementById('expenseBadge');
        this.elements.checklistBadge = document.getElementById('checklistBadge');

        // Footer elements
        this.elements.storageStatus = document.getElementById('storageStatus');
        this.elements.appMode = document.getElementById('appMode');
        this.elements.appVersion = document.getElementById('appVersion');

        // Buttons
        this.elements.clearDataBtn = document.getElementById('clearDataBtn');
        this.elements.helpBtn = document.getElementById('helpBtn');
        this.elements.tipsBtn = document.getElementById('tipsBtn');
        this.elements.exportReport = document.getElementById('exportReport');
        this.elements.darkModeToggle = document.getElementById('darkModeToggle');

        console.log('✅ DOM elements cached');
    }

    // ====== PUBLIC API METHODS ======

    showView(viewName, options = { force: false }) {
        this.state.isLoading = true;

        // Prevent infinite recursion and unnecessary re-renders
        if (!options.force && this.state.activeTab === viewName) {
            console.log(`ℹ️ Already on view ${viewName}, skipping render.`);
            this.state.isLoading = false;
            return;
        }

        console.log(`Navigation: Switching to ${viewName} (Force: ${options.force})`);

        // Update navigation UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === viewName) {
                item.classList.add('active');
            }
        });

        const switchContent = () => {
            try {
                // 1. CLEANUP: Destroy previous view if needed
                const previousView = this.views[this.state.activeTab];
                if (previousView && typeof previousView.destroy === 'function') {
                    previousView.destroy();
                }

                // 2. STATE: Update active tab
                this.state.activeTab = viewName;

                // 2. CLEAR DOM
                // This ensures we start with a clean slate
                if (this.elements.mainContent) {
                    this.elements.mainContent.innerHTML = '';
                    // Add entrance animation class
                    this.elements.mainContent.className = `main-content ${viewName}-view page-entrance`;
                }

                if (this.views[viewName]) {
                    const view = this.views[viewName];

                    // 3. RENDER: Get HTML string
                    // Support new getHtml() pattern (Architecture Fix)
                    if (typeof view.getHtml === 'function') {
                        const html = view.getHtml();

                        // 4. INJECT: Update DOM via Controller
                        if (this.elements.mainContent) {
                            this.elements.mainContent.innerHTML = html;
                        }

                        // 5. INITIALIZE: Call afterRender
                        if (typeof view.afterRender === 'function') {
                            // Small delay to ensure DOM is ready/painted
                            setTimeout(() => {
                                view.afterRender();
                            }, 50);
                        }
                    } else if (typeof view.render === 'function') {
                        // Fallback for legacy views (Temporary)
                        console.warn(`⚠️ View ${viewName} uses legacy render(). Please refactor to getHtml() + afterRender()`);
                        view.render();
                    } else {
                        throw new Error(`View ${viewName} implements neither getHtml() nor render()`);
                    }
                } else {
                    console.error(`❌ View not found: ${viewName}`);
                    if (viewName !== 'dashboard') this.showView('dashboard');
                }
            } catch (error) {
                console.error(`❌ Error rendering view ${viewName}:`, error);
                this.uiManager.showNotification(`Gagal memuat ${viewName}`, 'error');
            } finally {
                this.state.isLoading = false;
                // Re-initialize scroll reveal for new content
                setTimeout(() => this.uiManager.setupScrollReveal(), 100);
            }
        };

        // If current content exists, animate exit first
        if (this.elements.mainContent && this.elements.mainContent.children.length > 0) {
            this.elements.mainContent.classList.add('page-exit');
            setTimeout(switchContent, 300); // 300ms matches CSS animation duration
        } else {
            switchContent();
        }
    }

    // ====== TRANSACTION MANAGEMENT ======

    addTransaction(type, data) {
        console.log(`➕ Adding ${type} transaction:`, data);

        const transaction = this.dataManager.addTransaction(type, data);

        // Recalculate finances
        this.calculator.calculateFinances();

        // Update UI
        this.uiManager.updateUI();

        // --- ASSISTANT HOOK ---
        this.handleAssistantSuggestions(type, data.amount);

        // Update chart if on dashboard
        if (this.state.activeTab === 'dashboard' && this.chartManager) {
            this.chartManager.updateChart();
        }

        // Update current view
        this.refreshCurrentView();

        return transaction;
    }

    handleAssistantSuggestions(type, amount) {
        if (type === 'income') {
            const suggestions = this.assistant.suggestAllocation(amount);
            if (suggestions.length > 0) {
                this.showAssistantModal('allocation-choice', suggestions, amount);
            } else {
                this.uiManager.showNotification('Pendapatan berhasil ditambahkan!', 'success');
            }
        } else if (type === 'expense') {
            const rebalance = this.assistant.checkRebalance();
            if (rebalance && rebalance.length > 0) {
                this.showAssistantModal('rebalance', rebalance);
            } else {
                this.uiManager.showNotification('Pengeluaran berhasil ditambahkan!', 'success');
            }
        }
    }

    showAssistantModal(type, data, totalAmount, mode = 'ai') {
        const modalBody = document.getElementById('assistantModalBody');
        const modalFooter = document.getElementById('assistantModalFooter');

        if (!modalBody || !modalFooter) {
            console.error('Assistant modal elements not found');
            return;
        }

        if (type === 'allocation-choice') {
            const availableCash = this.state.finances.availableCash;
            // If checking specifically on income add, totalAmount is the income
            // But we want to show total available.
            // Let's rely on the state for available cash text, but mention the income triggered it.

            modalBody.innerHTML = `
                <div class="assistant-choice">
                    <p>Pendapatan berhasil dicatat! Total <strong>Dana Tersedia</strong> Anda saat ini: <strong>${this.calculator.formatCurrency(availableCash)}</strong>.</p>
                    <p style="margin-top: var(--space-2);">Apakah Anda ingin mengalokasikan dana ini ke goals Anda?</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-3); margin-top: var(--space-4);">
                        <button class="btn btn-outline" id="pickAI" style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: var(--space-4); height: auto; transition: all 0.2s;">
                            <span style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">🤖 Gunakan Saran AI</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">Otomatis mengisi berdasarkan prioritas & deadline.</span>
                        </button>
                        <button class="btn btn-outline" id="pickManual" style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: var(--space-4); height: auto; transition: all 0.2s;">
                            <span style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">✍️ Alokasi Manual</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">Pilih sendiri jumlah untuk setiap goal Anda.</span>
                        </button>
                    </div>
                </div>
            `;
            modalFooter.innerHTML = `
                <button class="btn btn-ghost" id="skipAllocation">Nanti Saja</button>
            `;

            document.getElementById('pickAI')?.addEventListener('click', () => {
                this.showAssistantModal('allocation', data, totalAmount, 'ai');
            });
            document.getElementById('pickManual')?.addEventListener('click', () => {
                this.showAssistantModal('allocation', data, totalAmount, 'manual');
            });
            document.getElementById('skipAllocation')?.addEventListener('click', () => {
                this.uiManager.closeModal('assistantModal');
                this.uiManager.showNotification('Pendapatan ditambahkan tanpa alokasi.', 'info');
            });
            this.uiManager.openModal('assistantModal');
            return;
        }

        let html = '';
        let footerHtml = '';

        if (type === 'allocation') {
            const availableToAllocate = this.state.finances.availableCash;
            html = `
                <div class="assistant-suggestion">
                    <div style="margin-bottom: var(--space-4); padding: var(--space-3); background: var(--primary-50); border-radius: var(--radius-md); border-left: 4px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Dana Tersedia:</div>
                            <div style="font-size: 1.15rem; font-weight: 700; color: var(--primary);">${this.calculator.formatCurrency(availableToAllocate)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Metode:</div>
                            <div style="font-size: 0.875rem; font-weight: 600;">${mode === 'ai' ? '🤖 AI Suggested' : '✍️ Manual'}</div>
                        </div>
                    </div>
                    
                    <div class="manual-allocation-container" style="max-height: 45vh; overflow-y: auto; padding-right: var(--space-2);">
                        ${data.map(s => `
                            <div class="allocation-row" style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); padding: var(--space-3); background: var(--gray-50); border-radius: var(--radius-md);">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600;">${s.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Sisa: ${this.calculator.formatCurrency(s.remainingTarget)}</div>
                                </div>
                                <div style="width: 130px;">
                                    <input type="number" 
                                           class="allocation-input" 
                                           data-goal-id="${s.goalId}" 
                                           value="${mode === 'ai' ? s.aiAmount || 0 : 0}" 
                                           min="0" 
                                           style="width: 100%; padding: var(--space-2); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-weight: 600;">
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: var(--space-4); display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-3); border-top: 1px solid var(--border-divider);">
                        <div style="font-weight: 600; font-size: 0.875rem;">Total Dialokasikan:</div>
                        <div style="font-size: 1rem; font-weight: 700;" id="assistantTotalAllocated">Rp 0</div>
                    </div>
                    <div id="allocationWarning" style="color: var(--danger); font-size: 0.75rem; margin-top: var(--space-1); text-align: right; display: none;">
                        ⚠️ Total melebihi pendapatan!
                    </div>
                </div>
            `;
            footerHtml = `
                <button class="btn btn-outline" id="backToChoice">Kembali</button>
                <button class="btn" id="confirmAllocation">Simpan Alokasi</button>
            `;
        } else if (type === 'rebalance') {
            html = `
                <div class="assistant-suggestion">
                    <p>🚨 <strong>Peringatan Rebalancing</strong></p>
                    <p>Pengeluaran baru ini menyebabkan alokasi goal Anda melebihi saldo yang tersedia. Anda mungkin perlu menyesuaikan alokasi goal berikut:</p>
                    <div class="suggestion-list" style="margin-top: var(--space-4);">
                        ${data.map(s => `
                            <div style="padding: var(--space-3); background: var(--gray-50); border-radius: var(--radius-md); margin-bottom: var(--space-2);">
                                <div style="font-weight: 600;">${s.name}</div>
                                <div style="font-size: 0.875rem; color: var(--danger);">Kurangi alokasi: ${this.calculator.formatCurrency(s.amount)}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Saldo baru yang disarankan: ${this.calculator.formatCurrency(s.newCurrent)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <p style="margin-top: var(--space-4); font-size: 0.875rem; color: var(--text-muted);">
                        Anda tetap memegang kendali penuh. Ingin menerapkan penyesuaian ini sekarang?
                    </p>
                </div>
            `;
            footerHtml = `
                <button class="btn btn-outline" id="skipRebalance">Tetap Gunakan Saldo Saat Ini</button>
                <button class="btn btn-danger" id="confirmRebalance">Terapkan Penyesuaian</button>
            `;
        } else if (type === 'advice') {
            html = `
                <div class="assistant-advice" style="padding: var(--space-2);">
                    <div style="display: flex; gap: var(--space-4); align-items: flex-start;">
                        <div style="font-size: 2.5rem;">💡</div>
                        <div>
                            <h4 style="margin-bottom: var(--space-2);">Tips Financial Assistant</h4>
                            <p style="line-height: 1.6;">${data}</p>
                        </div>
                    </div>
                </div>
            `;
            footerHtml = `
                <button class="btn btn-primary" id="closeAdvice">Saya Mengerti</button>
            `;
        }

        modalBody.innerHTML = html;
        modalFooter.innerHTML = footerHtml;

        // Add event listeners for buttons
        if (type === 'allocation') {
            const inputs = modalBody.querySelectorAll('.allocation-input');
            const totalDisplay = document.getElementById('assistantTotalAllocated');
            const confirmBtn = document.getElementById('confirmAllocation');
            const warning = document.getElementById('allocationWarning');
            // Use current Available Cash as the limit
            const availableIncome = this.state.finances.availableCash;

            const updateTotal = () => {
                let total = 0;
                inputs.forEach(input => {
                    total += parseInt(input.value) || 0;
                });
                totalDisplay.textContent = this.calculator.formatCurrency(total);

                if (total > availableIncome) {
                    totalDisplay.style.color = 'var(--danger)';
                    confirmBtn.disabled = true;
                    warning.style.display = 'block';
                } else {
                    totalDisplay.style.color = 'inherit';
                    confirmBtn.disabled = false;
                    warning.style.display = 'none';
                }
            };

            inputs.forEach(input => {
                input.addEventListener('input', updateTotal);
            });

            // Initial update
            updateTotal();

            confirmBtn.addEventListener('click', () => {
                const manualData = Array.from(inputs).map(input => ({
                    goalId: input.dataset.goalId,
                    amount: parseInt(input.value) || 0
                }));
                this.applyAssistantAction('manual-allocation', manualData);
            });

            document.getElementById('backToChoice')?.addEventListener('click', () => {
                this.showAssistantModal('allocation-choice', data, totalAmount);
            });
        } else if (type === 'rebalance') {
            document.getElementById('confirmRebalance')?.addEventListener('click', () => {
                this.applyAssistantAction('rebalance', data);
            });
            document.getElementById('skipRebalance')?.addEventListener('click', () => {
                this.uiManager.closeModal('assistantModal');
                this.uiManager.showNotification('Goal tidak diubah. Hati-hati dengan saldo Anda!', 'warning');
            });
        } else if (type === 'advice') {
            document.getElementById('closeAdvice')?.addEventListener('click', () => {
                this.uiManager.closeModal('assistantModal');
            });
        }

        this.uiManager.openModal('assistantModal');
    }

    applyAssistantAction(type, data) {
        if (type === 'allocation') {
            // Original auto-suggestion apply
            data.forEach(s => {
                const goal = this.state.goals.find(g => g.id === s.goalId);
                if (goal) {
                    goal.current = (goal.current || 0) + s.amount;
                    goal.progress = this.calculator.calculateGoalProgress(goal);
                }
            });
            this.uiManager.showNotification('Alokasi goal berhasil diperbarui!', 'success');
        } else if (type === 'manual-allocation') {
            // Applied from inputs
            data.forEach(s => {
                if (s.amount <= 0) return;
                const goal = this.state.goals.find(g => g.id == s.goalId); // Handle string vs number id
                if (goal) {
                    const oldProgress = goal.progress;
                    goal.current = (goal.current || 0) + s.amount;
                    goal.progress = this.calculator.calculateGoalProgress(goal);

                    // Completion notification
                    if (goal.progress >= 100 && oldProgress < 100) {
                        this.uiManager.showNotification(`🎉 Selamat! Goal "${goal.name}" telah terpenuhi!`, 'success');
                    } else if (goal.current > goal.target) {
                        this.uiManager.showNotification(`ℹ️ Alokasi "${goal.name}" melebihi target.`, 'info');
                    }
                }
            });
            this.uiManager.showNotification('Alokasi manual berhasil disimpan!', 'success');
        } else if (type === 'rebalance') {
            data.forEach(s => {
                const goal = this.state.goals.find(g => g.id === s.goalId);
                if (goal) {
                    goal.current = s.newCurrent;
                    goal.progress = this.calculator.calculateGoalProgress(goal);
                }
            });
            this.uiManager.showNotification('Goal berhasil direbalance!', 'success');
        }

        this.dataManager.saveData(true);
        this.uiManager.closeModal('assistantModal');
        this.refreshCurrentView();
    }

    deleteTransaction(type, id) {
        console.log(`🗑️ Soft-deleting ${type} transaction: ${id}`);

        const deleteId = `del_${Date.now()}_${id}`;

        // 1. Find transaction
        const list = type === 'income'
            ? this.state.transactions.income
            : this.state.transactions.expenses;
        const index = list.findIndex(t => t.id == id);

        if (index === -1) {
            console.warn('Transaction not found:', id);
            return;
        }

        const transaction = list[index];

        // 2. Remove from state (soft delete)
        list.splice(index, 1);

        // 3. Store for undo
        const timeout = setTimeout(() => {
            this.confirmDelete(deleteId);
        }, 4000); // 4 second undo window

        this.pendingDeletions.set(deleteId, {
            type,
            transaction,
            timeout,
            index
        });

        // 4. Update UI immediately (show deletion effect)
        this.calculator.calculateFinances();
        this.uiManager.updateUI();
        this.refreshCurrentView();

        // 5. Show undo notification
        this.uiManager.showNotification(
            'Transaksi dihapus',
            'info',
            4000,
            {
                label: 'Undo',
                onClick: () => this.undoDelete(deleteId)
            }
        );
    }

    undoDelete(deleteId) {
        console.log('🔄 Undoing deletion:', deleteId);

        const deletion = this.pendingDeletions.get(deleteId);
        if (!deletion) {
            console.warn('Deletion not found in pending:', deleteId);
            return;
        }

        const { type, transaction, timeout, index } = deletion;

        // 1. Clear timeout
        clearTimeout(timeout);

        // 2. Restore transaction to original position
        const list = type === 'income'
            ? this.state.transactions.income
            : this.state.transactions.expenses;

        // Insert at original index, or at start if index is invalid
        if (index >= 0 && index <= list.length) {
            list.splice(index, 0, transaction);
        } else {
            list.unshift(transaction);
        }

        // 3. Remove from pending deletions
        this.pendingDeletions.delete(deleteId);

        // 4. Recalculate and refresh
        this.calculator.calculateFinances();
        this.uiManager.updateUI();
        this.refreshCurrentView();

        // 5. Show restored notification
        this.uiManager.showNotification('Transaksi dikembalikan', 'success', 2000);
    }

    confirmDelete(deleteId) {
        console.log('✅ Confirming deletion:', deleteId);

        const deletion = this.pendingDeletions.get(deleteId);
        if (!deletion) return;

        // 1. Remove from pending (already removed from state)
        this.pendingDeletions.delete(deleteId);

        // 2. Save data permanently
        this.dataManager.saveData(true);

        // 3. Optional: Show assistant advice
        const { type, transaction } = deletion;
        const advice = this.assistant.getDeletionAdvice(
            type === 'income' ? 'income' : 'expenses',
            transaction.amount
        );
        if (advice) {
            setTimeout(() => {
                this.showAssistantModal('advice', advice);
            }, 500);
        }
    }

    // ====== GOAL MANAGEMENT ======

    addGoal(data) {
        console.log('🎯 Adding new goal:', data);

        const goal = this.dataManager.addGoal(data);

        // Recalculate finances (Allocated vs Available)
        this.calculator.calculateFinances();

        // Update UI (Badges, etc)
        this.uiManager.updateUI();

        this.refreshCurrentView();

        this.uiManager.showNotification('Goal berhasil ditambahkan! 🎯', 'success');

        return goal;
    }

    updateGoal(id, updates) {
        console.log(`🔄 Updating goal ${id}:`, updates);

        const goal = this.dataManager.updateGoal(id, updates);

        if (goal) {
            // Recalculate finances (Allocated vs Available)
            this.calculator.calculateFinances();

            // Update UI (Badges, stats if on dashboard)
            this.uiManager.updateUI(); // Important for global stats

            if (goal.progress >= 100) {
                this.uiManager.showNotification(`🎉 Goal "${goal.name}" tercapai!`, 'success');
            } else {
                this.uiManager.showNotification('Goal diperbarui!', 'success');
            }
            this.refreshCurrentView();
        }

        return goal;
    }

    deleteGoal(id) {
        console.log(`🗑️ Deleting goal: ${id}`);
        this.state.goals = this.state.goals.filter(g => g.id != id);
        this.dataManager.saveData(true);

        // Recalculate finances
        this.calculator.calculateFinances();
        this.uiManager.updateUI();

        this.refreshCurrentView();
        this.uiManager.showNotification('Goal dihapus', 'info');
    }

    // ====== CHECKLIST MANAGEMENT ======

    addChecklistTask(task) {
        const newTask = {
            id: Date.now(),
            task,
            completed: false,
            created: new Date().toISOString()
        };

        this.state.checklist.unshift(newTask);
        this.dataManager.saveData(true);
        this.refreshCurrentView();

        return newTask;
    }

    toggleChecklistTask(id) {
        const taskIndex = this.state.checklist.findIndex(t => t.id === id);

        if (taskIndex !== -1) {
            this.state.checklist[taskIndex].completed = !this.state.checklist[taskIndex].completed;

            if (this.state.checklist[taskIndex].completed) {
                this.state.checklist[taskIndex].completedAt = new Date().toISOString();
            }

            this.dataManager.saveData(true);
            this.refreshCurrentView();
        }
    }

    deleteChecklistTask(id) {
        this.state.checklist = this.state.checklist.filter(t => t.id !== id);
        this.dataManager.saveData(true);
        this.refreshCurrentView();
    }

    // ====== UTILITY METHODS ======

    refreshCurrentView() {
        // STRICT V1.0 POLICY: Single Render Owner
        // App controls rendering via showView. Views do not refresh themselves.
        /*
        const currentView = this.views[this.state.activeTab];
        if (currentView && typeof currentView.refresh === 'function') {
            currentView.refresh();
        }
        */
        if (this.state.activeTab) {
            console.log(`🔄 Force refreshing view: ${this.state.activeTab}`);
            this.showView(this.state.activeTab, { force: true });
        }
    }

    getState() {
        return { ...this.state };
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.dataManager.saveData(true);
    }

    // ====== DELEGATED METHODS ======

    formatCurrency(amount) {
        return this.calculator.formatCurrency(amount);
    }

    formatDate(dateString) {
        return this.uiManager.formatDate(dateString);
    }

    showNotification(message, type = 'info') {
        this.uiManager.showNotification(message, type);
    }

    openModal(modalId) {
        this.uiManager.openModal(modalId);
    }

    closeModal() {
        this.uiManager.closeModal();
    }

    // ====== BUDGET DELEGATION (NO LOGIC) ======
    addBudget(data) {
        return this.dataManager.addBudget(data);
    }

    updateBudget(id, updates) {
        return this.dataManager.updateBudget(id, updates);
    }

    deleteBudget(id) {
        this.dataManager.deleteBudget(id);
    }

    // ====== ACCOUNT DELEGATION (NO LOGIC) ======
    addAccount(data) {
        return this.dataManager.addAccount(data);
    }

    updateAccount(id, updates) {
        return this.dataManager.updateAccount(id, updates);
    }

    deleteAccount(id) {
        this.dataManager.deleteAccount(id);
    }
}

// Initialize app when DOM is ready
let appInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Content Loaded');

    try {
        appInstance = new FinancialApp();

        // Expose app to global scope for HTML onclick handlers
        window.app = appInstance;

        // Expose specific methods for inline event handlers
        // Global handler for Updating Goal (Add Funds)
        window.handleUpdateGoal = (id) => {
            const goal = appInstance.state.goals.find(g => g.id == id);
            if (!goal) return;

            document.getElementById('addFundsGoalId').value = goal.id;
            const available = appInstance.state.finances.availableCash;
            document.getElementById('addFundsAvailableDisplay').textContent = appInstance.calculator.formatCurrency(available);
            document.getElementById('addFundsAmount').max = available; // Html5 validation

            // Add handler for dynamic warning
            const amountInput = document.getElementById('addFundsAmount');
            amountInput.oninput = () => {
                const val = parseInt(amountInput.value) || 0;
                const warning = document.getElementById('addFundsWarning');
                if (val > available) {
                    warning.style.display = 'block';
                    amountInput.style.borderColor = 'var(--danger)';
                } else {
                    warning.style.display = 'none';
                    amountInput.style.borderColor = '';
                }
            };

            appInstance.uiManager.openModal('addFundsModal');
        };

        // Global handler for Editing Goal
        window.handleEditGoal = (id) => {
            const goal = appInstance.state.goals.find(g => g.id == id); // Loose equality match
            if (!goal) return;

            document.getElementById('editGoalId').value = goal.id;
            document.getElementById('editGoalName').value = goal.name;
            document.getElementById('editGoalTarget').value = goal.target;
            document.getElementById('editGoalCurrent').value = goal.current || 0; // Populate current
            document.getElementById('editGoalDeadline').value = goal.deadline;
            document.getElementById('editGoalPriority').value = goal.priority || 2;

            appInstance.uiManager.openModal('editGoalModal');
        };

        // Global handler for Deleting Transactions (Undo Pattern)
        window.handleDeleteTransaction = (type, id) => {
            if (appInstance) {
                appInstance.deleteTransaction(type, id);
            }
        };

        window.handleDuplicateTransaction = (type, id) => {
            if (appInstance && appInstance.formHandlers) {
                appInstance.formHandlers.handleDuplicateTransaction(type, id);
            }
        };

        window.handleDeleteRecurring = (id) => {
            if (confirm('Hentikan transaksi berulang ini?')) {
                if (appInstance && appInstance.recurringManager) {
                    appInstance.recurringManager.deleteRecurring(id);
                    // Refresh Settings UI
                    if (appInstance.state.activeTab === 'settings') {
                        appInstance.refreshCurrentView();
                    }
                }
            }
        };

        console.log('✅ App instance created and exposed globally');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);

        // Show error to user
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <h3>Gagal Memuat Aplikasi</h3>
                    <p style="color: var(--text-muted); margin: 10px 0;">Error: ${error.message}</p>
                    <button onclick="window.location.reload()" 
                            style="margin-top: 20px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        🔄 Muat Ulang
                    </button>
                </div>
            `;
        }
    }
});

// Export for testing (optional)
export default FinancialApp;