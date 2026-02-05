/* ====== TRANSACTIONS VIEW MODULE ======
 * Unified hub for all transaction types (Income, Expense, Transfer)
 * Replaces separate ExpensesView and IncomeView with single canonical source
 * 
 * SCOPE LIMITATIONS (Intentional):
 * - Transfer: View-only (no delete/edit/duplicate)
 * - Income: Delete + Duplicate only (no edit)
 * - Expense: Full support (edit + delete + duplicate)
 * 
 * NO BUSINESS LOGIC HERE - All operations route to existing handlers
 */

class TransactionsView {
    constructor(app) {
        this.app = app;

        // Filter state
        this.selectedType = 'all'; // 'all', 'income', 'expense', 'transfer'
        this.selectedAccount = 'all';
        this.selectedMonth = null;
        this.selectedYear = null;
    }

    // ====== PUBLIC API ======

    /**
     * Get HTML for TransactionsView
     * Called by app navigation system
     */
    getHtml() {
        console.log('💳 Getting Transactions View HTML...');
        return this.getTransactionsHTML();
    }

    /**
     * Called after view is rendered to DOM
     * Setup event listeners and initialize UI
     */
    afterRender() {
        console.log('💳 Transactions View after render');
        this.setupFilters();
        this.setupActionHandlers();
    }

    /**
     * Cleanup when leaving view
     * Remove event listeners, clear state
     */
    destroy() {
        console.log('💳 Destroying Transactions View');

        // Clean up filter modal if it was moved to body
        // CRITICAL: Clean up filter popover
        const filterPopover = document.getElementById('filterPopover');
        if (filterPopover) filterPopover.remove();

        // Also remove FAB if it was moved (though FAB is usually fixed inside view, 
        // but to be safe if we change strategy later)
    }

    // ====== MAIN HTML GENERATION ======

    getTransactionsHTML() {
        // LOCKED DESIGN: Header is orientation only. Filters via trigger button.
        return `
            <!-- Header Row: Title/Subtitle Only -->
            <div style="margin-bottom: var(--space-6);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4);">
                    <div style="flex: 1; min-width: 0;">
                        <div class="section-title" style="margin-bottom: var(--space-2); color: var(--text-primary);">💳 Transaksi</div>
                        <div class="text-muted mobile-subtitle" style="
                            font-size: 0.9375rem; 
                            line-height: 1.5; 
                            letter-spacing: -0.01em;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            white-space: normal; /* Allow wrapping */
                        ">
                            Semua pemasukan, pengeluaran, dan transfer tercatat di sini
                        </div>
                    </div>
                    
                    <!-- Filter Trigger Button (Desktop & Mobile) -->
                    <button id="filterTriggerBtn" class="btn btn-outline" style="
                        flex-shrink: 0; 
                        display: flex; 
                        align-items: center; 
                        gap: 8px; 
                        padding: 8px 16px; 
                        border-radius: 8px; 
                        font-weight: 500;
                        font-size: 0.875rem;
                        background: var(--surface, white);
                        color: var(--text-primary);
                        border: 1px solid var(--border-color, rgba(127,127,127,0.2));
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    ">
                        <span style="font-size: 1.1em;">🌪️</span> 
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            <!-- Active Filters Display (Optional - shows what's active) -->
            <div id="activeFiltersDisplay" style="display: flex; gap: 8px; margin-bottom: var(--space-4); flex-wrap: wrap;">
                ${this.getActiveFiltersHTML()}
            </div>

            <!-- Transaction List Container -->
            <div style="background: var(--surface-secondary, rgba(0,0,0,0.01)); border-radius: 12px; padding: var(--space-4); padding-left: var(--space-5); min-height: 50vh;">
                <div class="transactions-list" id="transactionsList">
                    ${this.getTransactionListHTML()}
                </div>

                <!-- Empty State -->
                ${this.getEmptyStateHTML()}
            </div>

            <!-- Floating Action Button (FAB) -->
            <button id="fabAddTransaction" style="
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 28px;
                background: var(--primary, #2563eb);
                color: white;
                border: none;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 100;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <span>➕</span>
            </button>

            <!-- Filter Popover (Hidden by default) -->
            <!-- Lightweight container, no backdrop, no Apply button -->
            <div id="filterPopover" class="filter-popover">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 class="popover-title" style="margin: 0; font-size: 1rem; color: var(--text-primary);">Filter</h3>
                    <button id="closeFilterBtn" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted); padding: 0 4px;">&times;</button>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label class="filter-label" style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.8125rem; color: var(--text-secondary);">Jenis</label>
                        ${this.getTypeFilterHTML()}
                    </div>
                    <div>
                        <label class="filter-label" style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.8125rem; color: var(--text-secondary);">Akun</label>
                        ${this.getAccountFilterHTML()}
                    </div>
                    <div>
                        <label class="filter-label" style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.8125rem; color: var(--text-secondary);">Waktu</label>
                        ${this.getMonthFilterHTML()}
                    </div>
                </div>
            </div>
            
            <style>
                .filter-popover {
                    display: none;
                    position: fixed; /* Fixed relative to viewport for safety */
                    z-index: 9999;
                    background: var(--surface, #ffffff);
                    /* Desktop Styles (Default) */
                    width: 280px;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    border: 1px solid var(--border-color, rgba(127,127,127,0.1));
                    color: var(--text-primary);
                }
                .filter-popover.is-open {
                    display: block !important;
                    animation: popIn 0.15s ease-out;
                }

                @media (max-width: 600px) {
                    .filter-popover {
                        /* Mobile: Bottom Sheet logic overriding desktop positioning */
                        top: auto !important; /* Force bottom */
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        width: 100% !important;
                        border-radius: 16px 16px 0 0;
                        padding: 24px;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                        transform: translateY(100%); /* Start off-screen for animation */
                        display: block; /* Always display but hide via transform/visibility if needed to animate, but simpler to use display toggle */
                        background: var(--surface, #ffffff); /* Ensure opacity */
                        border-top: 1px solid var(--border-color, rgba(127,127,127,0.1));
                    }
                    .filter-popover.is-open {
                        transform: translateY(0);
                        animation: slideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }

                @keyframes popIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUpMobile {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                /* --- DARK MODE VISUAL POLISH (Class-Based) --- */
                body.dark-mode .filter-popover,
                [data-theme="dark"] .filter-popover {
                    background: #1e293b !important; /* Slate 800 */
                    border: 1px solid rgba(255,255,255,0.15) !important;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
                }
                body.dark-mode .popover-title,
                [data-theme="dark"] .popover-title {
                    color: #f8fafc !important; /* Slate 50 */
                }
                body.dark-mode .filter-label,
                [data-theme="dark"] .filter-label {
                    color: #cbd5e1 !important; /* Slate 300 */
                }
                body.dark-mode #closeFilterBtn,
                [data-theme="dark"] #closeFilterBtn {
                    color: #94a3b8 !important; /* Slate 400 */
                }

                /* Filter Inputs */
                body.dark-mode .filter-select,
                [data-theme="dark"] .filter-select {
                    background-color: #0f172a !important; /* Slate 900 */
                    color: #f1f5f9 !important; /* Slate 100 */
                    border: 1px solid rgba(255,255,255,0.2) !important;
                }
                body.dark-mode .filter-select:focus,
                [data-theme="dark"] .filter-select:focus {
                    border-color: #3b82f6 !important;
                    background-color: #1e293b !important;
                }

                /* Filter Trigger Button */
                body.dark-mode #filterTriggerBtn,
                [data-theme="dark"] #filterTriggerBtn {
                    background-color: #1e293b !important;
                    color: #f1f5f9 !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                }
                body.dark-mode #filterTriggerBtn:hover,
                [data-theme="dark"] #filterTriggerBtn:hover {
                    background-color: #334155 !important;
                }

                /* Transaction List */
                body.dark-mode .transaction-item,
                [data-theme="dark"] .transaction-item {
                    border-bottom-color: rgba(255,255,255,0.12) !important;
                }
                body.dark-mode .transaction-name,
                [data-theme="dark"] .transaction-name {
                    color: #f1f5f9 !important;
                }
                body.dark-mode .transaction-meta,
                [data-theme="dark"] .transaction-meta {
                    color: #94a3b8 !important;
                }
            </style>
        `;
    }

    // Helper to show active filter pills
    getActiveFiltersHTML() {
        const filters = [];
        if (this.selectedType !== 'all') filters.push(this.getTypeLabel(this.selectedType));
        if (this.selectedAccount !== 'all') filters.push(this.getAccountLabel(this.selectedAccount));
        if (this.selectedMonth && this.selectedYear) filters.push(`${this.getMonthName(this.selectedMonth)} ${this.selectedYear}`);

        if (filters.length === 0) return '';

        return filters.map(f => `
            <span style="
                font-size: 0.75rem; 
                padding: 4px 10px; 
                background: var(--surface-secondary, rgba(0,0,0,0.05)); 
                border-radius: 12px; 
                color: var(--text-muted, #6b7280);
                border: 1px solid rgba(0,0,0,0.05);
            ">${f}</span>
        `).join('');
    }

    // Helper labels
    getTypeLabel(val) {
        const map = { 'expense': 'Pengeluaran', 'income': 'Pendapatan', 'transfer': 'Transfer' };
        return map[val] || val;
    }
    getAccountLabel(id) {
        const acc = (this.app.state.accounts || []).find(a => a.id == id);
        return acc ? acc.name : 'Akun';
    }
    getMonthName(idx) {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Akt', 'Nov', 'Des'][idx];
    }

    // ====== FILTER HTML ======

    getTypeFilterHTML() {
        return `
            <select id="typeFilter" class="filter-select" style="
                font-size: 0.8125rem; 
                padding: 6px 12px; 
                border: 1px solid var(--border-color, rgba(0,0,0,0.1)); 
                border-radius: 8px; 
                background: var(--surface, white); 
                color: var(--text-primary, #1a1a1a);
                min-width: 110px; 
                height: 36px;
                cursor: pointer;
                outline: none;
                transition: border-color 0.15s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            " onfocus="this.style.borderColor='var(--primary, #2563eb)'" onblur="this.style.borderColor='var(--border-color, rgba(0,0,0,0.1))'">
                <option value="all">Semua Jenis</option>
                <option value="expense">💸 Pengeluaran</option>
                <option value="income">💰 Pendapatan</option>
                <option value="transfer">🔄 Transfer</option>
            </select>
        `;
    }

    getAccountFilterHTML() {
        const accounts = this.app.state.accounts || [];

        return `
            <select id="accountFilter" class="filter-select" style="
                font-size: 0.8125rem; 
                padding: 6px 12px; 
                border: 1px solid var(--border-color, rgba(0,0,0,0.1)); 
                border-radius: 8px; 
                background: var(--surface, white); 
                color: var(--text-primary, #1a1a1a);
                min-width: 110px; 
                height: 36px;
                cursor: pointer;
                outline: none;
                transition: border-color 0.15s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            " onfocus="this.style.borderColor='var(--primary, #2563eb)'" onblur="this.style.borderColor='var(--border-color, rgba(0,0,0,0.1))'">
                <option value="all">Semua Akun</option>
                ${accounts.map(acc => `
                    <option value="${acc.id}">${acc.icon} ${acc.name}</option>
                `).join('')}
            </select>
        `;
    }

    getMonthFilterHTML() {
        return `
            <select id="monthFilter" class="filter-select" style="
                font-size: 0.8125rem; 
                padding: 6px 12px; 
                border: 1px solid var(--border-color, rgba(0,0,0,0.1)); 
                border-radius: 8px; 
                background: var(--surface, white); 
                color: var(--text-primary, #1a1a1a);
                min-width: 110px; 
                height: 36px;
                cursor: pointer;
                outline: none;
                transition: border-color 0.15s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            " onfocus="this.style.borderColor='var(--primary, #2563eb)'" onblur="this.style.borderColor='var(--border-color, rgba(0,0,0,0.1))'">
                <option value="all">Semua Bulan</option>
                <option value="current">Bulan Ini</option>
                <option value="prev">Bulan Lalu</option>
            </select>
        `;
    }

    // ====== TRANSACTION LIST ======

    getTransactionListHTML() {
        const transactions = this.getFilteredTransactions();

        if (transactions.length === 0) {
            return ''; // Empty state will show
        }

        // Group by date
        const grouped = this.groupByDate(transactions);

        let html = '';
        for (const [date, items] of Object.entries(grouped)) {
            html += `
                <div class="transaction-group">
                    <div class="transaction-date">${this.formatDate(date)}</div>
                    ${items.map(tx => this.getTransactionItemHTML(tx)).join('')}
                </div>
            `;
        }

        return html;
    }

    getTransactionItemHTML(transaction) {
        const { type, icon, name, amount, category, account, id } = transaction;

        // Determine available actions based on type
        const actions = this.getActions(type);
        const hasActions = actions.length > 0;

        return `
            <div class="transaction-item" data-type="${type}" data-id="${id}" style="padding: var(--space-4) 0; border-bottom: 1px solid var(--border-subtle, rgba(127,127,127,0.1)); display: flex; align-items: center; gap: var(--space-4); transition: all 0.15s ease; position: relative;">
                <div class="transaction-icon" style="font-size: 1.5rem; line-height: 1; flex-shrink: 0; opacity: 0.9;">${icon || this.getDefaultIcon(type)}</div>
                <div class="transaction-details" style="flex: 1; min-width: 0;">
                    <div class="transaction-name" style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 3px; color: var(--text-primary, #1a1a1a); letter-spacing: -0.01em;">${name}</div>
                    <div class="transaction-meta" style="font-size: 0.8125rem; color: var(--text-muted, #6b7280); display: flex; align-items: center; gap: 6px;">
                        ${category ? `<span>${category}</span><span style="opacity: 0.4;">·</span>` : ''}
                        <span>${account}</span>
                    </div>
                </div>
                <!-- Amount Styling: Muted Green for Income (#059669), Soft Red for Expense (#dc2626) -->
                <div class="transaction-amount" style="
                    font-weight: 600; 
                    font-size: 0.9375rem; 
                    white-space: nowrap; 
                    font-variant-numeric: tabular-nums; 
                    letter-spacing: -0.02em; 
                    text-align: right; 
                    min-width: 120px; 
                    margin-right: var(--space-2);
                    color: ${type === 'income' ? 'var(--amount-in, #059669)' : type === 'expense' ? 'var(--amount-out, #dc2626)' : 'var(--text-primary, #1a1a1a)'};
                ">
                    ${type === 'income' ? '+' : type === 'expense' ? '-' : ''}${this.app.calculator.formatCurrency(amount)}
                </div>
                ${hasActions ? `
                    <div class="transaction-overflow" style="flex-shrink: 0; position: relative;">
                        <button class="overflow-btn" onclick="toggleTransactionMenu('${id}')" style="padding: 6px 8px; border: none; background: transparent; cursor: pointer; color: var(--text-muted, #9ca3af); font-size: 1.125rem; line-height: 1; transition: all 0.15s ease; border-radius: 4px;">⋮</button>
                        <div class="overflow-menu" id="transaction-menu-${id}" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 140px; z-index: 100;">
                            ${this.getOverflowMenuHTML(actions, type, id)}
                        </div>
                    </div>
                ` : '<div style="width: 32px; flex-shrink: 0;"></div>'}
            </div>
        `;
    }

    /**
     * Get available actions based on transaction type
     * SCOPE LIMITATION: Intentionally restricted per Phase 2 requirements
     */
    getActions(type) {
        switch (type) {
            case 'expense':
                return ['edit', 'delete', 'duplicate'];
            case 'income':
                // NO EDIT for income (intentional scope limitation)
                return ['delete', 'duplicate'];
            case 'transfer':
                // VIEW ONLY (intentional scope limitation - no delete/undo for transfers in Phase 2)
                return [];
            default:
                return [];
        }
    }

    getActionsHTML(actions, type, id) {
        return actions.map(action => {
            const icons = {
                edit: '✏️',
                delete: '🗑️',
                duplicate: '📋'
            };

            return `
    < button class="btn-icon transaction-action"
data - action="${action}"
data - type="${type}"
data - id="${id}"
title = "${this.getActionTitle(action)}" >
    ${icons[action]}
                </button >
    `;
        }).join('');
    }

    getOverflowMenuHTML(actions, type, id) {
        const actionLabels = {
            edit: { icon: '✏️', label: 'Edit' },
            delete: { icon: '🗑️', label: 'Hapus' },
            duplicate: { icon: '📋', label: 'Duplicate' }
        };

        return actions.map(action => {
            const { icon, label } = actionLabels[action] || { icon: '', label: action };
            return `
    < button class="overflow-menu-item"
data - action="${action}"
data - type="${type}"
data - id="${id}"
style = "width: 100%; padding: 10px 14px; border: none; background: transparent; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.875rem; transition: background-color 0.15s ease; color: var(--text-primary, #1a1a1a);"
onmouseover = "this.style.background='rgba(0,0,0,0.04)'"
onmouseout = "this.style.background='transparent'" >
                    <span style="font-size: 1rem;">${icon}</span>
                    <span>${label}</span>
                </button >
    `;
        }).join('');
    }

    // ====== EMPTY STATE ======

    getEmptyStateHTML() {
        const transactions = this.getFilteredTransactions();

        if (transactions.length > 0) {
            return '';
        }

        return `
    < div class="empty-state" style = "text-align: center; padding: var(--space-8) var(--space-4); color: var(--text-muted); max-width: 400px; margin: 0 auto;" >
                <div style="font-size: 2.5rem; margin-bottom: var(--space-4); opacity: 0.6;">📭</div>
                <div style="font-size: 1rem; line-height: 1.6; margin-bottom: var(--space-2);">Tidak ada transaksi di sini.</div>
                <div style="font-size: 0.875rem; opacity: 0.7; line-height: 1.5;">Anda bisa mulai kapan saja.</div>
            </div >
    `;
    }

    // ====== FILTER LOGIC ======

    setupFilters() {
        // LOCKED DESIGN: Popover/Overflow Logic
        const filterTrigger = document.getElementById('filterTriggerBtn');
        const filterPopover = document.getElementById('filterPopover');
        const closeFilterBtn = document.getElementById('closeFilterBtn');

        // CRITICAL: Ensure popover is in body for correct positioning
        if (filterPopover && filterPopover.parentElement !== document.body) {
            // Safety: Remove any zombie popovers left from previous sessions
            const existing = document.querySelectorAll('#filterPopover');
            if (existing.length > 0) {
                existing.forEach(el => {
                    if (el !== filterPopover && el.parentElement === document.body) {
                        el.remove();
                    }
                });
            }
            document.body.appendChild(filterPopover);
        }

        const closePopover = () => {
            if (filterPopover) filterPopover.classList.remove('is-open');
        };

        if (closeFilterBtn) closeFilterBtn.addEventListener('click', closePopover);

        // Toggle & Position
        if (filterTrigger) {
            filterTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent immediate close by document listener

                if (!filterPopover) return;

                if (filterPopover.classList.contains('is-open')) {
                    closePopover();
                } else {
                    filterPopover.classList.add('is-open');
                    this.updateActiveFiltersDisplay();

                    // Desktop Positioning Logic
                    if (window.innerWidth > 600) {
                        const rect = filterTrigger.getBoundingClientRect();
                        const popoverWidth = 280; // Match CSS

                        // Right-aligned to the button
                        let left = rect.right - popoverWidth;
                        // But ensure doesn't overflow left screen edge
                        if (left < 10) left = 10;

                        filterPopover.style.top = (rect.bottom + 8) + 'px';
                        filterPopover.style.left = left + 'px';
                        filterPopover.style.width = popoverWidth + 'px';
                    } else {
                        // Mobile: handled by CSS (bottom: 0)
                        filterPopover.style.top = '';
                        filterPopover.style.left = '';
                        filterPopover.style.width = '';
                    }
                }
            });
        }

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (filterPopover && filterPopover.classList.contains('is-open')) {
                // If click is NOT inside popover AND NOT on the trigger
                if (!filterPopover.contains(e.target) && !filterTrigger.contains(e.target)) {
                    closePopover();
                }
            }
        });

        // Filter Logic - reuse existing logic but ensure elements are found (they are now in modal)
        const typeFilter = document.getElementById('typeFilter');
        const accountFilter = document.getElementById('accountFilter');
        const monthFilter = document.getElementById('monthFilter');

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.selectedType = e.target.value;
                this.updateActiveFiltersDisplay();
                // We refresh list immediately, or we could wait for "Apply" - keeping instant for responsiveness
                this.refreshList();
            });
        }

        if (accountFilter) {
            accountFilter.addEventListener('change', (e) => {
                this.selectedAccount = e.target.value;
                this.updateActiveFiltersDisplay();
                this.refreshList();
            });
        }

        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                const value = e.target.value;
                const now = new Date();

                if (value === 'all') {
                    this.selectedMonth = null;
                    this.selectedYear = null;
                } else if (value === 'current') {
                    this.selectedMonth = now.getMonth();
                    this.selectedYear = now.getFullYear();
                } else if (value === 'prev') {
                    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    this.selectedMonth = prev.getMonth();
                    this.selectedYear = prev.getFullYear();
                }
                this.updateActiveFiltersDisplay();
                this.refreshList();
            });
        }
    }

    updateActiveFiltersDisplay() {
        const container = document.getElementById('activeFiltersDisplay');
        if (container) {
            container.innerHTML = this.getActiveFiltersHTML();
        }
    }

    getFilteredTransactions() {
        // Merge all transaction types
        const allTransactions = [];

        // Income
        (this.app.state.transactions.income || []).forEach(tx => {
            allTransactions.push({ ...tx, type: 'income' });
        });

        // Expenses
        (this.app.state.transactions.expenses || []).forEach(tx => {
            allTransactions.push({ ...tx, type: 'expense' });
        });

        // Transfers
        (this.app.state.transactions.transfers || []).forEach(tx => {
            allTransactions.push({ ...tx, type: 'transfer' });
        });

        // Apply filters
        let filtered = allTransactions;

        // Type filter
        if (this.selectedType !== 'all') {
            filtered = filtered.filter(tx => tx.type === this.selectedType);
        }

        // Account filter
        if (this.selectedAccount !== 'all') {
            const accountId = parseInt(this.selectedAccount);
            filtered = filtered.filter(tx => {
                if (tx.type === 'transfer') {
                    return tx.fromAccountId === accountId || tx.toAccountId === accountId;
                }
                return tx.accountId === accountId;
            });
        }

        // Month/Year filter
        if (this.selectedMonth !== null && this.selectedYear !== null) {
            filtered = filtered.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate.getMonth() === this.selectedMonth &&
                    txDate.getFullYear() === this.selectedYear;
            });
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filtered;
    }

    // ====== ACTION HANDLERS ======

    setupActionHandlers() {
        // FAB (Floating Action Button) Handler
        const fab = document.getElementById('fabAddTransaction');
        if (fab) {
            fab.addEventListener('click', () => {
                this.app.uiManager.openModal('addTransactionModal');
            });
        }

        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        // Global menu toggle function
        window.toggleTransactionMenu = (id) => {
            const menu = document.getElementById(`transaction - menu - ${id} `);
            if (!menu) return;

            // Close all other menus
            document.querySelectorAll('.overflow-menu').forEach(m => {
                if (m.id !== `transaction - menu - ${id} `) {
                    m.style.display = 'none';
                }
            });

            // Toggle this menu
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        };

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.transaction-overflow')) {
                document.querySelectorAll('.overflow-menu').forEach(m => {
                    m.style.display = 'none';
                });
            }
        });

        // Handle action clicks from overflow menu
        transactionsList.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.overflow-menu-item');
            if (!menuItem) return;

            const action = menuItem.dataset.action;
            const type = menuItem.dataset.type;
            const id = parseInt(menuItem.dataset.id);

            // Close menu
            const menu = menuItem.closest('.overflow-menu');
            if (menu) menu.style.display = 'none';

            // Execute action
            this.handleAction(action, type, id);
        });
    }

    /**
     * Route actions to existing handlers (NO NEW LOGIC)
     */
    handleAction(action, type, id) {
        console.log(`💳 Action: ${action} on ${type} ${id} `);

        switch (action) {
            case 'delete':
                // Reuse existing delete handler from app.js
                this.app.deleteTransaction(type, id);
                break;

            case 'duplicate':
                // Reuse existing duplicate handler from FormHandlers
                this.app.formHandlers.handleDuplicateTransaction(type, id);
                break;

            case 'edit':
                if (type === 'expense') {
                    // Reuse existing edit handler
                    this.handleEditExpense(id);
                }
                // Income edit not supported (intentional scope limitation)
                break;

            default:
                console.warn('Unknown action:', action);
        }
    }

    handleEditExpense(id) {
        // Find expense
        const expense = this.app.state.transactions.expenses.find(e => e.id == id);
        if (!expense) return;

        // Open edit modal (reusing existing modal)
        this.app.uiManager.openModal('editExpenseModal');

        // Populate form (reusing existing logic pattern)
        document.getElementById('editExpenseId').value = expense.id;
        document.getElementById('editExpenseName').value = expense.name;
        document.getElementById('editExpenseAmount').value = expense.amount;
        document.getElementById('editExpenseCategory').value = expense.category;
        document.getElementById('editExpenseDate').value = expense.date;

        const noteField = document.getElementById('editExpenseNote');
        if (noteField && expense.note) {
            noteField.value = expense.note;
        }
    }

    // ====== UTILITY METHODS ======

    groupByDate(transactions) {
        const grouped = {};

        transactions.forEach(tx => {
            const date = tx.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(tx);
        });

        return grouped;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hari Ini';
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Kemarin';
        }

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }

    getDefaultIcon(type) {
        const icons = {
            income: '💰',
            expense: '💸',
            transfer: '🔄'
        };
        return icons[type] || '📄';
    }

    refreshList() {
        const list = document.getElementById('transactionsList');
        if (list) {
            list.innerHTML = this.getTransactionListHTML();
        }

        // Also update empty state
        const emptyState = document.querySelector('.empty-state');
        const newEmptyState = this.getEmptyStateHTML();

        if (newEmptyState && !emptyState) {
            // Add empty state
            list.insertAdjacentHTML('afterend', newEmptyState);
        } else if (!newEmptyState && emptyState) {
            // Remove empty state
            emptyState.remove();
        }
    }
}

export default TransactionsView;
