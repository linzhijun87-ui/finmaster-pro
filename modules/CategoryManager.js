/* ====== CATEGORY MANAGER MODULE ====== */

import { CATEGORIES } from '../utils/Constants.js';

class CategoryManager {
    constructor(app) {
        this.app = app;
    }

    // ====== INITIALIZATION ======

    /**
     * Initialize categories from state or create defaults
     */
    initializeCategories() {
        if (!this.app.state.categories || this.app.state.categories.length === 0) {
            this.app.state.categories = this.getDefaultCategories();
            console.log('✅ Default categories initialized');
        }
    }

    /**
     * Get default system categories from Constants
     * @returns {Array} Default categories array
     */
    getDefaultCategories() {
        const categories = [];
        let id = 1;

        // Income categories
        for (const [key, name] of Object.entries(CATEGORIES.income)) {
            categories.push({
                id: id++,
                key: key,
                name: name,
                type: 'income',
                icon: this.getDefaultIcon(key, 'income'),
                color: this.getDefaultColor('income'),
                system: true
            });
        }

        // Expense categories
        for (const [key, name] of Object.entries(CATEGORIES.expenses)) {
            categories.push({
                id: id++,
                key: key,
                name: name,
                type: 'expense',
                icon: this.getDefaultIcon(key, 'expense'),
                color: this.getDefaultColor('expense'),
                system: true
            });
        }

        return categories;
    }

    /**
     * Get default icon for a category based on its key
     */
    getDefaultIcon(key, type) {
        const icons = {
            // Income icons
            gaji: '💰',
            freelance: '💼',
            investasi: '📈',
            bisnis: '🏢',
            hadiah: '🎁',
            lainnya: '💵',
            // Expense icons
            kebutuhan: '🛒',
            hiburan: '🎮',
            transport: '🚗',
            makanan: '🍽️',
            kesehatan: '🏥',
            pendidikan: '📚',
            investasi: '📊'
        };
        return icons[key] || (type === 'income' ? '💵' : '📦');
    }

    /**
     * Get default color for category type
     */
    getDefaultColor(type) {
        return type === 'income' ? '#4cc9f0' : '#ef233c';
    }

    // ====== CATEGORY CRUD ======

    /**
     * Add a new custom category
     * @param {Object} data - Category data (name, type, icon, color)
     * @returns {Object} Created category
     */
    addCategory(data) {
        if (!data.name || !data.type) {
            throw new Error('Category name and type are required');
        }

        if (!['income', 'expense'].includes(data.type)) {
            throw new Error('Category type must be "income" or "expense"');
        }

        const id = Date.now();
        const category = {
            id,
            key: `custom_${id}`,
            name: data.name.trim(),
            type: data.type,
            icon: data.icon || (data.type === 'income' ? '💵' : '📦'),
            color: data.color || this.getDefaultColor(data.type),
            system: false
        };

        this.app.state.categories.push(category);
        this.app.dataManager.saveData(true);

        console.log('✅ Category added:', category);
        return category;
    }

    /**
     * Delete a category (only custom categories)
     * @param {number} id - Category ID
     * @returns {boolean} Success status
     */
    deleteCategory(id) {
        const category = this.app.state.categories.find(c => c.id === id);

        if (!category) {
            throw new Error('Category not found');
        }

        if (category.system) {
            throw new Error('System categories cannot be deleted');
        }

        // Check if category is referenced in transactions
        const isReferenced = this.isCategoryReferenced(category.key);

        if (isReferenced) {
            console.log(`⚠️ Category "${category.name}" is referenced in transactions but will be soft-deleted`);
        }

        // Remove from state
        this.app.state.categories = this.app.state.categories.filter(c => c.id !== id);
        this.app.dataManager.saveData(true);

        console.log('🗑️ Category deleted:', category);
        return true;
    }

    /**
     * Check if a category is referenced in any transactions
     * @param {string} categoryKey - Category key
     * @returns {boolean} True if referenced
     */
    isCategoryReferenced(categoryKey) {
        const inExpenses = this.app.state.transactions.expenses.some(e => e.category === categoryKey);
        const inIncome = this.app.state.transactions.income.some(i => i.category === categoryKey);
        return inExpenses || inIncome;
    }

    // ====== GETTERS ======

    /**
     * Get all categories of a specific type
     * @param {string} type - 'income' or 'expense'
     * @returns {Array} Categories of specified type
     */
    getCategoriesByType(type) {
        return this.app.state.categories.filter(c => c.type === type);
    }

    /**
     * Get category by key
     * @param {string} key - Category key
     * @returns {Object|null} Category object or null
     */
    getCategoryByKey(key) {
        return this.app.state.categories.find(c => c.key === key) || null;
    }

    /**
     * Get category name by key, handles deleted categories
     * @param {string} key - Category key
     * @returns {string} Category name or "Deleted Category"
     */
    getCategoryName(key) {
        const category = this.getCategoryByKey(key);
        return category ? category.name : 'Deleted Category';
    }

    /**
     * Get all categories
     * @returns {Array} All categories
     */
    getAllCategories() {
        return this.app.state.categories || [];
    }

    /**
     * Get category icon by key
     * @param {string} key - Category key
     * @returns {string} Category icon
     */
    getCategoryIcon(key) {
        const category = this.getCategoryByKey(key);
        return category ? category.icon : '📦';
    }

    /**
     * Get category color by key
     * @param {string} key - Category key
     * @returns {string} Category color hex
     */
    getCategoryColor(key) {
        const category = this.getCategoryByKey(key);
        return category ? category.color : '#999999';
    }
}

export default CategoryManager;
