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
            // Close any other open modals first
            this.closeModal();

            // Open new modal
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

            // Focus management for accessibility
            setTimeout(() => {
                // Try to focus first input
                const focusable = modal.querySelectorAll(
                    'input:not([disabled]):not([type="hidden"]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled]), ' +
                    'button:not([disabled])'
                );

                if (focusable.length > 0) {
                    // Skip close button, focus on first input
                    const firstInput = focusable[0].classList.contains('modal-close')
                        ? focusable[1]
                        : focusable[0];
                    if (firstInput) firstInput.focus();
                }
            }, 100);
        }
    }

    closeModal(modalId = null) {
        let shouldCloseOverlay = true;

        if (modalId) {
            // Close specific modal
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');

                // Check if there are other active modals
                const otherActiveModals = Array.from(document.querySelectorAll('.modal.active'))
                    .filter(m => m.id !== modalId);

                shouldCloseOverlay = otherActiveModals.length === 0;
            }
        } else {
            // Close all modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }

        // Only close overlay if no modals are active
        if (shouldCloseOverlay && this.app.elements.modalOverlay) {
            this.app.elements.modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Return focus to previous element (for accessibility)
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }

    // ====== THEME MANAGEMENT ======
    applyTheme() {
        const theme = this.app.state.settings.theme || 'auto';

        let activeTheme = theme;
        if (activeTheme === 'auto') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Set Attribute for CSS variables (Critical for main.css)
        document.documentElement.setAttribute('data-theme', activeTheme);

        // Set Body Class for legacy support
        if (activeTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        this.updateThemeToggleButton();
    }

    updateThemeToggleButton() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (!toggleBtn) return;

        const currentTheme = this.app.state.settings.theme || 'auto';

        if (currentTheme === 'dark') {
            toggleBtn.innerHTML = '☀️ Light Mode';
        } else if (currentTheme === 'light') {
            toggleBtn.innerHTML = '🌙 Dark Mode';
        } else { // 'auto'
            const isDarkMode = document.body.classList.contains('dark-mode');
            toggleBtn.innerHTML = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    changeTheme(theme) {
        // Update setting
        this.app.state.settings.theme = theme;

        // Terapkan tema
        this.applyTheme(); // Ini akan update class body DAN button text

        // Simpan
        this.app.dataManager.saveData(true);

        this.showNotification(`Tema diubah ke: ${theme}`, 'success');
    }

    toggleDarkMode() {
        const html = document.documentElement;
        const currentTheme = this.app.state.settings.theme || 'auto';
        let newTheme;

        // Jika auto mode, cek preferensi sistem
        if (currentTheme === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            newTheme = systemPrefersDark ? 'light' : 'dark';
        } else {
            // Toggle antara light dan dark
            newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        }

        // Update HTML attribute dan body class
        html.setAttribute('data-theme', newTheme);
        document.body.classList.toggle('dark-mode', newTheme === 'dark');

        // Update setting
        this.app.state.settings.theme = newTheme;

        // Update button text
        this.updateThemeToggleButton();

        // Save
        this.app.dataManager.saveData(true);

        this.showNotification(
            `Mode diubah ke: ${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}`,
            'success'
        );

        // Update chart jika ada
        if (this.app.chartManager && this.app.chartManager.chartInstance) {
            setTimeout(() => {
                this.app.chartManager.chartInstance.update();
            }, 100);
        }
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
    showNotification(message, type = 'info', duration = 2000) {
        // 1. Get or create container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none; /* Allow clicks through container */
            `;
            document.body.appendChild(container);
        }

        // 2. Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = type === 'success' ? '✅' :
            type === 'error' ? '❌' :
                type === 'warning' ? '⚠️' : 'ℹ️';

        notification.innerHTML = `
            <div class="notification-content" style="display: flex; align-items: center; gap: 10px;">
                <span class="notification-icon">${icon}</span>
                <span>${message}</span>
            </div>
        `;

        // 3. Apply styles (Toast look)
        notification.style.cssText = `
            background: ${COLORS[type] || COLORS.info};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            max-width: 400px;
            transform: translateX(120%);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
            pointer-events: auto; /* Re-enable clicks on the toast itself */
            display: flex;
            align-items: center;
        `;

        // 4. Add to container
        // Prepend to show newest at top, or append for bottom. Stacking usually goes Top->Down (Append) or Bottom->Up.
        // Given 'top: 20px', we should append, so they stack downwards.
        container.appendChild(notification);

        // 5. Trigger animation (next frame)
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // 6. Auto remove with safe fallback
        setTimeout(() => {
            // Trigger exit animation
            notification.style.transform = 'translateX(120%)';
            notification.style.opacity = '0';

            // Force remove after animation duration (300ms)
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                // Cleanup container if empty
                if (container.childNodes.length === 0) {
                    container.remove();
                }
            }, 300); // Strict 300ms matching CSS transition

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
    // ====== ANIMATIONS ======
    animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (easeOutExpo)
            const easeOutExpo = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
            const currentProgress = easeOutExpo(progress);

            const currentVal = Math.floor(progress * (end - start) + start);

            // Format while animating if it's a large number
            if (end > 1000) {
                obj.innerHTML = this.app.calculator.formatCurrency(currentVal);
            } else {
                obj.innerHTML = currentVal;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = this.app.calculator.formatCurrency(end);
            }
        };
        window.requestAnimationFrame(step);
    }

    // ====== SCROLL REVEAL ======
    setupScrollReveal() {
        // Disconnect existing observer if any
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }

        // Initialize IntersectionObserver
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        // Target all elements with .reveal-on-scroll
        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach(el => {
            this.scrollObserver.observe(el);
        });

        // Also trigger manually after a short delay to catch any missed ones on load
        setTimeout(() => {
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom >= 0) {
                    el.classList.add('revealed');
                }
            });
        }, 500);
    }
}

export default UIManager;