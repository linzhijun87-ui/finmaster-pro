/* ====== BUDGET PERIOD UTILITIES ====== */
/* Helper functions for budget period management
 * - getCurrentPeriod: Get current period identifier
 * - getWeekNumber: Get ISO week number
 * - checkAndResetBudgets: Automatically reset budget progress on period change
 */

/**
 * Get current period identifier based on period type
 * @param {string} periodType - 'monthly', 'weekly', or 'one-time'
 * @returns {string|null} - Period identifier (e.g. "2026-02" for monthly) or null for one-time
 */
export function getCurrentPeriod(periodType) {
    const now = new Date();

    if (periodType === 'monthly') {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    if (periodType === 'weekly') {
        const year = now.getFullYear();
        const weekNum = getWeekNumber(now);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }

    return null; // one-time budgets have no period
}

/**
 * Get ISO week number for a date
 * @param {Date} date - Date object
 * @returns {number} - ISO week number (1-53)
 */
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Check and reset budgets if period has changed
 * This should be called on app init and data load
 * @param {Array} budgets - Array of budget objects
 * @returns {Array} - Updated budgets array
 */
export function checkAndResetBudgets(budgets) {
    if (!Array.isArray(budgets) || budgets.length === 0) {
        return budgets;
    }

    let resetCount = 0;

    budgets.forEach(budget => {
        // Skip one-time budgets (they never reset)
        if (budget.period === 'one-time') {
            return;
        }

        // Get current period for this budget type
        const currentPeriod = getCurrentPeriod(budget.period);

        // If period has changed, reset progress
        if (budget.currentPeriod !== currentPeriod) {
            console.log(`🔄 Resetting budget "${budget.name}" (${budget.currentPeriod} → ${currentPeriod})`);
            budget.spent = 0; // Reset spent amount
            budget.currentPeriod = currentPeriod; // Update period marker
            resetCount++;
        }
    });

    if (resetCount > 0) {
        console.log(`✅ Reset ${resetCount} budget(s) for new period`);
    }

    return budgets;
}

/**
 * Migrate existing budgets to add period support
 * @param {Array} budgets - Array of budget objects
 * @returns {Array} - Migrated budgets array
 */
export function migrateBudgetToPeriods(budgets) {
    if (!Array.isArray(budgets)) return [];

    budgets.forEach(budget => {
        // Add period field if missing (default to monthly)
        if (!budget.period) {
            budget.period = 'monthly';
            budget.currentPeriod = getCurrentPeriod('monthly');
            console.log(`📋 Migrated budget "${budget.name}" to monthly period`);
        }

        // Ensure currentPeriod exists
        if (!budget.currentPeriod && budget.period !== 'one-time') {
            budget.currentPeriod = getCurrentPeriod(budget.period);
        }

        // Ensure spent field exists
        if (typeof budget.spent !== 'number') {
            budget.spent = 0;
        }
    });

    return budgets;
}

/**
 * Get display label for period type
 * @param {string} periodType - 'monthly', 'weekly', or 'one-time'
 * @returns {string} - Display label
 */
export function getPeriodLabel(periodType) {
    switch (periodType) {
        case 'monthly':
            return 'bulan ini';
        case 'weekly':
            return 'minggu ini';
        case 'one-time':
            return 'total';
        default:
            return '';
    }
}
