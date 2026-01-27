/* ====== FINANCIAL ASSISTANT MODULE ====== */

class FinancialAssistant {
    constructor(app) {
        this.app = app;
        this.goals = [
            { id: 'emergency', name: 'Emergency Fund', target: 30000000, priority: 1, dueYears: 1 },
            { id: 'wedding', name: 'Wedding', target: 100000000, priority: 2, dueYears: 3 },
            { id: 'vacation', name: 'Vacation', target: 50000000, priority: 3, dueYears: 2 }
        ];
    }

    /**
     * Suggests how to allocate AVAILABLE CASH to existing goals.
     * @param {number} inputAmount - The amount triggering the suggestion (usually new income).
     * @returns {Array} suggestions - List of all goals with suggested amounts.
     */
    suggestAllocation(inputAmount) {
        const suggestions = [];

        // Use Available Cash as the limit, not just the new income
        let availableToAllocate = this.app.state.finances.availableCash;

        // If available cash is negative (debt), we cannot allocate
        if (availableToAllocate <= 0) {
            return [];
        }

        // We can cap the suggestion at the input amount if we want to be conservative.
        // Rule: Only suggest allocating what was just added, capped by total available.
        let allocationBudget = Math.min(inputAmount, availableToAllocate);
        let remainingIncome = allocationBudget;

        // Ensure user goals exist in state
        this.syncGoals();

        const sortedGoals = [...this.app.state.goals].sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        const activeGoals = sortedGoals.filter(g => (g.target - (g.current || 0)) > 0);
        const completedGoals = sortedGoals.filter(g => (g.target - (g.current || 0)) <= 0);

        if (activeGoals.length > 0) {
            // WEIGHTED DISTRIBUTION LOGIC
            // Define weights based on priority: P1 (High) gets more, P3 (Low) gets less
            const priorityWeights = { 1: 50, 2: 30, 3: 20 };

            // 1. Initial split based on priority weights
            activeGoals.forEach(goal => {
                const weight = priorityWeights[goal.priority] || 10;
                const share = Math.floor((amount * weight) / 100);
                const remainingTarget = goal.target - (goal.current || 0);

                // Cap by remaining target
                const allocation = Math.min(share, remainingTarget);

                goal._tempAlloc = allocation;
                remainingIncome -= allocation;
            });

            // 2. Redistribute leftover income (waterfall for what's left)
            if (remainingIncome > 0) {
                for (const goal of activeGoals) {
                    const remainingTarget = goal.target - (goal.current || 0) - goal._tempAlloc;
                    if (remainingTarget <= 0) continue;

                    const addOn = Math.min(remainingIncome, remainingTarget);
                    goal._tempAlloc += addOn;
                    remainingIncome -= addOn;
                    if (remainingIncome <= 0) break;
                }
            }

            // 3. Build suggestions array
            activeGoals.forEach(goal => {
                suggestions.push({
                    goalId: goal.id,
                    name: goal.name,
                    aiAmount: goal._tempAlloc,
                    current: goal.current || 0,
                    target: goal.target,
                    remainingTarget: goal.target - (goal.current || 0) - goal._tempAlloc,
                    priority: goal.priority
                });
                delete goal._tempAlloc;
            });
        }

        // Add completed goals with 0 suggestion
        for (const goal of completedGoals) {
            suggestions.push({
                goalId: goal.id,
                name: goal.name,
                aiAmount: 0,
                current: goal.current || 0,
                target: goal.target,
                remainingTarget: 0,
                priority: goal.priority
            });
        }

        return suggestions;
    }

    /**
     * Returns advice when a transaction is deleted.
     * @param {string} type - Transaction type ('income' or 'expenses')
     * @param {number} amount - Transaction amount
     * @returns {string} advice - Advice message
     */
    getDeletionAdvice(type, amount) {
        if (type === 'income') {
            return `Anda baru saja menghapus pendapatan sebesar ${this.app.calculator.formatCurrency(amount)}. Jika pendapatan ini sebelumnya telah dialokasikan ke goal, alokasi tersebut tidak otomatis berkurang. Kami sarankan Anda meninjau status goal untuk memastikan saldo Anda tetap akurat.`;
        } else if (type === 'expenses') {
            return `Anda menghapus pengeluaran sebesar ${this.app.calculator.formatCurrency(amount)}. Saldo Anda kini bertambah, Anda mungkin bisa mengalokasikan kelebihan ini ke target financial Anda!`;
        }
        return '';
    }

    /**
     * Checks if allocations need rebalancing after an expense.
     * @returns {Object|null} rebalanceSuggestion - Suggestion details or null.
     */
    checkRebalance() {
        const balance = this.app.state.finances.balance;
        const totalGoalAllocations = this.app.state.goals.reduce((sum, g) => sum + (g.current || 0), 0);

        if (totalGoalAllocations > balance) {
            const deficit = totalGoalAllocations - balance;
            return this.suggestRebalance(deficit);
        }

        return null;
    }

    suggestRebalance(deficit) {
        // Reverse priority rebalancing (take from Vacation first)
        const sortedGoals = [...this.app.state.goals].sort((a, b) => b.priority - a.priority);
        const reductions = [];
        let remainingDeficit = deficit;

        for (const goal of sortedGoals) {
            if (remainingDeficit <= 0) break;

            const currentAlloc = goal.current || 0;
            const reduction = Math.min(remainingDeficit, currentAlloc);

            if (reduction > 0) {
                reductions.push({
                    goalId: goal.id,
                    name: goal.name,
                    amount: reduction,
                    newCurrent: currentAlloc - reduction
                });
                remainingDeficit -= reduction;
            }
        }

        return reductions;
    }

    syncGoals() {
        // Add default goals if not present
        if (this.app.state.goals.length === 0) {
            this.app.state.goals = this.goals.map(g => {
                const deadline = new Date();
                deadline.setFullYear(deadline.getFullYear() + g.dueYears);
                return {
                    id: Date.now() + Math.random(),
                    name: g.name,
                    target: g.target,
                    current: 0,
                    deadline: deadline.toISOString().split('T')[0],
                    priority: g.priority,
                    progress: 0,
                    created: new Date().toISOString()
                };
            });
            this.app.dataManager.saveData();
        }
    }
}

export default FinancialAssistant;
