/* ====== DATA MANAGER MODULE ====== */

import { APP_CONFIG, CATEGORIES } from '../utils/Constants.js';

class DataManager {
    constructor(app) {
        this.app = app;
        this.storageKey = APP_CONFIG.STORAGE_KEY;
        this.maxStorageSize = APP_CONFIG.MAX_STORAGE_SIZE;
    }

    // ====== LOAD DATA ======
    loadData() {
        try {
            console.log('📁 Loading data from localStorage...');

            const savedData = localStorage.getItem(this.storageKey);

            if (savedData) {
                const parsed = JSON.parse(savedData);

                // Merge with default state
                const mergedSettings = {
                    ...this.app.state.settings,
                    ...(parsed.settings || {})
                };

                // Preserve joinedDate or set it to now if not present
                const mergedUser = {
                    ...this.app.state.user,
                    ...(parsed.user || {}),
                    joinedDate: parsed.user?.joinedDate || new Date().toISOString()
                };

                this.app.state = {
                    ...this.app.state,
                    ...parsed,
                    budgets: parsed.budgets || [], // Budget data with fallback
                    accounts: parsed.accounts || [], // Account data with fallback
                    user: mergedUser,
                    settings: mergedSettings,
                    activeTab: this.app.state.activeTab,
                    isLoading: false
                };

                console.log('✅ Data loaded from localStorage');
                this.updateStorageStatus('Local Storage');
            } else {
                // Use sample data for first-time users
                this.loadSampleData();
                this.updateStorageStatus('Sample Data');
            }

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        console.log('📊 Loading sample data...');

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];

        this.app.state.transactions = {
            income: [
                {
                    id: 1,
                    name: 'Gaji Bulanan',
                    amount: 8500000,
                    category: 'gaji',
                    date: today,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Freelance Project',
                    amount: 2500000,
                    category: 'freelance',
                    date: lastMonth,
                    createdAt: new Date().toISOString()
                }
            ],
            expenses: [
                {
                    id: 1,
                    name: 'Belanja Bulanan',
                    amount: 2100000,
                    category: 'kebutuhan',
                    date: today,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Bensin Mobil',
                    amount: 450000,
                    category: 'transport',
                    date: lastMonth,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Netflix Subscription',
                    amount: 120000,
                    category: 'hiburan',
                    date: lastMonth,
                    createdAt: new Date().toISOString()
                }
            ]
        };

        this.app.state.goals = [
            {
                id: 1,
                name: 'DP Rumah',
                target: 100000000,
                current: 45000000,
                deadline: '2026-01-01',
                progress: 45,
                created: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Liburan Japan',
                target: 25000000,
                current: 18000000,
                deadline: '2026-01-01',
                progress: 72,
                created: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Emergency Fund',
                target: 50000000,
                current: 45000000,
                deadline: '2026-01-01',
                progress: 99,
                created: new Date().toISOString()
            }
        ];

        this.app.state.checklist = [
            {
                id: 1,
                task: 'Bayar listrik bulanan',
                completed: true,
                created: new Date().toISOString(),
                completedAt: new Date().toISOString()
            },
            {
                id: 2,
                task: 'Transfer tabungan',
                completed: false,
                created: new Date().toISOString()
            },
            {
                id: 3,
                task: 'Review budget mingguan',
                completed: false,
                created: new Date().toISOString()
            }
        ];

        this.app.state.isLoading = false;

        // Save sample data
        this.saveData(true);
        console.log('✅ Sample data loaded');
    }

    // ====== SAVE DATA ======
    saveData(silent = false) {
        try {
            // Don't save UI state
            const dataToSave = {
                user: this.app.state.user,
                finances: this.app.state.finances,
                transactions: this.app.state.transactions,
                goals: this.app.state.goals,
                checklist: this.app.state.checklist,
                budgets: this.app.state.budgets || [], // Budget data
                accounts: this.app.state.accounts || [], // Account data
                settings: this.app.state.settings
            };

            const dataString = JSON.stringify(dataToSave);

            // Check data size
            const dataSize = new Blob([dataString]).size;

            if (dataSize > this.maxStorageSize) {
                this.app.uiManager.showNotification('Data terlalu besar, membersihkan data lama...', 'warning');
                this.cleanupOldData();
                return this.saveData(silent);
            }

            localStorage.setItem(this.storageKey, dataString);
            console.log('💾 Data saved to localStorage');

            if (!silent) {
                this.app.uiManager.showNotification('Data tersimpan!', 'success');
            }

            // Update storage status
            this.updateStorageStatus(`Local (${(dataSize / 1024).toFixed(2)} KB)`);

        } catch (error) {
            console.error('❌ Error saving data:', error);

            if (error.name === 'QuotaExceededError') {
                this.app.uiManager.showNotification('Penyimpanan penuh, membersihkan data lama...', 'warning');
                this.cleanupOldData();
                this.saveData(silent);
            } else {
                this.app.uiManager.showNotification('Gagal menyimpan data', 'error');
            }
        }
    }

    cleanupOldData() {
        // Keep only transactions from last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        this.app.state.transactions.income = this.app.state.transactions.income.filter(t => {
            try {
                return new Date(t.date) > sixMonthsAgo;
            } catch {
                return false;
            }
        });

        this.app.state.transactions.expenses = this.app.state.transactions.expenses.filter(t => {
            try {
                return new Date(t.date) > sixMonthsAgo;
            } catch {
                return false;
            }
        });

        this.app.uiManager.showNotification('Data lama telah dibersihkan', 'info');
    }

    // ====== CLEAR DATA ======
    clearData() {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            localStorage.removeItem(this.storageKey);
            this.loadSampleData();
            this.app.calculator.calculateFinances();
            this.app.uiManager.updateUI();
            this.app.uiManager.showNotification('Semua data telah direset', 'warning');
        }
    }

    // ====== TRANSACTION MANAGEMENT ======
    addTransaction(type, data) {
        const id = Date.now();
        const transaction = {
            id,
            name: data.name,
            amount: data.amount,
            category: data.category,
            account: data.account || '', // Account name (NEW)
            accountId: data.accountId || null, // Account ID (NEW)
            date: data.date || new Date().toISOString().split('T')[0],
            note: data.note || '',
            createdAt: new Date().toISOString()
        };

        this.app.state.transactions[type].push(transaction);
        this.saveData(true);

        // NO balance updates - balances are derived

        // Emit account-changed for balance recalculation in views
        if (transaction.accountId) {
            document.dispatchEvent(new CustomEvent('account-changed', {
                detail: { action: 'transaction-added', accountId: transaction.accountId }
            }));
        }

        console.log(`✅ ${type} added:`, transaction);
        return transaction;
    }

    deleteTransaction(type, id) {
        this.app.state.transactions[type] = this.app.state.transactions[type].filter(item => item.id !== id);
        this.saveData(true);
        console.log(`🗑️ ${type} transaction deleted: ${id}`);
    }

    // ====== GOAL MANAGEMENT ======
    addGoal(data) {
        const id = Date.now();
        const progress = data.current ? Math.round((data.current / data.target) * 100) : 0;

        const goal = {
            id,
            ...data,
            progress,
            created: new Date().toISOString()
        };

        this.app.state.goals.push(goal);
        this.saveData(true);

        console.log('✅ Goal added:', goal);
        return goal;
    }

    updateGoal(id, updates) {
        const goalIndex = this.app.state.goals.findIndex(g => g.id === id);

        if (goalIndex !== -1) {
            const goal = { ...this.app.state.goals[goalIndex], ...updates };

            // Recalculate progress if current amount changed
            if (updates.current !== undefined) {
                goal.progress = Math.round((goal.current / goal.target) * 100);
            }

            this.app.state.goals[goalIndex] = goal;
            this.saveData(true);

            console.log('✅ Goal updated:', goal);
            return goal;
        }

        return null;
    }

    // ====== CHECKLIST MANAGEMENT ======
    addChecklistTask(taskData) {
        const id = Date.now();
        const task = {
            id,
            task: taskData,
            completed: false,
            created: new Date().toISOString()
        };

        this.app.state.checklist.unshift(task);
        this.saveData(true);

        return task;
    }

    toggleChecklistTask(id) {
        const taskIndex = this.app.state.checklist.findIndex(t => t.id === id);

        if (taskIndex !== -1) {
            this.app.state.checklist[taskIndex].completed = !this.app.state.checklist[taskIndex].completed;

            if (this.app.state.checklist[taskIndex].completed) {
                this.app.state.checklist[taskIndex].completedAt = new Date().toISOString();
            } else {
                delete this.app.state.checklist[taskIndex].completedAt;
            }

            this.saveData(true);
            return true;
        }

        return false;
    }

    deleteChecklistTask(id) {
        this.app.state.checklist = this.app.state.checklist.filter(t => t.id !== id);
        this.saveData(true);
    }

    // ====== BUDGET MANAGEMENT ======
    addBudget(data) {
        const id = Date.now();
        const now = new Date();
        const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const budget = {
            id,
            name: data.name,
            amount: data.amount,
            category: data.category,
            duration: data.duration || 'monthly', // 'monthly', 'weekly', 'yearly'
            lastResetAt: now.toISOString(),
            periodKey: periodKey, // For sync-safe reset detection
            created: now.toISOString()
            // NOTE: NO 'spent' field - derived from transactions via FinanceCalculator
        };

        this.app.state.budgets.push(budget);
        this.saveData(true);

        // Emit event for views to update
        document.dispatchEvent(new CustomEvent('budget-changed', {
            detail: { action: 'add', budget }
        }));

        console.log('✅ Budget added:', budget);
        return budget;
    }

    updateBudget(id, updates) {
        const budgetIndex = this.app.state.budgets.findIndex(b => b.id == id);

        if (budgetIndex !== -1) {
            const budget = { ...this.app.state.budgets[budgetIndex], ...updates };
            this.app.state.budgets[budgetIndex] = budget;
            this.saveData(true);

            // Emit event
            document.dispatchEvent(new CustomEvent('budget-changed', {
                detail: { action: 'update', budget }
            }));

            console.log('✅ Budget updated:', budget);
            return budget;
        }

        return null;
    }

    deleteBudget(id) {
        const budget = this.app.state.budgets.find(b => b.id == id);
        this.app.state.budgets = this.app.state.budgets.filter(b => b.id != id);
        this.saveData(true);

        // Emit event
        document.dispatchEvent(new CustomEvent('budget-changed', {
            detail: { action: 'delete', budgetId: id }
        }));

        console.log('🗑️ Budget deleted:', id);
    }

    // ====== SYNC-SAFE BUDGET RESET LOGIC ======
    checkBudgetResets() {
        if (!this.app.state.budgets || this.app.state.budgets.length === 0) {
            return 0;
        }

        const now = new Date();
        const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let resetsPerformed = 0;

        this.app.state.budgets.forEach(budget => {
            // Only auto-reset monthly budgets
            if (budget.duration !== 'monthly') return;

            // Check if period key changed (new month)
            if (budget.periodKey !== currentPeriodKey) {
                console.log(`🔄 Resetting monthly budget: ${budget.name}`);
                // Update period tracking (NO spent field to reset)
                budget.lastResetAt = now.toISOString();
                budget.periodKey = currentPeriodKey;
                resetsPerformed++;
            }
        });

        if (resetsPerformed > 0) {
            this.saveData(true);

            if (this.app.uiManager) {
                this.app.uiManager.showNotification(
                    `🔄 ${resetsPerformed} budget bulanan telah direset`,
                    'info'
                );
            }

            // Emit event
            document.dispatchEvent(new CustomEvent('budget-changed', {
                detail: { action: 'reset', count: resetsPerformed }
            }));
        }

        return resetsPerformed;
    }

    // ====== IMPORT/EXPORT ======
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);

                    // Validate imported data
                    if (importedData && importedData.transactions) {
                        this.app.state = {
                            ...this.app.state,
                            ...importedData,
                            activeTab: this.app.state.activeTab
                        };

                        this.app.calculator.calculateFinances();
                        this.app.uiManager.updateUI();
                        this.app.showView(this.app.state.activeTab);
                        this.saveData();

                        this.app.uiManager.showNotification('Data berhasil diimport!', 'success');
                    } else {
                        this.app.uiManager.showNotification('Format data tidak valid', 'error');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    this.app.uiManager.showNotification('Gagal membaca file', 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    // ====== UTILITY METHODS ======
    updateStorageStatus(status) {
        const storageStatusElement = document.getElementById('storageStatus');
        if (storageStatusElement) {
            storageStatusElement.textContent = status;
        }
    }

    getCategoryName(category) {
        if (CATEGORIES.income[category]) return CATEGORIES.income[category];
        if (CATEGORIES.expenses[category]) return CATEGORIES.expenses[category];
        return category;
    }

    getAllCategories() {
        return {
            ...CATEGORIES.income,
            ...CATEGORIES.expenses
        };
    }

    getDataStats() {
        const dataString = JSON.stringify(this.app.state);
        const sizeKB = (new Blob([dataString]).size / 1024).toFixed(2);

        return {
            sizeKB: sizeKB,
            totalTransactions: this.app.state.transactions.income.length + this.app.state.transactions.expenses.length,
            totalGoals: this.app.state.goals.length,
            totalChecklist: this.app.state.checklist.length
        };
    }

    // ====== ACCOUNT MANAGEMENT (NO BALANCE PERSISTENCE) ======

    addAccount(data) {
        const id = Date.now();
        const now = new Date();

        const account = {
            id,
            name: data.name,
            type: data.type || 'bank',
            initialBalance: parseInt(data.initialBalance) || 0,
            note: data.note || '',
            active: true,
            created: now.toISOString()
            // STRICT: NO currentBalance. Balances are fully derived.
        };

        this.app.state.accounts.push(account);
        this.saveData(true);

        document.dispatchEvent(new CustomEvent('account-changed', {
            detail: { action: 'add', account }
        }));

        console.log('✅ Account added:', account);
        return account;
    }

    updateAccount(id, updates) {
        const accountIndex = this.app.state.accounts.findIndex(a => a.id == id);

        if (accountIndex !== -1) {
            // STRICT: prevent updating restricted fields or adding unknowns
            const currentAccount = this.app.state.accounts[accountIndex];

            const updatedAccount = {
                ...currentAccount,
                name: updates.name !== undefined ? updates.name : currentAccount.name,
                type: updates.type !== undefined ? updates.type : currentAccount.type,
                initialBalance: updates.initialBalance !== undefined ? parseInt(updates.initialBalance) : currentAccount.initialBalance,
                note: updates.note !== undefined ? updates.note : currentAccount.note,
                active: updates.active !== undefined ? updates.active : currentAccount.active
            };

            // Remove any potential 'currentBalance' if it snuck in
            delete updatedAccount.currentBalance;

            this.app.state.accounts[accountIndex] = updatedAccount;
            this.saveData(true);

            document.dispatchEvent(new CustomEvent('account-changed', {
                detail: { action: 'update', account: updatedAccount }
            }));

            console.log('✅ Account updated:', updatedAccount);
            return updatedAccount;
        }

        return null;
    }

    deleteAccount(id) {
        // Check if account is referenced by transactions
        const hasTransactions = this.isAccountReferenced(id);

        if (hasTransactions) {
            // Soft delete - mark as inactive
            return this.updateAccount(id, { active: false });
        } else {
            // Hard delete
            this.app.state.accounts = this.app.state.accounts.filter(a => a.id != id);
            this.saveData(true);

            document.dispatchEvent(new CustomEvent('account-changed', {
                detail: { action: 'delete', accountId: id }
            }));

            console.log('🗑️ Account deleted:', id);
        }
    }

    isAccountReferenced(accountId) {
        const inExpenses = this.app.state.transactions.expenses.some(e => e.accountId == accountId);
        const inIncome = this.app.state.transactions.income.some(i => i.accountId == accountId);
        return inExpenses || inIncome;
    }

    // ====== BACKUP & RESTORE ======

    /**
     * Exports all application data for backup
     * @returns {Object} Complete application state
     */
    exportData() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: this.app.state.settings,
            user: this.app.state.user,
            accounts: this.app.state.accounts,
            budgets: this.app.state.budgets,
            transactions: this.app.state.transactions,
            goals: this.app.state.goals,
            // Add any other state slices here
        };
        return data;
    }

    /**
     * Imports data from a backup file
     * @param {Object} data - The parsed JSON data from backup
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            // 1. Basic Schema Validation
            if (!data || !data.user || !data.accounts || !data.transactions) {
                throw new Error('Invalid backup file: Missing core data.');
            }

            // 2. Create New State (Merge Strategy: Replace)
            // We want to restore exactly what was in the backup
            const newState = {
                ...this.app.state,
                settings: data.settings || this.app.state.settings,
                user: data.user, // User profile
                accounts: data.accounts || [],
                budgets: data.budgets || [],
                transactions: data.transactions || { expenses: [], income: [] },
                goals: data.goals || [],
                isLoading: false
            };

            // 3. Save to Storage
            this.app.state = newState;
            this.saveData(); // Persist immediately

            // 4. Update Runtime (Notify App)
            console.log('✅ Data imported successfully');

            // Note: Caller (BackupManager) handles reload
            return true;

        } catch (error) {
            console.error('Import failed:', error);
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}

export default DataManager;