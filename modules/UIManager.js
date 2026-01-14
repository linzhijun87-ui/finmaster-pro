/* ====== UI MANAGER MODULE ====== */

import { COLORS, CATEGORIES } from '../utils/Constants.js';

class UIManager {
    constructor(app) {
        this.app = app;
        this.resizeTimeout = null;
        this.notifications = [];
    }

    // ====== UI INITIALIZATION ======
    updateUI() {
        console.log('🔄 Updating UI...');
        
        // Update user info
        if (this.app.elements.userName) {
            this.app.elements.userName.textContent = this.app.state.user.name;
        }
        
        if (this.app.elements.userAvatar) {
            this.app.elements.userAvatar.textContent = this.app.state.user.avatar;
        }
        
        // Update badges
        this.updateBadges();
        
        // Update footer
        this.updateFooter();
        
        console.log('✅ UI updated');
    }

    updateBadges() {
        console.log('🔄 Updating badges...');
        
        // Update expense badge
        if (this.app.elements.expenseBadge) {
            try {
                const pendingExpenses = this.app.state.transactions.expenses.filter(e => {
                    try {
                        const expenseDate = new Date(e.date);
                        const today = new Date();
                        const diffTime = today - expenseDate;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 3; // Expenses within last 3 days
                    } catch (error) {
                        return false;
                    }
                }).length;
                
                this.app.elements.expenseBadge.textContent = pendingExpenses;
            } catch (error) {
                console.error('Error updating expense badge:', error);
                this.app.elements.expenseBadge.textContent = '0';
            }
        }
        
        // Update checklist badge
        if (this.app.elements.checklistBadge) {
            try {
                const incompleteTasks = this.app.state.checklist.filter(task => !task.completed).length;
                this.app.elements.checklistBadge.textContent = incompleteTasks;
            } catch (error) {
                console.error('Error updating checklist badge:', error);
                this.app.elements.checklistBadge.textContent = '0';
            }
        }
    }

    updateFooter() {
        // Update app version
        if (this.app.elements.appVersion) {
            this.app.elements.appVersion.textContent = '2.1.0';
        }
        
        // Update app mode (online/offline)
        this.updateOnlineStatus();
    }

    // ====== NAVIGATION ======
    updateNavigation(activeTab) {
        const tabs = this.app.elements.navTabs?.querySelectorAll('.nav-tab');
        if (!tabs) return;
        
        tabs.forEach(tab => {
            if (tab.dataset.tab === activeTab) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // ====== MODAL MANAGEMENT ======
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = this.app.elements.modalOverlay;
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const dateInputs = modal.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                if (!input.value) {
                    input.value = today;
                }
            });
        }
    }

    closeModal(modalId = null) {
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        } else {
            // Close all modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        this.app.elements.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ====== THEME MANAGEMENT ======
    applyTheme() {
        const theme = this.app.state.settings.theme || 'auto';
        
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-mode');
        } else {
            // Auto - follow system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }

    changeTheme(theme) {
        this.app.state.settings.theme = theme;
        this.applyTheme();
        this.app.dataManager.saveData(true);
        
        this.showNotification(`Tema diubah ke: ${theme}`, 'success');
    }

    toggleDarkMode() {
        const isDark = !document.body.classList.contains('dark-mode');
        
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Update button text
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
        
        // Update settings
        this.app.state.settings.theme = isDark ? 'dark' : 'light';
        this.app.dataManager.saveData(true);
        
        this.showNotification(
            isDark ? 'Dark mode diaktifkan' : 'Light mode diaktifkan', 
            'success'
        );
    }

    // ====== RESPONSIVE DESIGN ======
    setupResponsiveDesign() {
        // Add responsive meta tag if not exists
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            document.head.appendChild(viewportMeta);
        }
        
        // Add responsive CSS classes
        if (!document.querySelector('style[data-responsive-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-responsive-styles', 'true');
            style.textContent = this.getResponsiveCSS();
            document.head.appendChild(style);
        }
        
        // Initial responsive setup
        this.handleResize();
        
        // Listen for resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    getResponsiveCSS() {
        return `
            /* Responsive utilities */
            .mobile-only { display: none !important; }
            .desktop-only { display: block !important; }
            
            @media (max-width: 767px) {
                .mobile-only { display: block !important; }
                .desktop-only { display: none !important; }
                
                /* Touch-friendly buttons */
                button, .btn, .btn-outline, .nav-tab {
                    min-height: 44px;
                    min-width: 44px;
                }
                
                /* Better touch targets */
                .activity-item {
                    min-height: 60px;
                }
                
                /* Hide some elements on mobile */
                .text-muted.mobile-hide {
                    display: none;
                }
            }
            
            /* Print styles */
            @media print {
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                
                body {
                    font-size: 12pt;
                    color: #000 !important;
                    background: #fff !important;
                }
                
                .stat-card {
                    break-inside: avoid;
                }
            }
        `;
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.performResizeActions();
        }, 250);
    }

    performResizeActions() {
        const windowWidth = window.innerWidth;
        const isMobile = windowWidth < 768;
        const isTablet = windowWidth >= 768 && windowWidth < 1024;
        const isDesktop = windowWidth >= 1024;
        
        // Update responsive classes
        this.updateResponsiveClasses(isMobile);
        
        // Update layout based on screen size
        this.updateLayoutForScreenSize(isMobile, isTablet, isDesktop);
        
        // Adjust modals
        this.adjustModalPositions();
        
        // Update chart if exists
        if (this.app.chartManager) {
            this.app.chartManager.resizeChart();
        }
    }

    updateResponsiveClasses(isMobile) {
        const body = document.body;
        
        if (isMobile) {
            body.classList.add('mobile-view');
            body.classList.remove('desktop-view');
        } else {
            body.classList.add('desktop-view');
            body.classList.remove('mobile-view');
        }
    }

    updateLayoutForScreenSize(isMobile, isTablet, isDesktop) {
        // Update stats grid
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            if (isMobile) {
                statsGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
                statsGrid.style.gap = 'var(--space-3)';
            } else if (isTablet) {
                statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                statsGrid.style.gap = 'var(--space-4)';
            } else {
                statsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                statsGrid.style.gap = 'var(--space-4)';
            }
        }
        
        // Update dashboard grid
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (dashboardGrid) {
            if (isMobile) {
                dashboardGrid.style.gridTemplateColumns = '1fr';
                dashboardGrid.style.gap = 'var(--space-4)';
            } else {
                dashboardGrid.style.gridTemplateColumns = '2fr 1fr';
                dashboardGrid.style.gap = 'var(--space-6)';
            }
        }
    }

    adjustModalPositions() {
        const modals = document.querySelectorAll('.modal.active');
        
        modals.forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                if (window.innerWidth < 768) {
                    // Mobile modal styling
                    modalContent.style.maxWidth = '90%';
                    modalContent.style.maxHeight = '80vh';
                    modalContent.style.margin = '20px auto';
                } else {
                    // Desktop modal styling
                    modalContent.style.maxWidth = '500px';
                    modalContent.style.maxHeight = '90vh';
                    modalContent.style.margin = '0';
                }
            }
        });
    }

    // ====== NOTIFICATIONS ======
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${COLORS[type] || COLORS.info};
            color: white;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Add animation styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Store reference
        this.notifications.push(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications = this.notifications.filter(n => n !== notification);
            }, 300);
        }, duration);
    }

    // ====== LOADING STATES ======
    showLoading(containerId, message = 'Memuat...') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    // ====== UTILITY METHODS ======
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            return dateString;
        }
    }

    getCategoryName(category) {
        if (CATEGORIES.income[category]) return CATEGORIES.income[category];
        if (CATEGORIES.expenses[category]) return CATEGORIES.expenses[category];
        return category;
    }

    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const appModeElement = this.app.elements.appMode;
        
        if (appModeElement) {
            appModeElement.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
            appModeElement.style.color = isOnline ? COLORS.success : COLORS.danger;
        }
        
        if (!isOnline) {
            this.showNotification('Anda sedang offline. Data disimpan lokal.', 'warning', 3000);
        }
    }

    // ====== FORM HELPERS ======
    setupFormValidation() {
        // Real-time validation for amount inputs
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number' && e.target.id.includes('Amount')) {
                this.validateAmountInput(e.target);
            }
        });
        
        // Date validation
        document.addEventListener('change', (e) => {
            if (e.target.type === 'date') {
                this.validateDateInput(e.target);
            }
        });
    }

    validateAmountInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        
        if (isNaN(value) || value < min) {
            input.style.borderColor = COLORS.danger;
            input.style.boxShadow = `0 0 0 2px ${COLORS.danger}20`;
        } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    validateDateInput(input) {
        const value = input.value;
        if (!value) return;
        
        const date = new Date(value);
        const today = new Date();
        
        if (date > today) {
            input.style.borderColor = COLORS.warning;
            this.showNotification('Tanggal di masa depan mungkin tidak valid', 'warning');
        } else {
            input.style.borderColor = '';
        }
    }

    // ====== CLEANUP ======
    cleanup() {
        // Clear timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Remove notifications
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.notifications = [];
    }
}

export default UIManager;