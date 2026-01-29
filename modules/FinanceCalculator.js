/* ====== FINANCE CALCULATOR MODULE ====== */

import { APP_CONFIG } from '../utils/Constants.js';

class FinanceCalculator {
    constructor(app) {
        this.app = app;
    }

    // ====== FINANCIAL CALCULATIONS ======
    calculateFinances() {
        console.log('🧮 Calculating finances...');

        // Calculate total income
        const totalIncome = this.app.state.transactions.income.reduce((sum, item) => sum + item.amount, 0);

        // Calculate total expenses
        const totalExpenses = this.app.state.transactions.expenses.reduce((sum, item) => sum + item.amount, 0);

        // Calculate net balance (income - expenses)
        // This represents total wealth/buying power BEFORE allocation
        const netBalance = totalIncome - totalExpenses;

        // Calculate total allocated to goals
        const totalAllocated = this.app.state.goals.reduce((sum, goal) => sum + (goal.current || 0), 0);

        // Calculate available cash (Buying Power)
        // Available Cash = Net Balance - Total Allocated
        const availableCash = netBalance - totalAllocated;

        // Update state with new structure
        this.app.state.finances = {
            income: totalIncome,
            expenses: totalExpenses,
            savings: netBalance, // Legacy alias for net balance
            netBalance: netBalance,
            totalAllocated: totalAllocated,
            availableCash: availableCash, // This is what can be used for new allocations
            balance: netBalance // Legacy alias
        };

        // Auto-save if enabled
        if (this.app.state.settings.autoSave) {
            this.app.dataManager.saveData(true);
        }

        console.log('✅ Finances calculated:', this.app.state.finances);
    }

    // ====== CURRENCY FORMATTING ======
    formatCurrency(amount) {
        const currency = this.app.state.settings.currency || APP_CONFIG.DEFAULT_CURRENCY;

        try {
            const formatter = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

            return formatter.format(amount);
        } catch (error) {
            console.error('Currency formatting error:', error);
            // Fallback formatting
            return `${currency} ${amount.toLocaleString('id-ID')}`;
        }
    }

    // ====== FINANCIAL ANALYSIS ======
    calculateSavingsRate() {
        if (this.app.state.finances.income === 0) return 0;
        const rate = (this.app.state.finances.savings / this.app.state.finances.income) * 100;
        return Math.round(rate * 10) / 10; // 1 decimal place
    }

    calculateExpenseRatio() {
        if (this.app.state.finances.income === 0) return 0;
        const ratio = (this.app.state.finances.expenses / this.app.state.finances.income) * 100;
        return Math.round(ratio * 10) / 10;
    }

    calculateMonthlyAverage(type) {
        const transactions = this.app.state.transactions[type];
        if (transactions.length === 0) return 0;

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        const months = this.getTransactionMonthsCount(transactions);

        return months > 0 ? Math.round(total / months) : Math.round(total / 12);
    }

    getTransactionMonthsCount(transactions) {
        const uniqueMonths = new Set();

        transactions.forEach(transaction => {
            try {
                const date = new Date(transaction.date);
                const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
                uniqueMonths.add(monthYear);
            } catch (e) {
                // Skip invalid dates
            }
        });

        return uniqueMonths.size || 1; // Return at least 1
    }

    // ====== GOAL CALCULATIONS ======
    calculateGoalProgress(goal) {
        if (!goal || goal.target === 0) return 0;
        return Math.round((goal.current / goal.target) * 100);
    }

    calculateTimeToGoal(goal, monthlyContribution) {
        if (!goal || monthlyContribution <= 0) return Infinity;

        const remaining = goal.target - goal.current;
        const months = Math.ceil(remaining / monthlyContribution);

        return {
            months: months,
            years: Math.ceil(months / 12),
            completionDate: this.addMonthsToDate(new Date(), months)
        };
    }

    addMonthsToDate(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    // ====== INVESTMENT CALCULATIONS ======
    calculateFutureValue(initial, monthly, annualReturn, years) {
        const monthlyReturn = annualReturn / 12 / 100;
        const months = years * 12;

        let futureValue = initial * Math.pow(1 + monthlyReturn, months);

        for (let i = 0; i < months; i++) {
            futureValue += monthly * Math.pow(1 + monthlyReturn, months - i - 1);
        }

        return Math.round(futureValue);
    }

    calculateLoanPayment(amount, annualRate, years, type = 'annuity') {
        const months = years * 12;
        const monthlyRate = annualRate / 12 / 100;

        if (type === 'flat') {
            const totalInterest = amount * annualRate / 100 * years;
            const totalPayment = amount + totalInterest;
            return Math.round(totalPayment / months);
        } else {
            // Annuity calculation
            const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1);
            return Math.round(monthlyPayment);
        }
    }

    // ====== BUDGET CALCULATIONS (DERIVED FROM TRANSACTIONS) ======

    /**
     * Calculate current spending for a budget by deriving from expense transactions
     * This is the ONLY way to get budget spending - never stored/incremented
     */
    calculateBudgetSpending(budget) {
        if (!budget) return 0;

        const periodKey = budget.periodKey; // e.g., "2026-01"
        const [year, month] = periodKey.split('-').map(Number);

        // Filter expenses by category and period
        const categoryExpenses = this.app.state.transactions.expenses.filter(expense => {
            if (expense.category !== budget.category) return false;

            const expenseDate = new Date(expense.date);
            const expenseYear = expenseDate.getFullYear();
            const expenseMonth = expenseDate.getMonth() + 1; // 0-indexed to 1-indexed

            // For monthly budgets, match exact period
            if (budget.duration === 'monthly') {
                return expenseYear === year && expenseMonth === month;
            }

            // For weekly/yearly, calculate from lastResetAt
            if (budget.duration === 'weekly') {
                const resetDate = new Date(budget.lastResetAt);
                const weekLater = new Date(resetDate);
                weekLater.setDate(weekLater.getDate() + 7);
                return expenseDate >= resetDate && expenseDate < weekLater;
            }

            if (budget.duration === 'yearly') {
                return expenseYear === year;
            }

            return false;
        });

        // Sum up expenses
        const totalSpent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return totalSpent;
    }

    /**
     * Calculate budget progress percentage
     */
    calculateBudgetProgress(budget) {
        if (!budget || budget.amount === 0) return 0;

        const spent = this.calculateBudgetSpending(budget);
        const progress = Math.round((spent / budget.amount) * 100);

        return Math.min(progress, 999); // Cap at 999% for display
    }

    /**
     * Get budget status based on spending
     */
    getBudgetStatus(budget) {
        if (!budget) return 'safe';

        const spent = this.calculateBudgetSpending(budget);
        const progress = (spent / budget.amount) * 100;

        if (spent > budget.amount) return 'overspent';
        if (progress >= 90) return 'danger';
        if (progress >= 70) return 'warning';
        return 'safe';
    }

    /**
     * Get all budgets with derived spending data
     * This enriches budget objects with calculated spending for display
     */
    getBudgetsWithSpending() {
        if (!this.app.state.budgets) return [];

        return this.app.state.budgets.map(budget => ({
            ...budget,
            spent: this.calculateBudgetSpending(budget),
            progress: this.calculateBudgetProgress(budget),
            status: this.getBudgetStatus(budget)
        }));
    }

    /**
     * Check if budget is overspent
     */
    isBudgetOverspent(budget) {
        const spent = this.calculateBudgetSpending(budget);
        return spent > budget.amount;
    }

    /**
     * Get remaining budget amount
     */
    getBudgetRemaining(budget) {
        const spent = this.calculateBudgetSpending(budget);
        return budget.amount - spent;
    }

    // ====== ACCOUNT BALANCE CALCULATIONS (DERIVED) ======

    /**
     * Calculate current balance for a specific account
     * Balance = initialBalance + income - expenses
     */
    calculateAccountBalance(account) {
        if (!account) return 0;

        let balance = parseInt(account.initialBalance) || 0;

        // Add all income to this account
        const accountIncome = this.app.state.transactions.income
            .filter(i => i.accountId == account.id)
            .reduce((sum, i) => sum + (parseInt(i.amount) || 0), 0);

        // Subtract all expenses from this account
        const accountExpenses = this.app.state.transactions.expenses
            .filter(e => e.accountId == account.id)
            .reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);

        balance = balance + accountIncome - accountExpenses;

        return balance;
    }

    /**
     * Get all accounts with calculated balances
     * Returns accounts enriched with currentBalance property
     */
    getAccountsWithBalances() {
        return this.app.state.accounts.map(account => ({
            ...account,
            currentBalance: this.calculateAccountBalance(account)
        }));
    }

    /**
     * Get total balance across all active accounts
     */
    getTotalAccountBalance() {
        return this.app.state.accounts
            .filter(a => a.active)
            .reduce((sum, account) => sum + this.calculateAccountBalance(account), 0);
    }

    /**
     * Get account balance by ID
     */
    getAccountBalanceById(accountId) {
        const account = this.app.state.accounts.find(a => a.id == accountId);
        return this.calculateAccountBalance(account);
    }
}

export default FinanceCalculator;