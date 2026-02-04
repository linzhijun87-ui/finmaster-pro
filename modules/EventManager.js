/* ====== EVENT MANAGER MODULE ====== */

import { APP_CONFIG } from '../utils/Constants.js';

class EventManager {
    constructor(app) {
        this.app = app;
        this.resizeTimeout = null;
        this.eventHandlers = new Map();
        this.setupChartObserver();
    }

    setupChartObserver() {
        // Observer removed to prevent conflict with View lifecycle
    }

    // ====== EVENT SETUP ======
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

        // Navigation
        this.setupNavigationEvents();

        // Header buttons
        this.setupHeaderEvents();

        // Modal handlers
        this.setupModalEvents();

        // Form submissions
        this.setupFormEvents();

        // Footer buttons
        this.setupFooterEvents();

        // System events
        this.setupSystemEvents();

        // Form validation
        this.setupFormValidation();

        // Window events
        this.setupWindowEvents();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        console.log('✅ Event listeners setup complete');
    }

    // ====== NAVIGATION EVENTS ======
    setupNavigationEvents() {
        const navTabs = this.app.elements.navTabs;
        if (!navTabs) return;

        this.addEventHandler(navTabs, 'click', (e) => {
            const tabButton = e.target.closest('.nav-tab');
            if (!tabButton) return;

            const tab = tabButton.dataset.tab;
            if (tab) {


                this.app.showView(tab);
            }
        });
    }

    // ====== HEADER EVENTS ======
    setupHeaderEvents() {
        // Export Data button (Header) - Export JSON
        if (this.app.elements.exportBtn) {
            this.addEventHandler(this.app.elements.exportBtn, 'click', () => {
                console.log('📤 Exporting all data as JSON...');
                this.app.reportGenerator.exportData('json');
            });
        }

        // Install PWA button
        if (this.app.elements.installBtn && this.app.pwaInstaller) {
            this.addEventHandler(this.app.elements.installBtn, 'click', () => {
                this.app.pwaInstaller.handleInstallClick();
            });
        }

        // Dark mode toggle
        if (this.app.elements.darkModeToggle) {
            this.addEventHandler(this.app.elements.darkModeToggle, 'click', () => {
                this.app.uiManager.toggleDarkMode();
            });
        }
    }

    // ====== MODAL EVENTS ======
    setupModalEvents() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            this.addEventHandler(btn, 'click', () => this.app.uiManager.closeModal());
        });

        // Modal overlay
        if (this.app.elements.modalOverlay) {
            this.addEventHandler(this.app.elements.modalOverlay, 'click', () => this.app.uiManager.closeModal());
        }
    }

    // ====== FORM EVENTS ======
    setupFormEvents() {
        // Expense form
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            this.addEventHandler(expenseForm, 'submit', (e) => {
                e.preventDefault();
                this.handleAddExpense();
            });
        }

        // Income form
        const incomeForm = document.getElementById('incomeForm');
        if (incomeForm) {
            this.addEventHandler(incomeForm, 'submit', (e) => {
                e.preventDefault();
                this.handleAddIncome();
            });
        }

        // Goal form
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            this.addEventHandler(goalForm, 'submit', (e) => {
                e.preventDefault();
                this.handleAddGoal();
            });
        }

        // Edit Goal form
        const editGoalForm = document.getElementById('editGoalForm');
        if (editGoalForm) {
            this.addEventHandler(editGoalForm, 'submit', (e) => {
                e.preventDefault();
                this.handleEditGoalSubmit();
            });
        }

        // Add Funds form
        const addFundsForm = document.getElementById('addFundsForm');
        if (addFundsForm) {
            this.addEventHandler(addFundsForm, 'submit', (e) => {
                e.preventDefault();
                this.handleAddFunds();
            });
        }

        // Delete Goal button
        const deleteGoalBtn = document.getElementById('deleteGoalBtn');
        if (deleteGoalBtn) {
            this.addEventHandler(deleteGoalBtn, 'click', () => {
                const id = document.getElementById('editGoalId').value;
                if (confirm('Apakah Anda yakin ingin menghapus goal ini? Dana yang terkumpul tidak akan hilang.')) {
                    this.app.deleteGoal(id);
                    this.app.uiManager.closeModal('editGoalModal');
                }
            });
        }
    }

    setupFormValidation() {
        // Real-time validation for amount inputs
        this.addEventHandler(document, 'input', (e) => {
            if (e.target.type === 'number' && e.target.id.includes('Amount')) {
                this.app.uiManager.validateAmountInput(e.target);
            }
        });

        // Date validation
        this.addEventHandler(document, 'change', (e) => {
            if (e.target.type === 'date') {
                this.app.uiManager.validateDateInput(e.target);
            }
        });
    }

    // ====== FORM HANDLERS ======
    handleAddExpense() {
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const name = document.getElementById('expenseName')?.value;
        const amount = parseInt(document.getElementById('expenseAmount')?.value) || 0;
        const category = document.getElementById('expenseCategory')?.value;
        const date = document.getElementById('expenseDate')?.value;

        if (!name || !amount || !category || !date) {
            this.app.uiManager.showNotification('Harap isi semua field', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // Check if expense exceeds available cash (buying power)
        // Rule: Prevent Available Cash from ever going negative
        const availableCash = this.app.state.finances.availableCash;
        if (amount > availableCash) {
            alert(`⚠️ WARNING: Saldo Tersedia tidak mencukupi!\n\nAnda memiliki Rp ${this.app.calculator.formatCurrency(availableCash)}, namun pengeluaran ini sebesar Rp ${this.app.calculator.formatCurrency(amount)}.\n\nSistem tidak mengizinkan saldo menjadi negatif. Mohon batalkan atau kurangi alokasi goal Anda terlebih dahulu.`);
            this.app.uiManager.showNotification('Gagal: Saldo tidak mencukupi', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        this.app.addTransaction('expenses', { name, amount, category, date });

        // Reset form
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) expenseForm.reset();

        // Set default date to today
        const dateInput = document.getElementById('expenseDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        // Close modal
        this.app.uiManager.closeModal('addExpenseModal');

        // Re-enable button after short delay
        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 500);
    }

    handleAddIncome() {
        const submitBtn = document.querySelector('#incomeForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const name = document.getElementById('incomeName')?.value;
        const amount = parseInt(document.getElementById('incomeAmount')?.value) || 0;
        const category = document.getElementById('incomeCategory')?.value;
        const date = document.getElementById('incomeDate')?.value;

        if (!name || !amount || !category || !date) {
            this.app.uiManager.showNotification('Harap isi semua field', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (amount < 0) {
            this.app.uiManager.showNotification('Jumlah pendapatan tidak boleh negatif', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        this.app.addTransaction('income', { name, amount, category, date });

        // Reset form
        const incomeForm = document.getElementById('incomeForm');
        if (incomeForm) incomeForm.reset();

        // Set default date to today
        const dateInput = document.getElementById('incomeDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        // Close modal
        this.app.uiManager.closeModal('addIncomeModal');

        // Re-enable button after short delay
        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 500);
    }

    handleAddGoal() {
        const submitBtn = document.querySelector('#goalForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const name = document.getElementById('goalName')?.value;
        const target = parseInt(document.getElementById('goalTarget')?.value) || 0;
        const deadline = document.getElementById('goalDeadline')?.value;
        const current = parseInt(document.getElementById('goalCurrent')?.value) || 0;

        if (!name || !target || !deadline) {
            this.app.uiManager.showNotification('Harap isi semua field yang diperlukan', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (current > target) {
            this.app.uiManager.showNotification('Jumlah saat ini tidak boleh melebihi target', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        this.app.addGoal({ name, target, deadline, current });

        // Reset form
        const goalForm = document.getElementById('goalForm');
        if (goalForm) goalForm.reset();

        // Set default deadline to 3 months from now
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        const dateInput = document.getElementById('goalDeadline');
        if (dateInput) dateInput.value = threeMonthsLater.toISOString().split('T')[0];

        // Close modal
        this.app.uiManager.closeModal('addGoalModal');

        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 500);
    }

    handleEditGoalSubmit() {
        const submitBtn = document.querySelector('#editGoalForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const id = document.getElementById('editGoalId').value;
        const name = document.getElementById('editGoalName').value;
        const target = parseInt(document.getElementById('editGoalTarget').value) || 0;
        const current = parseInt(document.getElementById('editGoalCurrent').value) || 0;
        const deadline = document.getElementById('editGoalDeadline').value;
        const priority = parseInt(document.getElementById('editGoalPriority').value) || 2;

        if (!name || !target || !deadline) {
            this.app.uiManager.showNotification('Harap isi semua field', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // Validate allocation change
        const goal = this.app.state.goals.find(g => g.id == id);
        if (goal) {
            const oldCurrent = goal.current || 0;
            const diff = current - oldCurrent;
            const availableCash = this.app.state.finances.availableCash;

            // If increasing allocation, check if we have enough cash
            if (diff > 0 && diff > availableCash) {
                this.app.uiManager.showNotification(`Dana tidak mencukupi! Kurang: ${this.app.calculator.formatCurrency(diff - availableCash)}`, 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }
        }

        const updates = { name, target, current, deadline, priority };
        this.app.updateGoal(id, updates);
        this.app.uiManager.closeModal('editGoalModal');

        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 500);
    }

    handleAddFunds() {
        const submitBtn = document.querySelector('#addFundsForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const id = document.getElementById('addFundsGoalId').value;
        const amount = parseInt(document.getElementById('addFundsAmount').value) || 0;
        const availableCash = this.app.state.finances.availableCash;

        if (amount <= 0) {
            this.app.uiManager.showNotification('Jumlah harus lebih dari 0', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (amount > availableCash) {
            this.app.uiManager.showNotification('Dana tidak mencukupi!', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // Add funds to goal
        const goal = this.app.state.goals.find(g => g.id == id);
        if (goal) {
            this.app.updateGoal(id, { current: (goal.current || 0) + amount });
            this.app.uiManager.closeModal('addFundsModal');
            document.getElementById('addFundsForm').reset();
        }

        setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 500);
    }

    // ====== FOOTER EVENTS ======
    setupFooterEvents() {
        // Footer links
        document.querySelectorAll('.footer-links a').forEach(link => {
            this.addEventHandler(link, 'click', (e) => {
                e.preventDefault();
                const action = link.dataset.action;
                const tab = link.dataset.tab;

                if (action) {
                    switch (action) {
                        case 'exportReport':
                            this.app.reportGenerator.generatePrintableReport();
                            break;
                        case 'help':
                            this.showHelp();
                            break;
                        case 'tips':
                            this.showTips();
                            break;
                        case 'clearData':
                            this.app.dataManager.clearData();
                            break;
                    }
                } else if (tab) {
                    this.app.showView(tab);
                }
            });
        });

        // Export Report button (Footer) - Printable Report
        if (this.app.elements.exportReport) {
            this.addEventHandler(this.app.elements.exportReport, 'click', () => {
                console.log('📊 Generating printable report...');
                this.app.reportGenerator.generatePrintableReport();
            });
        }

        // Clear Data button
        if (this.app.elements.clearDataBtn) {
            this.addEventHandler(this.app.elements.clearDataBtn, 'click', () => {
                this.app.dataManager.clearData();
            });
        }

        // Help button
        if (this.app.elements.helpBtn) {
            this.addEventHandler(this.app.elements.helpBtn, 'click', () => {
                this.showHelp();
            });
        }

        // Tips button
        if (this.app.elements.tipsBtn) {
            this.addEventHandler(this.app.elements.tipsBtn, 'click', () => {
                this.showTips();
            });
        }
    }

    // ====== SYSTEM EVENTS ======
    setupSystemEvents() {
        // Online/offline detection
        this.addEventHandler(window, 'online', () => this.updateOnlineStatus());
        this.addEventHandler(window, 'offline', () => this.updateOnlineStatus());

        // PWA install prompt
        this.addEventHandler(window, 'beforeinstallprompt', (e) => {
            if (this.app.pwaInstaller) {
                this.app.pwaInstaller.handleBeforeInstallPrompt(e);
            }
        });

        // PWA installed
        this.addEventHandler(window, 'appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.app.uiManager.showNotification('Aplikasi berhasil diinstal! 🎉', 'success');

            if (this.app.elements.installBtn) {
                this.app.elements.installBtn.style.display = 'none';
            }
        });

        // Page visibility
        this.addEventHandler(document, 'visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, refresh data
                setTimeout(() => {
                    this.app.calculator.calculateFinances();
                    this.app.uiManager.updateBadges();
                }, 100);
            }
        });

        // Page visibility - sederhana saja
        this.addEventHandler(document, 'visibilitychange', () => {
            if (!document.hidden && this.app.state.activeTab === 'dashboard') {
                console.log('👁️ Dashboard visible again');

                // Tunggu sebentar lalu update chart jika perlu
                setTimeout(() => {
                    if (this.app.chartManager && this.app.chartManager.chartInstance) {
                        // Update chart data
                        const newData = this.app.chartManager.generateChartData();
                        this.app.chartManager.chartInstance.data = newData;
                        this.app.chartManager.chartInstance.update('none');
                    }
                }, 300);
            }
        });

        // Budget events - refresh budget view when budgets change
        this.addEventHandler(document, 'budget-changed', (e) => {
            console.log('📊 Budget changed:', e.detail);
            if (this.app.state.activeTab === 'budget' && this.app.views.budget) {
                this.app.views.budget.refresh();
            }
        });

        // Expense events - refresh budget view when expenses change
        this.addEventHandler(document, 'expense-changed', (e) => {
            console.log('💸 Expense changed:', e.detail);
            if (this.app.state.activeTab === 'budget' && this.app.views.budget) {
                this.app.views.budget.refresh();
            }
        });

        // Before unload (save data)
        this.addEventHandler(window, 'beforeunload', () => {
            if (this.app.state.settings.autoSave) {
                this.app.dataManager.saveData(true);
            }
        });
    }

    // ====== WINDOW EVENTS ======
    setupWindowEvents() {
        // Header scroll effect
        this.addEventHandler(window, 'scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                if (window.scrollY > 10) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });

        // Resize events
        this.addEventHandler(window, 'resize', () => {
            this.handleResize();
        });

        // Orientation change (mobile)
        this.addEventHandler(window, 'orientationchange', () => {
            setTimeout(() => {
                this.performResizeActions();
            }, 300);
        });

        // Fullscreen change
        this.addEventHandler(document, 'fullscreenchange', () => {
            setTimeout(() => {
                if (this.app.chartManager) {
                    this.app.chartManager.resizeChart();
                }
            }, 200);
        });

        // Initial resize call
        setTimeout(() => {
            this.performResizeActions();
        }, 500);
    }

    // ====== KEYBOARD SHORTCUTS ======
    setupKeyboardShortcuts() {
        this.addEventHandler(document, 'keydown', (e) => {
            // ====== CEK APAKAH USER SEDANG DI INPUT FIELD ======
            const activeElement = document.activeElement;
            const isInputField = activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable;

            // ====== SHORTCUT YANG BOLEH DI MANA SAJA ======
            // Ctrl+S or Cmd+S to save (boleh di input field)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.app.dataManager.saveData();
                this.app.uiManager.showNotification('Data disimpan!', 'success');
                return; // Stop processing
            }

            // Escape to close modals (boleh di input field)
            if (e.key === 'Escape') {
                this.app.uiManager.closeModal();
                // Jangan return, biarkan lanjut ke shortcut lain jika perlu
            }

            // Ctrl+E to export (boleh di input field)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.app.reportGenerator.exportData('json');
                return;
            }

            // ====== SHORTCUT YANG TIDAK BOLEH DI INPUT FIELD ======
            // JANGAN proses shortcut angka jika user sedang di input field
            if (isInputField) {
                return; // Skip semua shortcut non-essential
            }

            // ====== SHORTCUT ANGKA HANYA JIKA BUKAN DI INPUT FIELD ======
            // Number keys for quick navigation (1-6)
            if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
                const tabIndex = parseInt(e.key) - 1;
                const tabs = ['dashboard', 'expenses', 'income', 'checklist', 'simulation', 'settings'];
                if (tabs[tabIndex]) {
                    e.preventDefault();
                    this.app.showView(tabs[tabIndex]);
                }
            }
        });
    }

    // ====== TOUCH EVENTS ======
    setupTouchEvents() {
        if ('ontouchstart' in window) {
            // Add touch feedback
            document.querySelectorAll('button, .btn, .nav-tab').forEach(btn => {
                this.addEventHandler(btn, 'touchstart', function () {
                    this.classList.add('touch-active');
                });

                this.addEventHandler(btn, 'touchend', function () {
                    this.classList.remove('touch-active');
                });
            });
        }
    }

    // ====== RESIZE HANDLING ======
    handleResize() {
        console.log('🔄 Handling window resize...');

        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.performResizeActions();
        }, 250);
    }

    performResizeActions() {
        const windowWidth = window.innerWidth;
        const isMobile = windowWidth < 768;
        const isTablet = windowWidth >= 768 && windowWidth < 1024;
        const isDesktop = windowWidth >= 1024;

        console.log(`📱 Window: ${windowWidth}px (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`);

        // Update UI layout
        this.app.uiManager.performResizeActions();

        // Update PWA button visibility
        if (this.app.pwaInstaller) {
            this.app.pwaInstaller.updateButtonVisibility();
        }
    }

    // ====== MODAL EVENTS ======
    setupModalEvents() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            this.addEventHandler(btn, 'click', () => this.app.uiManager.closeModal());
        });

        // Modal overlay
        if (this.app.elements.modalOverlay) {
            this.addEventHandler(this.app.elements.modalOverlay, 'click', () => this.app.uiManager.closeModal());
        }

        // ====== CUSTOM DATE MODAL ======
        // Gunakan event delegation untuk modal yang dinamis
        this.addEventHandler(document, 'click', (e) => {
            // Apply custom filter button
            if (e.target.closest('#applyCustomFilter')) {
                e.preventDefault();
                this.handleApplyCustomFilter();
            }

            // Cancel custom modal button
            if (e.target.closest('#cancelCustomModal')) {
                e.preventDefault();
                this.app.uiManager.closeModal('customDateModal');
            }
        });

        // Event untuk input di modal custom date
        this.addEventHandler(document, 'change', (e) => {
            if (e.target.id === 'customStartDate' || e.target.id === 'customEndDate') {
                this.validateCustomDateRange();
            }
        });
    }

    // ====== CUSTOM DATE FILTER HANDLER ======
    handleApplyCustomFilter() {
        const startDate = document.getElementById('customStartDate')?.value;
        const endDate = document.getElementById('customEndDate')?.value;
        const groupBy = document.getElementById('customGroupBy')?.value;

        console.log('🔍 Applying custom filter:', { startDate, endDate, groupBy });

        if (!startDate || !endDate) {
            this.app.uiManager.showNotification('Pilih tanggal mulai dan akhir', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.app.uiManager.showNotification('Tanggal mulai tidak boleh setelah tanggal akhir', 'error');
            return;
        }

        // Update chart melalui ChartManager
        if (this.app.chartManager) {
            this.app.chartManager.currentPeriod = 'custom';
            this.app.chartManager.customPeriod = { startDate, endDate, groupBy };
            this.app.chartManager.updateChart();

            // Update active button
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.period === 'custom') {
                    btn.classList.add('active');
                }
            });

            this.app.uiManager.closeModal('customDateModal');
            this.app.uiManager.showNotification(`Filter custom diterapkan (${groupBy})`, 'success');
        }
    }

    validateCustomDateRange() {
        const startDate = document.getElementById('customStartDate')?.value;
        const endDate = document.getElementById('customEndDate')?.value;

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            document.getElementById('customStartDate').classList.add('error');
            document.getElementById('customEndDate').classList.add('error');
            return false;
        }

        document.getElementById('customStartDate')?.classList.remove('error');
        document.getElementById('customEndDate')?.classList.remove('error');
        return true;
    }

    // ====== UTILITY METHODS ======
    addEventHandler(element, event, handler) {
        element.addEventListener(event, handler);

        // Store handler for cleanup
        const key = `${event}-${element.tagName}`;
        if (!this.eventHandlers.has(key)) {
            this.eventHandlers.set(key, []);
        }
        this.eventHandlers.get(key).push({ element, event, handler });
    }

    removeEventHandlers() {
        for (const [key, handlers] of this.eventHandlers) {
            handlers.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        }
        this.eventHandlers.clear();
    }

    updateOnlineStatus() {
        this.app.uiManager.updateOnlineStatus();
    }

    showHelp() {
        this.app.uiManager.showNotification('Bantuan dan dokumentasi sedang disiapkan', 'info');
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
        this.app.uiManager.showNotification(randomTip, 'info');
    }

    // ====== CLEANUP ======
    cleanup() {
        this.removeEventHandlers();

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
    }
}

export default EventManager;