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
        
        // Calculate savings (income - expenses)
        const totalSavings = totalIncome - totalExpenses;
        
        // Calculate balance
        const balance = totalSavings;
        
        // Update state
        this.app.state.finances = {
            income: totalIncome,
            expenses: totalExpenses,
            savings: totalSavings,
            balance: balance
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
}

export default FinanceCalculator;