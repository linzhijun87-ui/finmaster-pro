/* ====== PWA INSTALLER MODULE ====== */

class PWAInstaller {
    constructor(app) {
        this.app = app;
        this.deferredPrompt = null;
        this.installButton = null;
    }

    initialize() {
        console.log('📱 Initializing PWA Installer...');
        
        // Cache install button
        this.installButton = document.getElementById('installBtn');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check PWA status
        this.checkPWAStatus();
    }

    setupEventListeners() {
        // Before install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            this.handleBeforeInstallPrompt(e);
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            this.handleAppInstalled();
        });
        
        // Install button click
        if (this.installButton) {
            this.installButton.addEventListener('click', () => {
                this.handleInstallClick();
            });
        }
    }

    handleBeforeInstallPrompt(e) {
        e.preventDefault();
        
        // Store the event for later use
        this.deferredPrompt = e;
        window.deferredPrompt = e; // Also expose globally for compatibility
        
        // Show install button if it exists
        if (this.installButton) {
            this.installButton.style.display = 'flex';
        }
        
        console.log('📱 PWA install prompt available');
        
        // Auto-show prompt after 5 seconds on first visit
        const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
        if (!hasSeenPrompt && this.installButton) {
            setTimeout(() => {
                if (this.deferredPrompt && this.installButton.style.display !== 'none') {
                    this.app.uiManager.showNotification(
                        'Ingin instal aplikasi untuk pengalaman lebih baik?', 
                        'info', 
                        5000
                    );
                }
            }, 5000);
            localStorage.setItem('hasSeenInstallPrompt', 'true');
        }
    }

    handleInstallClick() {
        if (!this.deferredPrompt) {
            // App already installed or not installable
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.app.uiManager.showNotification('Aplikasi sudah terinstal', 'info');
            } else {
                this.app.uiManager.showNotification('Instalasi tidak tersedia', 'warning');
            }
            return;
        }
        
        this.deferredPrompt.prompt();
        
        this.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted PWA install');
                this.app.uiManager.showNotification('Menginstal aplikasi...', 'info');
            } else {
                console.log('❌ User dismissed PWA install');
                this.app.uiManager.showNotification('Instalasi dibatalkan', 'info');
            }
            
            // Reset the deferred prompt variable
            this.deferredPrompt = null;
            window.deferredPrompt = null;
            
            // Hide install button
            if (this.installButton) {
                this.installButton.style.display = 'none';
            }
        });
    }

    handleAppInstalled() {
        console.log('✅ PWA installed successfully');
        this.app.uiManager.showNotification('Aplikasi berhasil diinstal! 🎉', 'success');
        
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
        
        // Update app mode
        const appModeElement = document.getElementById('appMode');
        if (appModeElement) {
            appModeElement.textContent = '📱 PWA';
        }
    }

    checkPWAStatus() {
        if (!this.installButton) return;
        
        // Hide jika sudah diinstall
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.installButton.style.display = 'none';
            return;
        }
        
        // Hide jika tidak support PWA
        if (!('BeforeInstallPromptEvent' in window)) {
            this.installButton.style.display = 'none';
        }
        
        // Check responsive design
        this.updateButtonVisibility();
    }

    updateButtonVisibility() {
        if (!this.installButton) return;
        
        // Hide on very small screens
        if (window.innerWidth < 350) {
            this.installButton.style.display = 'none';
        } else if (this.deferredPrompt && window.innerWidth >= 350) {
            this.installButton.style.display = 'flex';
        }
    }

    // Public API
    isPWAInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches;
    }

    getInstallStatus() {
        return {
            isInstalled: this.isPWAInstalled(),
            canInstall: !!this.deferredPrompt,
            isSupported: 'BeforeInstallPromptEvent' in window
        };
    }
}

export default PWAInstaller;