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

        // Smart defaults - remember last used values
        this.lastUsedAccount = { income: null, expense: null };
        this.lastUsedCategory = { income: null, expense: null };
    }

    /**
     * Initialize all form event listeners
     * Call this after DOM is ready
     */
    initialize() {
        console.log('🔧 FormHandlers: Initializing...');
        this.populateCategoryDropdowns(); // Populate categories on load

        // PHASE 3: Unified Transaction Modal (NEW)
        this.setupUnifiedTransactionForm();

        // OLD MODALS (kept for rollback safety)
        this.setupIncomeForm();
        this.setupExpenseForm(); // Expense Handling
        this.setupAccountForm(); // Account Handling
        this.setupEditAccountForm(); // Edit Account Handling
        this.setupGoalForm();
        this.setupEditGoalForm();
        this.setupAddFundsForm();
        this.setupBudgetForm(); // Budget forms
        this.setupEditBudgetForm(); // Budget edit form
        this.setupTransferForm(); // Transfer form (CRITICAL FIX)
        this.setupEditExpenseForm(); // Edit expense form
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

    /* ====================================================================
     * PHASE 3: UNIFIED TRANSACTION MODAL
     * UI orchestration only - routes to existing handlers
     * ==================================================================== */

    setupUnifiedTransactionForm() {
        const form = document.getElementById('unifiedTransactionForm');
        if (!form) {
            console.warn('Unified transaction form not found');
            return;
        }

        // Clone to remove existing listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Get elements - FIX: use querySelector on cloned element, not getElementById
        const typeRadios = newForm.querySelectorAll('input[name="transactionType"]');
        const recurringCheckbox = newForm.querySelector('#unified_recurring');
        const frequencyGroup = newForm.querySelector('#unified_frequencyGroup');

        // Setup type change listeners
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.adaptUnifiedFormFields(radio.value);
            });
        });

        // Setup recurring toggle
        if (recurringCheckbox && frequencyGroup) {
            recurringCheckbox.addEventListener('change', (e) => {
                frequencyGroup.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Setup form submission
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Detect which button was clicked
            const continueAdding = e.submitter?.dataset.action === 'continue';

            // Get selected transaction type
            const selectedType = newForm.querySelector('input[name="transactionType"]:checked').value;

            // Route to appropriate handler
            this.handleUnifiedTransactionSubmit(selectedType, continueAdding);
        });

        // Initialize with default type (expense)
        this.adaptUnifiedFormFields('expense');

        console.log('✅ Unified transaction form handler attached');
    }

    /**
     * Adapt form fields based on transaction type
     * PHASE 3: Field visibility logic only, no business logic
     * FIX: Dynamically toggle 'required' attribute to prevent validation errors on hidden fields
     * FIX: Clear field state completely to prevent ghost values and missing dropdown options
     */
    adaptUnifiedFormFields(type) {
        // Get all field groups
        const nameGroup = document.getElementById('unified_nameGroup');
        const nameInput = document.getElementById('unified_name');
        const nameLabel = document.getElementById('unified_nameLabel');
        const categoryGroup = document.getElementById('unified_categoryGroup');
        const categorySelect = document.getElementById('unified_category');
        const accountGroup = document.getElementById('unified_accountGroup');
        const accountSelect = document.getElementById('unified_account');
        const fromAccountGroup = document.getElementById('unified_fromAccountGroup');
        const fromAccountSelect = document.getElementById('unified_fromAccount');
        const toAccountGroup = document.getElementById('unified_toAccountGroup');
        const toAccountSelect = document.getElementById('unified_toAccount');
        const noteGroup = document.getElementById('unified_noteGroup');
        const noteInput = document.getElementById('unified_note');
        const recurringSection = document.getElementById('unified_recurringSection');
        const saveAndContinue = document.getElementById('unified_saveAndContinue');

        // STRICT V1.0 POLICY: Explicitly clear ALL user inputs on type change
        // This ensures no ghost state when switching between types
        if (nameInput) nameInput.value = '';
        if (noteInput) noteInput.value = '';
        if (accountSelect) accountSelect.value = '';
        // amount is often shared ID, clear it too
        const amountInput = document.getElementById('unified_amount');
        if (amountInput) amountInput.value = '';

        // Helper function to hide field, remove required, and CLEAR VALUE
        const hideField = (group, input) => {
            if (group) group.style.display = 'none';
            if (input) {
                input.required = false;
                input.value = ''; // CRITICAL: Clear value to prevent ghost state
            }
        };

        // Helper function to show field and add required
        const showField = (group, input, isRequired = true) => {
            if (group) group.style.display = 'block';
            if (input && isRequired) input.required = true;
        };

        // Reset all to hidden, remove required, and clear values
        hideField(nameGroup, nameInput);
        hideField(categoryGroup, categorySelect);
        hideField(accountGroup, accountSelect);
        hideField(fromAccountGroup, fromAccountSelect);
        hideField(toAccountGroup, toAccountSelect);
        if (noteGroup) noteGroup.style.display = 'none';
        if (recurringSection) recurringSection.style.display = 'none';

        // Adapt based on type
        switch (type) {
            case 'expense':
                // Show and require: name, category, account
                showField(nameGroup, nameInput, true);
                showField(categoryGroup, categorySelect, true);
                showField(accountGroup, accountSelect, true);

                if (nameLabel) nameLabel.textContent = 'Nama Pengeluaran';
                if (noteGroup) noteGroup.style.display = 'block';
                if (recurringSection) recurringSection.style.display = 'block';
                if (saveAndContinue) saveAndContinue.style.display = 'block';

                // CRITICAL FIX: Repopulate category dropdown for expense
                this.populateUnifiedCategoryDropdown('expense');
                break;

            case 'income':
                // Show and require: name, category, account
                // REGRESSION FIX: Income also needs category dropdown
                showField(nameGroup, nameInput, true);
                showField(categoryGroup, categorySelect, true);
                showField(accountGroup, accountSelect, true);

                if (nameLabel) nameLabel.textContent = 'Sumber Pendapatan';
                if (noteGroup) noteGroup.style.display = 'block';
                if (recurringSection) recurringSection.style.display = 'block';
                if (saveAndContinue) saveAndContinue.style.display = 'block';

                // CRITICAL FIX: Repopulate category dropdown for income
                this.populateUnifiedCategoryDropdown('income');
                break;

            case 'transfer':
                // Show and require: fromAccount, toAccount (NO name, category, account)
                showField(fromAccountGroup, fromAccountSelect, true);
                showField(toAccountGroup, toAccountSelect, true);
                // Hide and remove required from unused fields
                hideField(nameGroup, nameInput);
                hideField(categoryGroup, categorySelect);
                hideField(accountGroup, accountSelect);
                if (noteInput) noteInput.value = ''; // Clear note for transfer

                // Transfer: No note, recurring, or "Save & Add Another"
                if (saveAndContinue) saveAndContinue.style.display = 'none';
                break;
        }

        console.log(`💳 Adapted unified form for: ${type}`);
    }

    /**
     * Populate category dropdown for unified transaction form
     * Handles both expense and income categories
     * REGRESSION FIX: Income categories restored
     */
    populateUnifiedCategoryDropdown(type) {
        const categorySelect = document.getElementById('unified_category');
        if (!categorySelect) return;

        // CRITICAL: Always clear existing options and value first
        categorySelect.innerHTML = '';
        categorySelect.value = '';

        let html = '<option value="" disabled selected>Pilih kategori</option>';

        if (type === 'expense' && this.app.categoryManager) {
            // Get expense categories from CategoryManager
            const expenseCategories = this.app.categoryManager.getCategoriesByType('expense');
            expenseCategories.forEach(cat => {
                html += `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`;
            });
            categorySelect.innerHTML = html;
            console.log('✅ Expense category dropdown populated');
        } else if (type === 'income') {
            // REGRESSION FIX: Income categories now dynamic
            let incomeCategories = [];

            // Try to get from CategoryManager first
            if (this.app.categoryManager) {
                incomeCategories = this.app.categoryManager.getCategoriesByType('income');
            }

            // Fallback if empty (Safety net)
            if (!incomeCategories || incomeCategories.length === 0) {
                incomeCategories = [
                    { key: 'gaji', icon: '💼', name: 'Gaji' },
                    { key: 'freelance', icon: '💻', name: 'Freelance' },
                    { key: 'investasi', icon: '📈', name: 'Investasi' },
                    { key: 'lainnya', icon: '💰', name: 'Lainnya' }
                ];
            }

            incomeCategories.forEach(cat => {
                html += `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`;
            });
            categorySelect.innerHTML = html;
            console.log(`✅ Income category dropdown populated (${incomeCategories.length} items)`);
        }
    }

    /**
     * Handle unified transaction submission
     * PHASE 3: Routing only - NO business logic
     */
    handleUnifiedTransactionSubmit(type, keepOpen = false) {
        console.log(`💳 Submitting unified transaction: ${type}, keepOpen: ${keepOpen}`);

        // Route to existing handlers based on type
        switch (type) {
            case 'expense':
                this.handleUnifiedExpenseSubmit(keepOpen);
                break;
            case 'income':
                this.handleUnifiedIncomeSubmit(keepOpen);
                break;
            case 'transfer':
                this.handleUnifiedTransferSubmit();
                break;
            default:
                console.error('Unknown transaction type:', type);
        }
    }

    /**
     * Handle expense submission from unified modal
     * Maps unified form fields to existing data manager calls
     */
    handleUnifiedExpenseSubmit(keepOpen = false) {
        // Get unified form values
        const name = document.getElementById('unified_name')?.value.trim();
        const amount = parseFloat(document.getElementById('unified_amount')?.value);
        const category = document.getElementById('unified_category')?.value;
        const accountId = parseInt(document.getElementById('unified_account')?.value);
        const date = document.getElementById('unified_date')?.value;
        const note = document.getElementById('unified_note')?.value.trim();
        const isRecurring = document.getElementById('unified_recurring')?.checked;
        const frequency = document.getElementById('unified_frequency')?.value;

        // Validation
        if (!name || !amount || !category || !accountId || !date) {
            this.showError('Harap isi semua field yang diperlukan');
            return;
        }

        // Get account name
        const account = this.app.state.accounts.find(a => a.id === accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            return;
        }

        // Create expense object matching DataManager schema
        const expenseData = {
            name,
            amount,
            category,
            account: account.name,
            accountId,
            date,
            note: note || ''
        };

        // Call unified DataManager API
        this.app.dataManager.addTransaction('expenses', expenseData);

        // Handle recurring if enabled
        if (isRecurring && this.app.recurringManager) {
            this.app.recurringManager.addRecurring({
                type: 'expense',
                name,
                amount,
                category,
                accountId,
                accountName: account.name,
                frequency: frequency || 'monthly'
            });
        }

        // Store last used values (smart defaults)
        this.lastUsedAccount.expense = accountId;
        this.lastUsedCategory.expense = category;

        // Handle keepOpen logic
        if (keepOpen) {
            this.showSuccess('✅ Tersimpan! Silakan input data berikutnya.');
            this.smartResetUnifiedForm('expense', accountId, category);
        } else {
            this.showSuccess('Pengeluaran berhasil disimpan!');
            document.getElementById('unifiedTransactionForm').reset();
            this.app.uiManager.closeModal('addTransactionModal');
        }

        // Refresh UI
        this.app.calculator.calculateFinances();
        this.app.uiManager.updateUI();
        this.app.refreshCurrentView();
    }

    /**
     * Handle income submission from unified modal
     */
    handleUnifiedIncomeSubmit(keepOpen = false) {
        // Get unified form values
        const name = document.getElementById('unified_name')?.value.trim();
        const amount = parseFloat(document.getElementById('unified_amount')?.value);
        const category = document.getElementById('unified_category')?.value;
        const accountId = parseInt(document.getElementById('unified_account')?.value);
        const date = document.getElementById('unified_date')?.value;
        const note = document.getElementById('unified_note')?.value.trim();
        const isRecurring = document.getElementById('unified_recurring')?.checked;
        const frequency = document.getElementById('unified_frequency')?.value;

        // Validation
        if (!name || !amount || !category || !accountId || !date) {
            this.showError('Harap isi semua field yang diperlukan');
            return;
        }

        // Get account name
        const account = this.app.state.accounts.find(a => a.id === accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            return;
        }

        // Create income object matching DataManager schema
        const incomeData = {
            name,
            amount,
            category, // Use actual category from dropdown (gaji, freelance, investasi, lainnya)
            account: account.name,
            accountId,
            date,
            note: note || ''
        };

        // Call unified DataManager API
        this.app.dataManager.addTransaction('income', incomeData);

        // Handle recurring if enabled
        if (isRecurring && this.app.recurringManager) {
            this.app.recurringManager.addRecurring({
                type: 'income',
                name,
                amount,
                category,
                accountId,
                accountName: account.name,
                frequency: frequency || 'monthly'
            });
        }

        // Store last used values (smart defaults)
        this.lastUsedAccount.income = accountId;
        this.lastUsedCategory.income = category;

        // Handle keepOpen logic
        if (keepOpen) {
            this.showSuccess('✅ Tersimpan! Silakan input data berikutnya.');
            this.smartResetUnifiedForm('income', accountId, category);
        } else {
            this.showSuccess('Pendapatan berhasil ditambahkan!');
            document.getElementById('unifiedTransactionForm').reset();
            this.app.uiManager.closeModal('addTransactionModal');
        }

        // Refresh UI
        this.app.calculator.calculateFinances();
        this.app.uiManager.updateUI();
        this.app.refreshCurrentView();
    }

    /**
     * Handle transfer submission from unified modal
     */
    handleUnifiedTransferSubmit() {
        // Get unified form values
        const fromAccountId = parseInt(document.getElementById('unified_fromAccount')?.value);
        const toAccountId = parseInt(document.getElementById('unified_toAccount')?.value);
        const amount = parseFloat(document.getElementById('unified_amount')?.value);
        const date = document.getElementById('unified_date')?.value;

        // Validation
        if (!fromAccountId || !toAccountId || !amount || !date) {
            this.showError('Harap isi semua field yang diperlukan');
            return;
        }

        if (fromAccountId === toAccountId) {
            this.showError('Akun asal dan tujuan tidak boleh sama');
            return;
        }

        // Create transfer object (ID is generated by DataManager)
        const transferData = {
            fromAccountId,
            toAccountId,
            amount,
            date
        };

        // Call DataManager API
        this.app.dataManager.addTransfer(transferData);

        // Close modal and refresh
        this.showSuccess('Transfer berhasil dilakukan!');
        document.getElementById('unifiedTransactionForm').reset();
        this.app.uiManager.closeModal('addTransactionModal');

        // Refresh UI
        this.app.calculator.calculateFinances();
        this.app.uiManager.updateUI();
        this.app.refreshCurrentView();
    }

    /**
     * Smart reset for "Save & Add Another"
     * STRICT V1.0 POLICY: Reset to "Expense" default, Clear ALL fields except Date
     * No smart defaults for account/category - Clean slate every time.
     */
    smartResetUnifiedForm(type, accountId, categoryId = null) {
        const form = document.getElementById('unifiedTransactionForm');
        if (!form) return;

        // Reset to default type 'expense' as per v1.0 Requirement
        const expenseRadio = form.querySelector('input[value="expense"]');
        if (expenseRadio) {
            expenseRadio.checked = true;
            // This will trigger adaptUnifiedFormFields which wipes common fields
            this.adaptUnifiedFormFields('expense');
        }

        // Reset date to today (Requirement: "Only keep: date = today")
        const dateInput = document.getElementById('unified_date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        // Focus name field
        const nameInput = document.getElementById('unified_name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }

        console.log('🔄 Form soft-reset for next entry (Defaulted to Expense)');
    }


    /* ====================================================================
     * END PHASE 3
     * ==================================================================== */

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
            // Detect which button was clicked
            const continueAdding = e.submitter?.dataset.action === 'continue';
            this.handleIncomeSubmit(continueAdding);
        });

        // Recurring toggle listener
        const recurringCb = document.getElementById('incomeRecurring');
        const freqGroup = document.getElementById('incomeFrequencyGroup');
        if (recurringCb && freqGroup) {
            recurringCb.addEventListener('change', (e) => {
                freqGroup.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        console.log('✅ Income form handler attached');
    }

    handleIncomeSubmit(keepOpen = false) {
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

        // Recurring inputs
        const recurringCb = document.getElementById('incomeRecurring');
        const frequencyInput = document.getElementById('incomeFrequency');

        const name = nameInput?.value?.trim();
        const amount = parseInt(amountInput?.value) || 0;
        const category = categoryInput?.value;
        const accountId = parseInt(accountInput?.value);
        const date = dateInput?.value;

        // 3. Validate inputs
        if (!name || !category || !date || !accountId) {
            this.showError('Harap isi semua field termasuk Akun Tujuan');
            this.resetButton(submitBtn, '💰 Simpan');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah pendapatan harus lebih dari 0');
            this.resetButton(submitBtn, '💰 Simpan');
            return;
        }

        const account = this.app.state.accounts.find(a => a.id == accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            this.resetButton(submitBtn, '💰 Simpan');
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

        // HANDLE RECURRING
        if (recurringCb && recurringCb.checked && this.app.recurringManager) {
            this.app.recurringManager.addRecurring({
                type: 'income',
                name: name,
                amount: amount,
                category: category,
                accountId: accountId,
                accountName: account.name,
                frequency: frequencyInput.value || 'monthly'
            });
            console.log('🔄 Scheduled recurring income');
        }

        // 6. Recalculate finances
        this.app.calculator.calculateFinances();

        // 7. Save data
        this.app.dataManager.saveData(true);

        // 8. Update UI immediately
        this.updateDashboardStats();

        // 9. Refresh current view if on income tab
        if (this.app.state.activeTab === 'income') {
            this.app.refreshCurrentView();
        }

        // 10. Trigger assistant suggestions
        this.app.handleAssistantSuggestions('income', amount);

        // SMART DEFAULTS: Save last used values
        this.lastUsedAccount.income = accountId;
        this.lastUsedCategory.income = category;

        // SUCCESS HANDLING
        if (keepOpen) {
            this.showSuccess('✅ Tersimpan! Silakan input data berikutnya.');

            // SMART RESET: Clear name & amount, keep account & category
            const keepAccount = accountInput.value;
            const keepCategory = categoryInput.value;

            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (amountInput) amountInput.value = '';

            // Reset recurring checkbox
            if (recurringCb) recurringCb.checked = false;
            const freqGroup = document.getElementById('incomeFrequencyGroup');
            if (freqGroup) freqGroup.style.display = 'none';

            // Restore kept values
            if (accountInput) accountInput.value = keepAccount;
            if (categoryInput) categoryInput.value = keepCategory;

            // Set date to today
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            // Focus name input
            if (nameInput) {
                setTimeout(() => nameInput.focus(), 100);
            }

            // Re-enable button
            this.resetButton(submitBtn, '💰 Simpan');
        } else {
            this.showSuccess('Pendapatan berhasil ditambahkan!');

            // Reset form
            const form = document.getElementById('incomeForm');
            if (form) form.reset();

            // Close modal
            this.app.uiManager.closeModal('addIncomeModal');

            // Re-enable button after delay
            setTimeout(() => {
                this.resetButton(submitBtn, '💰 Simpan');
            }, 300);
        }
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
            // Detect which button was clicked
            const continueAdding = e.submitter?.dataset.action === 'continue';
            this.handleExpenseSubmit(continueAdding);
        });

        // Recurring toggle listener
        const recurringCb = document.getElementById('expenseRecurring');
        const freqGroup = document.getElementById('expenseFrequencyGroup');
        if (recurringCb && freqGroup) {
            recurringCb.addEventListener('change', (e) => {
                freqGroup.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        console.log('✅ Expense form handler attached');
    }

    handleExpenseSubmit(keepOpen = false) {
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');

        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }

        const nameInput = document.getElementById('expenseName');
        const amountInput = document.getElementById('expenseAmount');
        const categoryInput = document.getElementById('expenseCategory');
        const accountInput = document.getElementById('expenseAccount');
        const dateInput = document.getElementById('expenseDate');

        const name = nameInput?.value?.trim();
        const amount = parseInt(amountInput?.value) || 0;
        const category = categoryInput?.value;
        const accountId = parseInt(accountInput?.value);
        const date = dateInput?.value;

        // Recurring inputs
        const recurringCb = document.getElementById('expenseRecurring');
        const frequencyInput = document.getElementById('expenseFrequency');

        const resetUI = () => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '💾 Simpan';
            }
        };

        if (!name || !category || !date || !accountId) {
            this.showError('Harap isi semua field termasuk Akun Sumber Dana');
            resetUI();
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah harus lebih dari 0');
            resetUI();
            return;
        }

        const account = this.app.state.accounts.find(a => a.id == accountId);
        if (!account) {
            this.showError('Akun tidak valid');
            resetUI();
            return;
        }

        // Check balance (optional strictly, but good for UX)
        const currentBalance = this.app.calculator.calculateAccountBalance(account);
        if (amount > currentBalance) {
            if (!confirm(`Saldo akun ${account.name} mungkin tidak cukup (${this.app.calculator.formatCurrency(currentBalance)}). Tetap lanjutkan?`)) {
                resetUI();
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

        // HANDLE RECURRING
        if (recurringCb && recurringCb.checked && this.app.recurringManager) {
            this.app.recurringManager.addRecurring({
                type: 'expense',
                name: name,
                amount: amount,
                category: category,
                accountId: accountId,
                accountName: account.name,
                frequency: frequencyInput.value || 'monthly'
            });
            console.log('🔄 Scheduled recurring expense');
        }
        this.app.calculator.calculateFinances();

        // Update Expense List if visible
        if (this.app.state.activeTab === 'expenses') {
            this.app.refreshCurrentView();
        }

        // SMART DEFAULTS: Save last used values
        this.lastUsedAccount.expense = accountId;
        this.lastUsedCategory.expense = category;

        // SUCCESS HANDLING
        if (keepOpen) {
            this.showSuccess('✅ Tersimpan! Silakan input data berikutnya.');

            // SMART RESET: Clear name & amount, keep account & category
            const form = document.getElementById('expenseForm');
            const keepAccount = accountInput.value;
            const keepCategory = categoryInput.value;

            // Clear inputs
            if (nameInput) nameInput.value = '';
            if (amountInput) amountInput.value = '';

            // Reset recurring checkbox
            if (recurringCb) recurringCb.checked = false;
            const freqGroup = document.getElementById('expenseFrequencyGroup');
            if (freqGroup) freqGroup.style.display = 'none';

            // Restore kept values
            if (accountInput) accountInput.value = keepAccount;
            if (categoryInput) categoryInput.value = keepCategory;

            // Set date to today
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            // Focus name input
            if (nameInput) {
                setTimeout(() => nameInput.focus(), 100);
            }

            resetUI();
        } else {
            this.showSuccess('Pengeluaran berhasil disimpan!');
            document.getElementById('expenseForm').reset();
            this.app.uiManager.closeModal('addExpenseModal');

            setTimeout(() => {
                resetUI();
            }, 300);
        }
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
                <div style="display: flex; gap: 8px;">
                    <button class="btn-outline btn-sm" 
                            title="Duplicate"
                            onclick="handleDuplicateTransaction('income', ${income.id})">
                        📄
                    </button>
                    <button class="btn-outline btn-delete btn-delete-sm" 
                            title="Delete"
                            onclick="handleDeleteTransaction('income', ${income.id})">
                        Hapus
                    </button>
                </div>
            </div>
        `).join('');
    }

    handleDuplicateTransaction(type, id) {
        console.log(`📄 Duplicating ${type} transaction: ${id}`);

        let transaction;
        if (type === 'income') {
            transaction = this.app.state.transactions.income.find(t => t.id == id);
            if (transaction) {
                // Open modal
                this.app.uiManager.openModal('addIncomeModal');

                // Pre-fill form
                setTimeout(() => {
                    const nameInput = document.getElementById('incomeName');
                    const amountInput = document.getElementById('incomeAmount');
                    const categoryInput = document.getElementById('incomeCategory');
                    const accountInput = document.getElementById('incomeAccount');
                    const dateInput = document.getElementById('incomeDate');

                    if (nameInput) nameInput.value = transaction.name;
                    if (amountInput) amountInput.value = transaction.amount;
                    if (categoryInput) categoryInput.value = transaction.category;
                    if (accountInput) accountInput.value = transaction.accountId; // Use accountId directly
                    // Set date to TODAY as per spec
                    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                }, 100);
            }
        } else if (type === 'expenses') {
            transaction = this.app.state.transactions.expenses.find(t => t.id == id);
            if (transaction) {
                // Open modal
                this.app.uiManager.openModal('addExpenseModal');

                // Pre-fill form
                setTimeout(() => {
                    const nameInput = document.getElementById('expenseName');
                    const amountInput = document.getElementById('expenseAmount');
                    const categoryInput = document.getElementById('expenseCategory');
                    const accountInput = document.getElementById('expenseAccount');
                    const dateInput = document.getElementById('expenseDate');

                    if (nameInput) nameInput.value = transaction.name;
                    if (amountInput) amountInput.value = transaction.amount;
                    if (categoryInput) categoryInput.value = transaction.category;
                    if (accountInput) accountInput.value = transaction.accountId;
                    // Set date to TODAY as per spec
                    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                }, 100);
            }
        }
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
        const period = document.getElementById('budgetPeriod')?.value || 'monthly';

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

        // Create budget via DataManager
        this.app.dataManager.addBudget({ name, amount, category, period });

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
        const period = document.getElementById('editBudgetPeriod')?.value || 'monthly';

        // Validation
        if (!name || amount <= 0) {
            this.showError('Harap isi semua field dengan benar');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Find and update budget
        const budget = this.app.state.budgets.find(b => b.id === id);
        if (budget) {
            const periodChanged = budget.period !== period;

            budget.name = name;
            budget.amount = amount;
            budget.period = period;

            // If period type changed, reset progress
            if (periodChanged) {
                budget.spent = 0;
                // Import getCurrentPeriod dynamically
                import('../utils/BudgetPeriodUtils.js').then(({ getCurrentPeriod }) => {
                    budget.currentPeriod = getCurrentPeriod(period);
                    console.log(`🔄 Period changed for "${name}", progress reset`);
                    this.app.dataManager.saveData(true);
                });
            } else {
                this.app.dataManager.saveData(true);
            }
        }

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

    // ============================
    // TRANSFER FORM
    // ============================

    setupTransferForm() {
        const form = document.getElementById('transferForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransferSubmit();
        });

        // Set default date
        const dateInput = document.getElementById('transferDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        console.log('✅ Transfer form handler attached');
    }

    handleTransferSubmit() {
        const submitBtn = document.querySelector('#transferForm button[type="submit"]');
        if (submitBtn?.disabled) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Memproses...';
        }

        const fromAccountId = document.getElementById('transferFromAccount')?.value;
        const toAccountId = document.getElementById('transferToAccount')?.value;
        const amount = parseInt(document.getElementById('transferAmount')?.value) || 0;
        const date = document.getElementById('transferDate')?.value;
        const note = document.getElementById('transferNote')?.value?.trim();

        // Validation
        if (!fromAccountId || !toAccountId || !date) {
            this.showError('Harap isi semua field yang diperlukan');
            this.resetButton(submitBtn, '🔄 Transfer Sekarang');
            return;
        }

        if (fromAccountId === toAccountId) {
            this.showError('Akun sumber dan tujuan harus berbeda');
            this.resetButton(submitBtn, '🔄 Transfer Sekarang');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah harus lebih dari 0');
            this.resetButton(submitBtn, '🔄 Transfer Sekarang');
            return;
        }

        // Check source account balance
        const fromAccount = this.app.state.accounts.find(a => a.id == fromAccountId);
        if (fromAccount) {
            const balance = this.app.calculator.calculateAccountBalance(fromAccount);
            if (amount > balance) {
                if (!confirm(`Saldo ${fromAccount.name} tidak mencukupi (${this.app.calculator.formatCurrency(balance)}). Tetap lanjutkan?`)) {
                    this.resetButton(submitBtn, '🔄 Transfer Sekarang');
                    return;
                }
            }
        }

        // Create transfer
        const transfer = {
            fromAccountId: parseInt(fromAccountId),
            toAccountId: parseInt(toAccountId),
            amount,
            date,
            note
        };

        console.log('💸 Adding transfer:', transfer);
        this.app.dataManager.addTransfer(transfer);

        console.log('🧮 Recalculating finances...');
        this.app.calculator.calculateFinances();

        // Log balances after transfer
        const fromAcc = this.app.state.accounts.find(a => a.id == fromAccountId);
        const toAcc = this.app.state.accounts.find(a => a.id == toAccountId);
        if (fromAcc && toAcc) {
            const fromBalance = this.app.calculator.calculateAccountBalance(fromAcc);
            const toBalance = this.app.calculator.calculateAccountBalance(toAcc);
            console.log(`📊 Updated Balances:`);
            console.log(`   ${fromAcc.name}: ${this.app.calculator.formatCurrency(fromBalance)}`);
            console.log(`   ${toAcc.name}: ${this.app.calculator.formatCurrency(toBalance)}`);
        }

        this.showSuccess('Transfer berhasil!');
        document.getElementById('transferForm').reset();
        this.app.uiManager.closeModal('transferModal');

        // Refresh current view (works for both Dashboard and Settings)
        console.log(`🔄 Refreshing view: ${this.app.state.activeTab}`);
        this.app.refreshCurrentView();
        console.log('✅ Transfer complete and view refreshed');

        setTimeout(() => {
            this.resetButton(submitBtn, '🔄 Transfer Sekarang');
        }, 300);
    }

    // ====== EDIT EXPENSE FORM ======

    setupEditExpenseForm() {
        const form = document.getElementById('editExpenseForm');
        if (!form) return;

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditExpenseSubmit();
        });

        console.log('✅ Edit expense form handler attached');
    }

    handleEditExpenseSubmit() {
        const submitBtn = document.querySelector('#editExpenseForm button[type="submit"]');
        if (submitBtn?.disabled) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Menyimpan...';
        }

        const id = parseInt(document.getElementById('editExpenseId')?.value);
        const name = document.getElementById('editExpenseName')?.value?.trim();
        const amount = parseInt(document.getElementById('editExpenseAmount')?.value) || 0;
        const category = document.getElementById('editExpenseCategory')?.value;
        const accountId = parseInt(document.getElementById('editExpenseAccount')?.value);
        const date = document.getElementById('editExpenseDate')?.value;
        const note = document.getElementById('editExpenseNote')?.value?.trim();

        // Validation
        if (!name || !amount || !category || !accountId || !date) {
            this.showError('Harap isi semua field yang diperlukan');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        if (amount <= 0) {
            this.showError('Jumlah harus lebih dari 0');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        // Find expense
        const expense = this.app.state.transactions.expenses.find(e => e.id == id);
        if (!expense) {
            this.showError('Pengeluaran tidak ditemukan');
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
            return;
        }

        console.log('📝 Editing expense:', {
            id,
            oldAmount: expense.amount,
            newAmount: amount,
            oldAccount: expense.accountId,
            newAccount: accountId
        });

        // Update expense (SAME ID - in-place modification)
        expense.name = name;
        expense.amount = amount;
        expense.category = category;
        expense.accountId = accountId;
        expense.date = date;
        expense.note = note;

        // CRITICAL: Recalculate everything
        this.app.calculator.calculateFinances();

        // Save data
        this.app.dataManager.saveData(true);

        // Close modal and refresh
        this.app.uiManager.closeModal('editExpenseModal');
        this.app.refreshCurrentView();

        this.showSuccess('Pengeluaran berhasil diubah!');

        setTimeout(() => {
            this.resetButton(submitBtn, '💾 Simpan Perubahan');
        }, 300);

        console.log('✅ Expense edited successfully');
    }

    // ====== HELPER METHODS ======

    populateAccountSelect(selector) {
        const select = document.querySelector(selector);
        if (!select) return;

        const activeAccounts = this.app.state.accounts.filter(acc => acc.active);

        select.innerHTML = '<option value="">Pilih Akun</option>' +
            activeAccounts.map(acc =>
                `<option value="${acc.id}">${acc.name}</option>`
            ).join('');
    }

    populateCategorySelect(selector, type) {
        const select = document.querySelector(selector);
        if (!select) return;

        const categories = this.app.categoryManager.getCategoriesByType(type);

        select.innerHTML = '<option value="">Pilih Kategori</option>' +
            categories.map(cat =>
                `<option value="${cat.key}">${cat.icon} ${cat.name}</option>`
            ).join('');
    }
}


export default FormHandlers;
