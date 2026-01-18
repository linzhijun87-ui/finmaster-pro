/* ====== FINANCIAL MASTERPLAN PRO - MAIN APP ENTRY POINT ====== */

// Import modules
import DataManager from './modules/DataManager.js';
import FinanceCalculator from './modules/FinanceCalculator.js';
import UIManager from './modules/UIManager.js';
import ChartManager from './modules/ChartManager.js';
import ReportGenerator from './modules/ReportGenerator.js';
import EventManager from './modules/EventManager.js';
import PWAInstaller from './modules/PWAInstaller.js';

// Import views
import DashboardView from './views/DashboardView.js';
import ExpensesView from './views/ExpensesView.js';
import IncomeView from './views/IncomeView.js';
import ChecklistView from './views/ChecklistView.js';
import SimulationView from './views/SimulationView.js';
import SettingsView from './views/SettingsView.js';

// Import constants
import { APP_CONFIG } from './utils/Constants.js';

class FinancialApp {
    constructor() {
        console.log('🚀 Initializing Financial Masterplan PRO v2.1');

        // Initialize state
        this.state = {
            user: {
                name: 'Ferdiansyah Lim',
                avatar: 'FL',
                isPremium: true
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
            settings: {
                currency: 'IDR',
                theme: 'auto',
                notifications: true,
                autoSave: true
            },
            activeTab: 'dashboard',
            isLoading: true,
            isChartReady: false
        };

        // DOM Elements cache
        this.elements = {};

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
        this.reportGenerator = new ReportGenerator(this);
        this.eventManager = new EventManager(this);
        this.pwaInstaller = new PWAInstaller(this);

        // View modules
        this.views = {
            dashboard: new DashboardView(this),
            expenses: new ExpensesView(this),
            income: new IncomeView(this),
            checklist: new ChecklistView(this),
            simulation: new SimulationView(this),
            settings: new SettingsView(this)
        };

        console.log('✅ All modules initialized');
    }

    init() {
        console.log('🚀 Starting app initialization...');

        // Cache DOM elements
        this.cacheElements();

        // Load saved data
        this.dataManager.loadData();

        // Setup event listeners
        this.eventManager.setupEventListeners();

        // Setup PWA
        this.pwaInstaller.initialize();

        // Apply theme
        this.uiManager.applyTheme();

        // Calculate initial finances
        this.calculator.calculateFinances();

        // Update UI
        this.uiManager.updateUI();

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

    showView(viewName) {
        console.log(`🔀 Switching to view: ${viewName}`);

        // Don't switch if already on this view
        if (this.state.activeTab === viewName && !this.state.isLoading) {
            console.log(`ℹ️ Already on ${viewName} view, refreshing...`);
            this.refreshCurrentView();
            return;
        }

        const switchContent = () => {
            // Update state
            this.state.activeTab = viewName;
            this.state.isLoading = true;

            // Update navigation
            this.uiManager.updateNavigation(viewName);

            // Render view
            if (this.elements.mainContent) {
                // Add entrance animation class for the new view container
                this.elements.mainContent.className = 'main-content page-entrance';
            }

            try {
                if (this.views[viewName]) {
                    this.views[viewName].render();
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

        // Update chart if on dashboard
        if (this.state.activeTab === 'dashboard' && this.chartManager) {
            this.chartManager.updateChart();
        }

        // Update current view
        this.refreshCurrentView();

        // Show notification
        this.uiManager.showNotification(
            `${type === 'income' ? 'Pendapatan' : 'Pengeluaran'} berhasil ditambahkan!`,
            'success'
        );

        return transaction;
    }

    deleteTransaction(type, id) {
        console.log(`🗑️ Deleting ${type} transaction: ${id}`);

        this.dataManager.deleteTransaction(type, id);
        this.calculator.calculateFinances();
        this.uiManager.updateUI();
        this.refreshCurrentView();

        this.uiManager.showNotification('Transaksi dihapus', 'info');
    }

    // ====== GOAL MANAGEMENT ======

    addGoal(data) {
        console.log('🎯 Adding new goal:', data);

        const goal = this.dataManager.addGoal(data);
        this.refreshCurrentView();

        this.uiManager.showNotification('Goal berhasil ditambahkan! 🎯', 'success');

        return goal;
    }

    updateGoal(id, updates) {
        console.log(`🔄 Updating goal ${id}:`, updates);

        const goal = this.dataManager.updateGoal(id, updates);

        if (goal) {
            this.refreshCurrentView();
            this.uiManager.showNotification('Goal diperbarui!', 'success');
        }

        return goal;
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
        const currentView = this.views[this.state.activeTab];
        if (currentView && typeof currentView.refresh === 'function') {
            currentView.refresh();
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
        window.handleUpdateGoal = (goalId) => {
            if (appInstance) {
                const goal = appInstance.state.goals.find(g => g.id === goalId);
                if (goal) {
                    const amount = prompt('Masukkan jumlah tambahan dana:', '0');
                    if (amount && !isNaN(parseInt(amount))) {
                        const newCurrent = goal.current + parseInt(amount);
                        appInstance.updateGoal(goalId, { current: newCurrent });
                    }
                }
            }
        };

        window.handleDeleteTransaction = (type, id) => {
            if (appInstance) {
                appInstance.deleteTransaction(type, id);
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