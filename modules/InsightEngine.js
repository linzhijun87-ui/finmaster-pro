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
     * Main entry point: Get one meaningful insight
     * Returns {icon, message, type} or null
     */
    getInsight() {
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
                console.log('💡 Insight generated:', insight.message);
                this.lastShownInsight = insight.message;
                this.lastShownDate = new Date().toDateString();
                return insight;
            }
        }

        console.log('💡 No insights to show (silence is OK)');
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
