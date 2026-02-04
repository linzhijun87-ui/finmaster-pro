/* ====== INSIGHT ENGINE MODULE ====== */
/* Human-centered insights for FinMaster Pro
 * Philosophy: Companion, not auditor
 * Max 1 insight per dashboard load
 * Silence is better than noise
 */

class InsightEngine {
    constructor(app) {
        this.app = app;
        this.lastShownInsight = null; // Track to avoid spam
        this.lastShownDate = null;
    }

    /**
     * Main entry point: Get one meaningful insight based on context
     * Returns {icon, message, type} or null
     * 
     * @param {string} context - 'dashboard', 'budget', 'expense', or 'income'
     */
    getInsight(context = 'dashboard') {
        // Route to context-specific logic
        switch (context) {
            case 'budget':
                return this.getBudgetInsight();
            case 'expense':
                return this.getExpenseInsight();
            case 'income':
                return this.getIncomeInsight();
            default:
                return this.getDashboardInsight();
        }
    }

    /**
     * Dashboard Insights: Global state overview
     * Mood: Calm observer
     * Philosophy: "What matters right now?" not "What can I say?"
     */
    getDashboardInsight() {
        // Rules in priority order (most important first)
        const rules = [
            this.monthlyHealthInsight.bind(this),
            this.dominantCategoryInsight.bind(this),
            this.spendingChangeInsight.bind(this),
            this.activityInsight.bind(this),
            this.positiveReinforcementInsight.bind(this)
        ];

        // Try each rule - return first meaningful insight
        for (const rule of rules) {
            const insight = rule();
            if (insight) {
                console.log('💡 Dashboard insight:', insight.message);
                this.lastShownInsight = insight.message;
                this.lastShownDate = new Date().toDateString();
                return insight;
            }
        }

        console.log('💡 No dashboard insights (silence is OK)');
        return null;
    }

    /**
     * INSIGHT #1: Monthly Financial Health (MOST IMPORTANT)
     * Compare income vs expense this month
     */
    monthlyHealthInsight() {
        const monthlyIncome = this.app.state.finances.monthlyIncome || 0;
        const monthlyExpenses = this.app.state.finances.monthlyExpenses || 0;

        // Need some data to be meaningful
        if (monthlyIncome === 0 && monthlyExpenses === 0) return null;

        const balance = monthlyIncome - monthlyExpenses;
        const balanceRatio = monthlyIncome > 0 ? (balance / monthlyIncome) : 0;

        // Positive balance (saving mode)
        if (balance > 0 && balanceRatio >= 0.1) {
            return {
                icon: '😊',
                message: 'Kabar baik, bulan ini kamu masih bisa menabung',
                type: 'positive'
            };
        }

        // Balanced (breakeven)
        if (Math.abs(balanceRatio) < 0.1) {
            return {
                icon: '⚖️',
                message: 'Sejauh ini pemasukan dan pengeluaran masih seimbang',
                type: 'neutral'
            };
        }

        // Negative balance (deficit)
        if (balance < 0) {
            return {
                icon: '💭',
                message: 'Bulan ini agak berat, pengeluaran lebih besar dari pemasukan',
                type: 'awareness'
            };
        }

        return null;
    }

    /**
     * INSIGHT #2: Dominant Spending Category
     * Show which category takes the most money
     */
    dominantCategoryInsight() {
        const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM
        const expenses = this.app.state.transactions.expenses || [];

        // Filter to current month
        const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));

        if (monthExpenses.length === 0) return null;

        // Group by category
        const categoryTotals = {};
        monthExpenses.forEach(e => {
            const cat = e.category || 'lainnya';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
        });

        // Find dominant
        let maxCategory = null;
        let maxAmount = 0;

        for (const [cat, amount] of Object.entries(categoryTotals)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                maxCategory = cat;
            }
        }

        if (!maxCategory || maxAmount === 0) return null;

        // Get category display name
        const categoryObj = this.app.categoryManager?.getCategoryByKey(maxCategory);
        const categoryName = categoryObj ? `${categoryObj.icon} ${categoryObj.name}` : maxCategory;

        return {
            icon: '📊',
            message: `Pengeluaran terbesar bulan ini ada di ${categoryName}`,
            type: 'info'
        };
    }

    /**
     * INSIGHT #3: Spending Change Awareness
     * Detect behavior shifts (±20% threshold)
     */
    spendingChangeInsight() {
        const expenses = this.app.state.transactions.expenses || [];
        if (expenses.length < 5) return null; // Need enough data

        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonthStr = currentMonth.toISOString().split('T')[0].substring(0, 7);
        const lastMonthStr = lastMonth.toISOString().split('T')[0].substring(0, 7);

        // Group by category for both months
        const currentByCategory = this.groupExpensesByCategory(expenses, currentMonthStr);
        const lastByCategory = this.groupExpensesByCategory(expenses, lastMonthStr);

        // Find significant changes
        for (const [cat, currentAmount] of Object.entries(currentByCategory)) {
            const lastAmount = lastByCategory[cat] || 0;

            if (lastAmount === 0) continue; // No comparison possible

            const changePercent = ((currentAmount - lastAmount) / lastAmount) * 100;

            // Increased significantly
            if (changePercent >= 20 && currentAmount > 100000) {
                const categoryObj = this.app.categoryManager?.getCategoryByKey(cat);
                const categoryName = categoryObj ? categoryObj.name : cat;

                return {
                    icon: '📈',
                    message: `Sepertinya pengeluaran ${categoryName} lebih sering dibanding bulan lalu`,
                    type: 'awareness'
                };
            }

            // Decreased significantly (positive!)
            if (changePercent <= -20 && lastAmount > 100000) {
                const categoryObj = this.app.categoryManager?.getCategoryByKey(cat);
                const categoryName = categoryObj ? categoryObj.name : cat;

                return {
                    icon: '👏',
                    message: `Nice! Pengeluaran ${categoryName} turun dibanding bulan lalu`,
                    type: 'positive'
                };
            }
        }

        return null;
    }

    /**
     * INSIGHT #4: Activity & Consistency Awareness
     * Make app feel present and aware
     */
    activityInsight() {
        const allTransactions = [
            ...(this.app.state.transactions.income || []),
            ...(this.app.state.transactions.expenses || [])
        ];

        if (allTransactions.length === 0) return null;

        const today = new Date().toISOString().split('T')[0];

        // Check if user added transaction today
        const todayTransactions = allTransactions.filter(t => t.date === today);
        const hasActivityToday = todayTransactions.some(t => {
            const createdDate = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : null;
            return createdDate === today;
        });

        if (hasActivityToday) {
            return {
                icon: '👍',
                message: 'Catatan hari ini sudah dimulai',
                type: 'positive'
            };
        }

        // Check for inactivity (no transactions in last 3 days)
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
        const recentTransactions = allTransactions.filter(t => {
            const createdDate = t.createdAt ? new Date(t.createdAt) : new Date(t.date);
            return createdDate >= threeDaysAgo;
        });

        if (recentTransactions.length === 0 && allTransactions.length > 5) {
            return {
                icon: '💭',
                message: 'Sudah beberapa hari belum ada catatan. Tidak apa-apa, mulai lagi kapan pun',
                type: 'supportive'
            };
        }

        return null;
    }

    /**
     * INSIGHT #5: Positive Reinforcement
     * Encourage without pressure
     */
    positiveReinforcementInsight() {
        const monthlyIncome = this.app.state.finances.monthlyIncome || 0;
        const monthlyExpenses = this.app.state.finances.monthlyExpenses || 0;

        if (monthlyIncome === 0 && monthlyExpenses === 0) return null;

        const balance = monthlyIncome - monthlyExpenses;

        // Financial state is stable
        if (balance >= 0 && monthlyExpenses > 0) {
            const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;

            if (savingsRate >= 20) {
                return {
                    icon: '🙌',
                    message: 'Pelan-pelan tapi konsisten. Good job',
                    type: 'positive'
                };
            }

            if (savingsRate >= 0) {
                return {
                    icon: '✨',
                    message: 'Keuanganmu cukup terkendali bulan ini',
                    type: 'positive'
                };
            }
        }

        return null; // No positive reinforcement needed
    }

    // ============================================
    // TAB-SPECIFIC INSIGHTS
    // ============================================

    /**
     * Budget Insights: Gentle financial advisor
     * Mood: Calm, constructive, never alarmist
     * Priority: proximity over totals
     */
    getBudgetInsight() {
        const budgetsWithSpending = this.app.calculator.getBudgetsWithSpending();

        if (!budgetsWithSpending || budgetsWithSpending.length === 0) {
            return null; // No budgets = silence
        }

        // Find critical budgets
        const overBudget = budgetsWithSpending.filter(b => b.progress > 100);
        const nearLimit = budgetsWithSpending.filter(b => b.progress >= 80 && b.progress <= 100);
        const safe = budgetsWithSpending.filter(b => b.progress < 60);

        // PRIORITY 1: Over budget (honest but calm)
        if (overBudget.length > 0) {
            // Pick the most over budget
            const worst = overBudget.reduce((a, b) => a.progress > b.progress ? a : b);
            const categoryName = this.app.categoryManager?.getCategoryByKey(worst.category)?.name || worst.category;

            return {
                icon: '📊',
                message: `Anggaran ${categoryName} sudah terlewati, tapi tidak masalah — ini info saja`,
                type: 'info'
            };
        }

        // PRIORITY 2: Near limit (gentle heads-up)
        if (nearLimit.length > 0) {
            const nearest = nearLimit.reduce((a, b) => a.progress > b.progress ? a : b);
            const categoryName = this.app.categoryManager?.getCategoryByKey(nearest.category)?.name || nearest.category;

            return {
                icon: '👀',
                message: `Anggaran ${categoryName} hampir habis, mungkin perlu dijaga sedikit`,
                type: 'info'
            };
        }

        // PRIORITY 3: Multiple safe (reassurance)
        if (safe.length >= budgetsWithSpending.length * 0.7) {
            return {
                icon: '✅',
                message: 'Sebagian besar anggaran masih dalam batas aman',
                type: 'positive'
            };
        }

        // DEFAULT: Silence (healthy range 60-80%)
        console.log('💡 Budget insights: healthy range, silence is best');
        return null;
    }

    /**
     * Expense Insights: Pattern observer
     * Mood: Curious, behavioral focus
     * NOT about totals, about patterns
     */
    getExpenseInsight() {
        const expenses = this.app.state.transactions.expenses || [];

        if (expenses.length === 0) {
            return null; // No data = silence
        }

        // Check for long silence (7+ days no activity)
        const today = new Date();
        const recentExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const daysDiff = (today - expenseDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        });

        if (recentExpenses.length === 0 && expenses.length > 0) {
            return {
                icon: '🤔',
                message: 'Belum ada pengeluaran minggu ini — semua baik?',
                type: 'neutral'
            };
        }

        // DEFAULT: Silence (normal patterns)
        console.log('💡 Expense insights: normal patterns, silence is best');
        return null;
    }

    /**
     * Income Insights: Mostly silent
     * Mood: Neutral observer
     * Philosophy: Stability doesn't need commentary
     */
    getIncomeInsight() {
        const income = this.app.state.transactions.income || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const dayOfMonth = now.getDate();

        // Check for income this month
        const thisMonthIncome = income.filter(i => {
            const incomeDate = new Date(i.date);
            return incomeDate.getMonth() === currentMonth &&
                incomeDate.getFullYear() === currentYear;
        });

        // Only speak if no income AND past 15th of month
        if (thisMonthIncome.length === 0 && dayOfMonth > 15) {
            return {
                icon: '💭',
                message: 'Belum ada pendapatan bulan ini',
                type: 'neutral'
            };
        }

        // DEFAULT: Silence (income exists or too early in month)
        console.log('💡 Income insights: stable or too early, silence is best');
        return null;
    }

    // ====== HELPER METHODS ======

    groupExpensesByCategory(expenses, monthStr) {
        const grouped = {};
        expenses
            .filter(e => e.date && e.date.startsWith(monthStr))
            .forEach(e => {
                const cat = e.category || 'lainnya';
                grouped[cat] = (grouped[cat] || 0) + e.amount;
            });
        return grouped;
    }
}

export default InsightEngine;
