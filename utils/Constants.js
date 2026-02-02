/* ====== APPLICATION CONSTANTS ====== */

// App Configuration
export const APP_CONFIG = {
    VERSION: '2.1.0',
    NAME: 'Financial Masterplan PRO',
    STORAGE_KEY: 'financialMasterplanData',
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
    DEFAULT_CURRENCY: 'IDR',
    THEMES: ['light', 'dark', 'auto']
};

// Colors
export const COLORS = {
    primary: '#4361ee',
    secondary: '#3a0ca3',
    success: '#06d6a0',
    warning: '#ffd166',
    danger: '#ef233c',
    info: '#4cc9f0',
    light: '#f8f9fa',
    dark: '#212529',
    text: {
        primary: '#2d3748',
        secondary: '#718096',
        muted: '#a0aec0'
    },
    background: {
        surface: '#ffffff',
        card: '#f7fafc',
        app: '#f8fafc'
    }
};

// Chart Configuration
export const CHART_CONFIG = {
    DEFAULT_COLORS: {
        income: '#4cc9f0',
        expenses: '#ef233c',
        savings: '#4361ee',
        goal: '#7209b7'
    },
    DEFAULT_PERIOD: 'monthly',
    ANIMATION_DURATION: 1000,
    MAX_RETRIES: 3
};

// Categories
export const CATEGORIES = {
    income: {
        gaji: 'Gaji',
        freelance: 'Freelance',
        investasi: 'Investasi',
        lainnya: 'Lainnya'
    },
    expenses: {
        kebutuhan: 'Kebutuhan',
        hiburan: 'Hiburan',
        transport: 'Transportasi',
        makanan: 'Makanan',
        lainnya: 'Lainnya'
    }
};

// Form Validation
export const VALIDATION = {
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 1000000000000,
    DATE_FORMAT: 'YYYY-MM-DD'
};

// PWA Configuration
export const PWA_CONFIG = {
    CACHE_NAME: 'financial-masterplan-v2',
    OFFLINE_HTML: '/offline.html',
    ASSETS_TO_CACHE: [
        '/',
        '/index.html',
        '/style.css',
        '/app.js',
        '/manifest.json'
    ]
};

// Notification Messages
export const NOTIFICATIONS = {
    SAVE_SUCCESS: 'Data tersimpan!',
    SAVE_ERROR: 'Gagal menyimpan data',
    DELETE_SUCCESS: 'Item berhasil dihapus',
    DELETE_ERROR: 'Gagal menghapus item',
    EXPORT_SUCCESS: 'Data berhasil diexport',
    EXPORT_ERROR: 'Gagal mengexport data',
    IMPORT_SUCCESS: 'Data berhasil diimport',
    IMPORT_ERROR: 'Gagal mengimport data'
};

// Keyboard Shortcuts Configuration (Tambahkan ini)
export const KEYBOARD_SHORTCUTS = {
    SAVE: { key: 's', ctrl: true, description: 'Simpan data' },
    EXPORT: { key: 'e', ctrl: true, description: 'Export data' },
    ESCAPE: { key: 'Escape', description: 'Tutup modal' },
    DASHBOARD: { key: '1', description: 'Pergi ke Dashboard' },
    EXPENSES: { key: '2', description: 'Pergi ke Pengeluaran' },
    INCOME: { key: '3', description: 'Pergi ke Pendapatan' },
    CHECKLIST: { key: '4', description: 'Pergi ke Checklist' },
    SIMULATION: { key: '5', description: 'Pergi ke Simulasi' },
    SETTINGS: { key: '6', description: 'Pergi ke Pengaturan' }
};

// Default Category Icons (for category management UI)
export const DEFAULT_CATEGORY_ICONS = {
    income: ['💰', '💵', '💴', '💶', '💷', '💳', '💼', '📈', '🏢', '🎁', '🏆', '💎'],
    expense: ['🛒', '🍽️', '🚗', '🏥', '📚', '🎮', '🎬', '✈️', '🏠', '👕', '⚡', '📦']
};

// Default Category Colors (for category management UI)
export const DEFAULT_CATEGORY_COLORS = {
    income: ['#4cc9f0', '#06d6a0', '#7209b7', '#4361ee', '#3a0ca3'],
    expense: ['#ef233c', '#ff006e', '#fb5607', '#ffbe0b', '#8338ec']
};