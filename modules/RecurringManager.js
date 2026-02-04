/* ====== RECURRING MANAGER MODULE ====== */

import { APP_CONFIG } from '../utils/Constants.js';

export class RecurringManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Initialize and check for due recurring transactions
     */
    initialize() {
        console.log('🔄 Initializing Recurring Transaction Manager...');

        // Ensure storage exists
        if (!this.app.state.recurring) {
            this.app.state.recurring = [];
        }

        // Check for items due today or in the past
        this.processDueItems();
    }

    /**
     * Check all recurring items and process if due
     */
    processDueItems() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recurringItems = this.app.state.recurring || [];
        let processedCount = 0;
        let processedNames = [];

        recurringItems.forEach(item => {
            if (!item.active) return;

            const nextRun = new Date(item.nextRun);
            nextRun.setHours(0, 0, 0, 0);

            if (today >= nextRun) {
                this.executeRecurringTransaction(item, today);
                processedCount++;
                processedNames.push(item.name);
            }
        });

        if (processedCount > 0) {
            console.log(`✅ Processed ${processedCount} recurring transactions`);
            this.app.calculator.calculateFinances();
            this.app.dataManager.saveData(true);

            // Notify user
            setTimeout(() => {
                this.app.uiManager.showNotification(
                    `🔄 ${processedCount} transaksi otomatis diproses (${processedNames.join(', ')})`,
                    'success',
                    4000
                );
            }, 1000);
        }
    }

    /**
     * Execute a single recurring transaction and update its schedule
     */
    executeRecurringTransaction(item, today) {
        console.log(`💸 Executing recurring: ${item.name}`);

        // 1. Create Transaction Object
        const transaction = {
            id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
            name: item.name,
            amount: item.amount,
            category: item.category,
            account: item.accountName, // Legacy support
            accountId: item.accountId,
            date: new Date().toISOString().split('T')[0], // Today's date
            note: `Auto-generated (Recurring: ${item.frequency})`,
            createdAt: new Date().toISOString()
        };

        // 2. Push to State
        if (item.type === 'income') {
            this.app.state.transactions.income.unshift(transaction);
        } else {
            this.app.state.transactions.expenses.unshift(transaction);
        }

        // 3. Update Next Run Date
        const nextRun = this.calculateNextRun(new Date(item.nextRun), item.frequency);
        item.lastRun = new Date().toISOString().split('T')[0];
        item.nextRun = nextRun;

        console.log(`📅 Next run for ${item.name} set to ${item.nextRun}`);
    }

    /**
     * Calculate the next run date based on frequency
     */
    calculateNextRun(currentDate, frequency) {
        const d = new Date(currentDate);

        switch (frequency) {
            case 'weekly':
                d.setDate(d.getDate() + 7);
                break;
            case 'monthly':
                d.setMonth(d.getMonth() + 1);
                break;
            case 'yearly':
                d.setFullYear(d.getFullYear() + 1);
                break;
            default: // Default to monthly safety catch
                d.setMonth(d.getMonth() + 1);
        }

        return d.toISOString().split('T')[0];
    }

    /**
     * Add a new recurring transaction configuration
     */
    addRecurring(config) {
        const newItem = {
            id: `rec_${Date.now()}`,
            ...config,
            active: true,
            lastRun: null, // Not run yet
            nextRun: this.calculateNextRun(new Date(), config.frequency) // Start next cycle
        };

        if (!this.app.state.recurring) {
            this.app.state.recurring = [];
        }

        this.app.state.recurring.push(newItem);
        this.app.dataManager.saveData(true);

        console.log('✅ Added recurring config:', newItem);
        return newItem;
    }

    /**
     * Delete a recurring configuration
     */
    deleteRecurring(id) {
        if (!this.app.state.recurring) return;
        this.app.state.recurring = this.app.state.recurring.filter(item => item.id !== id);
        this.app.dataManager.saveData(true);
    }

    /**
     * Toggle active status
     */
    toggleActive(id) {
        const item = this.app.state.recurring.find(i => i.id === id);
        if (item) {
            item.active = !item.active;
            this.app.dataManager.saveData(true);
        }
    }
}
