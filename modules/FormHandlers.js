/* ====== FORM HANDLERS MODULE ======
 * Complete working JavaScript for Income Form, Goals, and Dashboard updates.
 * This module provides all event handling with:
 * - Double-click prevention
 * - Input validation (no negatives, required fields)
 * - Real-time UI updates
 * - Modal auto-close and form reset
 */

class FormHandlers {
    constructor(app) {
        this.app = app;
    }

    /**
     * Initialize all form event listeners
     * Call this after DOM is ready
     */
    initialize() {
        console.log('🔧 FormHandlers: Initializing...');
        this.setupIncomeForm();
        this.setupExpenseForm(); // Expense Handling
        this.setupAccountForm(); // Account Handling
        this.setupEditAccountForm(); // Edit Account Handling
        this.setupGoalForm();
        this.setupEditGoalForm();
        this.setupAddFundsForm();
        this.setupBudgetForm(); // Budget forms
        this.setupEditBudgetForm(); // Budget edit form
        this.populateCategoryDropdowns(); // Populate categories on load
        console.log('✅ FormHandlers: All handlers ready');
    }

    /**
     * Populate category dropdowns dynamically from CategoryManager
     */
    populateCategoryDropdowns() {
        // Expense categories
        const expenseCategorySelect = document.getElementById('expenseCategory');
        if (expenseCategorySelect && this.app.categoryManager) {
            const expenseCategories = this.app.categoryManager.getCategoriesByType('expense');
            expenseCategorySelect.innerHTML = expenseCategories.map(cat =>
                `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`
            ).join('');
        }

        // Income categories
        const incomeCategorySelect = document.getElementById('incomeCategory');
        if (incomeCategorySelect && this.app.categoryManager) {
            const incomeCategories = this.app.categoryManager.getCategoriesByType('income');
            incomeCategorySelect.innerHTML = incomeCategories.map(cat =>
                `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`
            ).join('');
        }

        // Budget categories (expense only)
        const budgetCategorySelects = document.querySelectorAll('#budgetCategory');
        budgetCategorySelects.forEach(select => {
            if (this.app.categoryManager) {
                const expenseCategories = this.app.categoryManager.getCategoriesByType('expense');
                select.innerHTML = expenseCategories.map(cat =>
                    `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`
                ).join('');
            }
        });

        console.log('✅ Category dropdowns populated');
    }

    // ============================
    // INCOME FORM HANDLING
    // ============================

    setupIncomeForm() {
        const form = document.getElementById('incomeForm');
        if (!form) {
            console.warn('Income form not found');
            return;
        }

        // Remove any existing listeners by cloning
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleIncomeSubmit();
        });

        console.log('✅ Income form handler attached');
    }

    handleIncomeSubmit() {
        // 1. Get submit button and disable immediately
        const submitBtn = document.querySelector('#incomeForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return; // Already processing
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        // 2. Get input values
        const nameInput = document.getElementById('incomeName');
        const amountInput = document.getElementById('incomeAmount');
        const categoryInput = document.getElementById('incomeCategory');
        const accountInput = document.getElementById('incomeAccount');
        const dateInput = document.getElementById('incomeDate');

        const name = nameInput?.value?.trim();
        const amount = parseInt(amountInput?.value) || 0;
        const category = categoryInput?.value;
        const accountId = parseInt(accountInput?.value);
        const date = dateInput?.value;

        // 3. Validate inputs
        if (!name || !category || !date || !accountId) {
            this.showError('Harap isi semua field termasuk Akun Tujuan');
            this.resetButton(submitBtn, '💰 Simpan Pendapatan');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah pendapatan harus lebih dari 0');
            this.resetButton(submitBtn, '💰 Simpan Pendapatan');
            return;
        }

        const account = this.app.state.accounts.find(a => a.id == accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            this.resetButton(submitBtn, '💰 Simpan Pendapatan');
            return;
        }

        // 4. Create transaction object
        const transaction = {
            id: Date.now(),
            name: name,
            amount: amount,
            category: category,
            account: account.name,
            accountId: accountId,
            date: date,
            createdAt: new Date().toISOString()
        };

        // 5. Add to state
        this.app.state.transactions.income.unshift(transaction);

        // 6. Recalculate finances
        this.app.calculator.calculateFinances();

        // 7. Save data
        this.app.dataManager.saveData(true);

        // 8. Update UI immediately
        this.updateDashboardStats();
        this.updateIncomeList();

        // 9. Show success
        this.showSuccess('Pendapatan berhasil ditambahkan!');

        // 10. Reset form
        const form = document.getElementById('incomeForm');
        if (form) form.reset();

        // 11. Set default date to today
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // 12. Close modal
        this.app.uiManager.closeModal('addIncomeModal');

        // 13. Re-enable button after delay
        setTimeout(() => {
            this.resetButton(submitBtn, '💰 Simpan Pendapatan');
        }, 300);

        // 14. Refresh current view if on income tab
        if (this.app.state.activeTab === 'income') {
            this.app.refreshCurrentView();
        }

        // 15. Trigger assistant suggestions
        this.app.handleAssistantSuggestions('income', amount);
    }

    // ============================
    // EXPENSE FORM HANDLING
    // ============================

    setupExpenseForm() {
        const form = document.getElementById('expenseForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleExpenseSubmit();
        });

        console.log('✅ Expense form handler attached');
    }

    handleExpenseSubmit() {
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const name = document.getElementById('expenseName')?.value?.trim();
        const amount = parseInt(document.getElementById('expenseAmount')?.value) || 0;
        const category = document.getElementById('expenseCategory')?.value;
        const accountId = parseInt(document.getElementById('expenseAccount')?.value);
        const date = document.getElementById('expenseDate')?.value;

        if (!name || !category || !date || !accountId) {
            this.showError('Harap isi semua field termasuk Akun Sumber Dana');
            this.resetButton(submitBtn, '💸 Simpan Pengeluaran');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah harus lebih dari 0');
            this.resetButton(submitBtn, '💸 Simpan Pengeluaran');
            return;
        }

        const account = this.app.state.accounts.find(a => a.id == accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            this.resetButton(submitBtn, '💸 Simpan Pengeluaran');
            return;
        }

        // Check balance (optional strictly, but good for UX)
        const currentBalance = this.app.calculator.calculateAccountBalance(account);
        if (amount > currentBalance) {
            if (!confirm(`Saldo akun ${account.name} mungkin tidak cukup (${this.app.calculator.formatCurrency(currentBalance)}). Tetap lanjutkan?`)) {
                this.resetButton(submitBtn, '💸 Simpan Pengeluaran');
                return;
            }
        }

        const transaction = {
            name,
            amount,
            category,
            account: account.name,
            accountId, // Store ID
            date
        };

        this.app.dataManager.addTransaction('expenses', transaction);
        this.app.calculator.calculateFinances();

        // Update budget spending
        // (Handled by FinanceCalculator via derived transactions)

        this.updateDashboardStats();
        // Update Expense List if visible
        // (Requires specific View update or refresh)
        if (this.app.state.activeTab === 'expenses') {
            this.app.refreshCurrentView();
        }

        this.showSuccess('Pengeluaran berhasil disimpan!');
        document.getElementById('expenseForm').reset();
        this.app.uiManager.closeModal('addExpenseModal');

        setTimeout(() => {
            this.resetButton(submitBtn, '💸 Simpan Pengeluaran');
        }, 300);
    }

    // ============================
    // ACCOUNT FORM HANDLING
    // ============================

    setupAccountForm() {
        const form = document.getElementById('addAccountForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAccountSubmit();
        });
        console.log('✅ Account form handler attached');
    }

    handleAccountSubmit() {
        const submitBtn = document.querySelector('#addAccountForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const name = document.getElementById('accountName')?.value?.trim();
        const type = document.getElementById('accountType')?.value;
        const initialBalance = document.getElementById('accountInitialBalance')?.value; // keep as string for parsing in manager
        const note = document.getElementById('accountNote')?.value;

        if (!name) {
            this.showError('Nama akun wajib diisi');
            this.resetButton(submitBtn, '💾 Simpan Akun');
            return;
        }

        this.app.dataManager.addAccount({ name, type, initialBalance, note });

        // Finances updated via event listener in app potentially, or verify need to recalc
        this.app.calculator.calculateFinances();

        this.showSuccess('Akun berhasil ditambahkan!');
        document.getElementById('addAccountForm').reset();
        this.app.uiManager.closeModal('addAccountModal');

        // Explicitly update account selectors everywhere
        this.app.uiManager.populateAccountSelect('.account-select');

        // Refresh Settings View if active
        if (this.app.state.activeTab === 'settings') {
            this.app.refreshCurrentView();
        }

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Akun');
        }, 300);
    }

    setupEditAccountForm() {
        const form = document.getElementById('editAccountForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditAccountSubmit();
        });

        // Delete button
        const deleteBtn = document.getElementById('deleteAccountBtn');
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            newDeleteBtn.addEventListener('click', () => {
                this.handleDeleteAccount();
            });
        }
    }

    handleEditAccountSubmit() {
        const id = document.getElementById('editAccountId')?.value;
        const name = document.getElementById('editAccountName')?.value?.trim();
        const type = document.getElementById('editAccountType')?.value;
        const initialBalance = document.getElementById('editAccountInitialBalance')?.value;
        const active = document.getElementById('editAccountActive')?.value === 'true';
        const note = document.getElementById('editAccountNote')?.value;

        if (!name) {
            this.showError('Nama akun wajib diisi');
            return;
        }

        this.app.dataManager.updateAccount(id, { name, type, initialBalance, note, active });
        this.app.calculator.calculateFinances();

        this.showSuccess('Akun diperbarui!');
        this.app.uiManager.closeModal('editAccountModal');

        // Refresh selectors
        this.app.uiManager.populateAccountSelect('.account-select');

        if (this.app.state.activeTab === 'settings') {
            this.app.refreshCurrentView();
        }
    }

    handleDeleteAccount() {
        const id = document.getElementById('editAccountId')?.value;
        if (confirm('Yakin ingin menghapus akun ini? Akun yang memiliki transaksi hanya akan dinonaktifkan (Soft Delete).')) {
            this.app.dataManager.deleteAccount(id);
            this.app.calculator.calculateFinances();

            this.showSuccess('Akun dihapus/dinonaktifkan');
            this.app.uiManager.closeModal('editAccountModal');

            // Refresh selectors
            this.app.uiManager.populateAccountSelect('.account-select');

            if (this.app.state.activeTab === 'settings') {
                this.app.refreshCurrentView();
            }
        }
    }

    // ============================
    // ADD GOAL FORM HANDLING
    // ============================

    setupGoalForm() {
        const form = document.getElementById('goalForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGoalSubmit();
        });

        console.log('✅ Goal form handler attached');
    }

    handleGoalSubmit() {
        const submitBtn = document.querySelector('#goalForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const name = document.getElementById('goalName')?.value?.trim();
        const target = parseInt(document.getElementById('goalTarget')?.value) || 0;
        const deadline = document.getElementById('goalDeadline')?.value;
        const current = parseInt(document.getElementById('goalCurrent')?.value) || 0;

        // Validation
        if (!name || !target || !deadline) {
            this.showError('Harap isi semua field yang diperlukan');
            this.resetButton(submitBtn, '🎯 Buat Goal Baru');
            return;
        }

        if (target <= 0) {
            this.showError('Target harus lebih dari 0');
            this.resetButton(submitBtn, '🎯 Buat Goal Baru');
            return;
        }

        if (current > target) {
            this.showError('Jumlah saat ini tidak boleh melebihi target');
            this.resetButton(submitBtn, '🎯 Buat Goal Baru');
            return;
        }

        // Check available cash if allocating initial funds
        if (current > 0) {
            const availableCash = this.app.state.finances.availableCash;
            if (current > availableCash) {
                this.showError(`Dana tidak mencukupi! Tersedia: ${this.app.calculator.formatCurrency(availableCash)}`);
                this.resetButton(submitBtn, '🎯 Buat Goal Baru');
                return;
            }
        }

        // Create goal
        const goal = {
            id: Date.now(),
            name: name,
            target: target,
            current: current,
            deadline: deadline,
            progress: Math.round((current / target) * 100),
            priority: 2,
            created: new Date().toISOString()
        };

        this.app.state.goals.push(goal);
        this.app.calculator.calculateFinances();
        this.app.dataManager.saveData(true);

        this.updateDashboardStats();
        this.showSuccess('Goal berhasil ditambahkan! 🎯');

        // Reset form
        const form = document.getElementById('goalForm');
        if (form) form.reset();

        // Set default deadline
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        const deadlineInput = document.getElementById('goalDeadline');
        if (deadlineInput) {
            deadlineInput.value = threeMonthsLater.toISOString().split('T')[0];
        }

        this.app.uiManager.closeModal('addGoalModal');
        this.app.refreshCurrentView();

        setTimeout(() => {
            this.resetButton(submitBtn, '🎯 Buat Goal Baru');
        }, 300);
    }

    // ============================
    // EDIT GOAL FORM HANDLING
    // ============================

    setupEditGoalForm() {
        const form = document.getElementById('editGoalForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditGoalSubmit();
        });

        // Delete button
        const deleteBtn = document.getElementById('deleteGoalBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteGoal();
            });
        }

        console.log('✅ Edit Goal form handler attached');
    }

    handleEditGoalSubmit() {
        const submitBtn = document.querySelector('#editGoalForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const id = document.getElementById('editGoalId')?.value;
        const name = document.getElementById('editGoalName')?.value?.trim();
        const target = parseInt(document.getElementById('editGoalTarget')?.value) || 0;
        const newCurrent = parseInt(document.getElementById('editGoalCurrent')?.value) || 0;
        const deadline = document.getElementById('editGoalDeadline')?.value;
        const priority = parseInt(document.getElementById('editGoalPriority')?.value) || 2;

        // Validation
        if (!name || !target || !deadline) {
            this.showError('Harap isi semua field');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Find existing goal
        const goal = this.app.state.goals.find(g => g.id == id);
        if (!goal) {
            this.showError('Goal tidak ditemukan');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        const oldCurrent = goal.current || 0;
        const diff = newCurrent - oldCurrent;
        const availableCash = this.app.state.finances.availableCash;

        // If increasing allocation, validate against available cash
        if (diff > 0 && diff > availableCash) {
            this.showError(`Dana tidak mencukupi! Kurang: ${this.app.calculator.formatCurrency(diff - availableCash)}`);
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Cannot exceed target
        if (newCurrent > target) {
            this.showError('Alokasi tidak boleh melebihi target');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Update goal
        goal.name = name;
        goal.target = target;
        goal.current = newCurrent;
        goal.deadline = deadline;
        goal.priority = priority;
        goal.progress = Math.round((newCurrent / target) * 100);

        // Recalculate and save
        this.app.calculator.calculateFinances();
        this.app.dataManager.saveData(true);

        // Update UI
        this.updateDashboardStats();

        // Check completion
        if (goal.progress >= 100) {
            this.showSuccess(`🎉 Goal "${goal.name}" tercapai!`);
        } else {
            this.showSuccess('Goal diperbarui!');
        }

        this.app.uiManager.closeModal('editGoalModal');
        this.app.refreshCurrentView();

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
        }, 300);
    }

    handleDeleteGoal() {
        const id = document.getElementById('editGoalId')?.value;

        if (!confirm('Apakah Anda yakin ingin menghapus goal ini? Dana yang terkumpul akan dikembalikan ke Dana Tersedia.')) {
            return;
        }

        this.app.state.goals = this.app.state.goals.filter(g => g.id != id);

        this.app.calculator.calculateFinances();
        this.app.dataManager.saveData(true);

        this.updateDashboardStats();
        this.showSuccess('Goal dihapus');

        this.app.uiManager.closeModal('editGoalModal');
        this.app.refreshCurrentView();
    }

    // ============================
    // ADD FUNDS FORM HANDLING
    // ============================

    setupAddFundsForm() {
        const form = document.getElementById('addFundsForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddFundsSubmit();
        });

        // Setup real-time validation
        const amountInput = document.getElementById('addFundsAmount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.validateAddFundsInput();
            });
        }

        console.log('✅ Add Funds form handler attached');
    }

    validateAddFundsInput() {
        const amountInput = document.getElementById('addFundsAmount');
        const warning = document.getElementById('addFundsWarning');
        const availableCash = this.app.state.finances.availableCash;

        const val = parseInt(amountInput?.value) || 0;

        if (val > availableCash) {
            if (warning) warning.style.display = 'block';
            if (amountInput) amountInput.style.borderColor = 'var(--danger)';
            return false;
        } else {
            if (warning) warning.style.display = 'none';
            if (amountInput) amountInput.style.borderColor = '';
            return true;
        }
    }

    handleAddFundsSubmit() {
        const submitBtn = document.querySelector('#addFundsForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const id = document.getElementById('addFundsGoalId')?.value;
        const amount = parseInt(document.getElementById('addFundsAmount')?.value) || 0;
        const availableCash = this.app.state.finances.availableCash;

        // Validation
        if (amount <= 0) {
            this.showError('Jumlah harus lebih dari 0');
            this.resetButton(submitBtn, '💾 Simpan Alokasi');
            return;
        }

        if (amount > availableCash) {
            this.showError(`Dana tidak mencukupi! Tersedia: ${this.app.calculator.formatCurrency(availableCash)}`);
            this.resetButton(submitBtn, '💾 Simpan Alokasi');
            return;
        }

        // Find goal
        const goal = this.app.state.goals.find(g => g.id == id);
        if (!goal) {
            this.showError('Goal tidak ditemukan');
            this.resetButton(submitBtn, '💾 Simpan Alokasi');
            return;
        }

        // Check if would exceed target
        const remaining = goal.target - (goal.current || 0);
        if (amount > remaining) {
            this.showError(`Melebihi target! Sisa target: ${this.app.calculator.formatCurrency(remaining)}`);
            this.resetButton(submitBtn, '💾 Simpan Alokasi');
            return;
        }

        // Update goal
        goal.current = (goal.current || 0) + amount;
        goal.progress = Math.round((goal.current / goal.target) * 100);

        // Recalculate and save
        this.app.calculator.calculateFinances();
        this.app.dataManager.saveData(true);

        // Update UI
        this.updateDashboardStats();

        // Check completion
        if (goal.progress >= 100) {
            this.showSuccess(`🎉 Goal "${goal.name}" tercapai!`);
        } else {
            this.showSuccess(`Dana berhasil dialokasikan ke "${goal.name}"`);
        }

        // Reset form
        const form = document.getElementById('addFundsForm');
        if (form) form.reset();

        this.app.uiManager.closeModal('addFundsModal');
        this.app.refreshCurrentView();

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Alokasi');
        }, 300);
    }

    // ============================
    // DASHBOARD UPDATE METHODS
    // ============================

    updateDashboardStats() {
        const finances = this.app.state.finances;

        // Update Net Balance
        const netBalanceEl = document.getElementById('totalNetBalance');
        if (netBalanceEl) {
            netBalanceEl.textContent = this.app.calculator.formatCurrency(finances.netBalance);
        }

        // Update Available Cash
        const availableCashEl = document.getElementById('totalAvailableCash');
        if (availableCashEl) {
            availableCashEl.textContent = this.app.calculator.formatCurrency(finances.availableCash);
        }

        // Update Total Allocated
        const allocatedEl = document.getElementById('totalAllocated');
        if (allocatedEl) {
            allocatedEl.textContent = this.app.calculator.formatCurrency(finances.totalAllocated);
        }

        // Also try generic stat-value elements in stats grid
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            const statCards = statsGrid.querySelectorAll('.stat-card');
            statCards.forEach((card, index) => {
                const valueEl = card.querySelector('.stat-value');
                if (valueEl) {
                    switch (index) {
                        case 0: // Net Balance
                            valueEl.textContent = this.app.calculator.formatCurrency(finances.netBalance);
                            break;
                        case 1: // Available Cash
                            valueEl.textContent = this.app.calculator.formatCurrency(finances.availableCash);
                            break;
                        case 2: // Allocated
                            valueEl.textContent = this.app.calculator.formatCurrency(finances.totalAllocated);
                            break;
                    }
                }
            });
        }

        console.log('📊 Dashboard stats updated:', finances);
    }

    updateIncomeList() {
        const incomeListEl = document.getElementById('incomeList');
        if (!incomeListEl) return;

        const incomeTransactions = this.app.state.transactions.income;

        if (incomeTransactions.length === 0) {
            incomeListEl.innerHTML = '<div class="text-center text-muted mt-6">Belum ada pendapatan</div>';
            return;
        }

        // Sort by date DESC
        const sortedIncome = [...incomeTransactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        incomeListEl.innerHTML = sortedIncome.map(income => `
            <div class="activity-item income-activity" data-income-id="${income.id}">
                <div class="activity-icon">💰</div>
                <div class="activity-details">
                    <div class="activity-title">${income.name}</div>
                    <div class="activity-meta">
                        <span>${this.app.uiManager.formatDate(income.date)}</span>
                        <span>•</span>
                        <span>${this.app.uiManager.getCategoryName(income.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: var(--success);">
                    + ${this.app.calculator.formatCurrency(income.amount)}
                </div>
                <button class="btn-outline btn-delete btn-delete-sm" 
                        onclick="handleDeleteTransaction('income', ${income.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    // ============================
    // UTILITY METHODS
    // ============================

    showError(message) {
        this.app.uiManager.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.app.uiManager.showNotification(message, 'success');
    }

    resetButton(btn, text) {
        if (btn) {
            btn.disabled = false;
            btn.textContent = text;
        }
    }

    // ============================
    // BUDGET FORM HANDLING
    // ============================

    setupBudgetForm() {
        const form = document.getElementById('addBudgetForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBudgetSubmit();
        });

        console.log('✅ Budget form handler attached');
    }

    handleBudgetSubmit() {
        const submitBtn = document.querySelector('#addBudgetForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const name = document.getElementById('budgetName')?.value?.trim();
        const amount = parseInt(document.getElementById('budgetAmount')?.value) || 0;
        const category = document.getElementById('budgetCategory')?.value;
        const duration = document.getElementById('budgetDuration')?.value || 'monthly';

        // Validation
        if (!name || !category) {
            this.showError('Harap isi semua field yang diperlukan');
            this.resetButton(submitBtn, '💾 Simpan Budget');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah budget harus lebih dari 0');
            this.resetButton(submitBtn, '💾 Simpan Budget');
            return;
        }

        // Create budget via DataManager (NO spent field)
        this.app.dataManager.addBudget({ name, amount, category, duration });

        this.showSuccess('Budget berhasil dibuat!');

        // Reset form
        const form = document.getElementById('addBudgetForm');
        if (form) form.reset();

        this.app.uiManager.closeModal('addBudgetModal');

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Budget');
        }, 300);
    }

    setupEditBudgetForm() {
        const form = document.getElementById('editBudgetForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditBudgetSubmit();
        });

        // Delete button
        const deleteBtn = document.getElementById('deleteBudgetBtn');
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', () => {
                this.handleDeleteBudget();
            });
        }

        console.log('✅ Edit Budget form handler attached');
    }

    handleEditBudgetSubmit() {
        const submitBtn = document.querySelector('#editBudgetForm button[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const id = parseInt(document.getElementById('editBudgetId')?.value);
        const name = document.getElementById('editBudgetName')?.value?.trim();
        const amount = parseInt(document.getElementById('editBudgetAmount')?.value) || 0;

        // Validation
        if (!name || amount <= 0) {
            this.showError('Harap isi semua field dengan benar');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Update via DataManager (spending will be re-derived automatically)
        this.app.dataManager.updateBudget(id, { name, amount });

        this.showSuccess('Budget diperbarui!');
        this.app.uiManager.closeModal('editBudgetModal');

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
        }, 300);
    }

    handleDeleteBudget() {
        const id = parseInt(document.getElementById('editBudgetId')?.value);

        if (!confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
            return;
        }

        this.app.dataManager.deleteBudget(id);
        this.showSuccess('Budget dihapus');
        this.app.uiManager.closeModal('editBudgetModal');
    }
}

export default FormHandlers;
