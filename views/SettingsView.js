/* ====== SETTINGS VIEW MODULE ====== */

class SettingsView {
    constructor(app) {
        this.app = app;
    }

    render() {
        console.log('⚙️ Rendering Settings View...');

        const html = this.getSettingsHTML();
        this.app.elements.mainContent.innerHTML = html;

        this.app.elements.mainContent.className = 'main-content settings-view';
        // Initialize after DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 50);
    }

    getSettingsHTML() {
        return `
            <!-- SETTINGS HEADER -->
            <div class="settings-header">
                <div class="section-title">⚙️ Pengaturan Aplikasi</div>
                <div class="text-muted" style="margin-top: var(--space-2);">
                    Kelola pengaturan akun, aplikasi, dan data keuangan Anda
                </div>
            </div>
            
            <!-- SETTINGS GRID -->
            <div class="settings-grid">
                
                <!-- PROFILE SETTINGS -->
                ${this.getProfileSettingsHTML()}
                
                <!-- APP SETTINGS -->
                ${this.getAppSettingsHTML()}
                
                <!-- DATA MANAGEMENT -->
                ${this.getDataManagementHTML()}
                
                <!-- DANGER ZONE -->
                ${this.getDangerZoneHTML()}
            </div>
        `;
    }

    getProfileSettingsHTML() {
        const profileStats = this.getProfileStats();

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <div class="settings-section-title">
                        <div class="settings-icon">👤</div>
                        <div>
                            <div style="font-weight: 600;">Profil Pengguna</div>
                            <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                Kelola informasi akun Anda
                            </div>
                        </div>
                    </div>
                    <button class="btn-outline" onclick="app.editProfile()" id="editProfileBtn">
                        ✏️ Edit
                    </button>
                </div>
                
                <div class="settings-content">
                    <div class="profile-display">
                        <div class="avatar-large" id="profileAvatar">${this.app.state.user.avatar}</div>
                        <div class="profile-info">
                            <div style="font-weight: 700; font-size: 1.25rem;" id="profileName">${this.app.state.user.name}</div>
                            <div class="profile-badge ${this.app.state.user.isPremium ? 'premium' : 'free'}">
                                ${this.app.state.user.isPremium ? '⭐ PREMIUM USER' : '🆓 FREE USER'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="stat-label">Bergabung</div>
                            <div class="stat-value">${this.app.uiManager.formatDate(new Date().toISOString())}</div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-label">Total Transaksi</div>
                            <div class="stat-value">${profileStats.totalTransactions}</div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-label">Goals Aktif</div>
                            <div class="stat-value">${profileStats.activeGoals}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAppSettingsHTML() {
        const themeOptions = {
            'auto': 'Sesuai Sistem',
            'light': 'Light Mode',
            'dark': 'Dark Mode'
        };

        const currencyOptions = {
            'IDR': 'IDR (Rp)',
            'USD': 'USD ($)',
            'EUR': 'EUR (€)',
            'SGD': 'SGD (S$)'
        };

        const themeSelectOptions = Object.entries(themeOptions).map(([value, label]) => {
            const selected = this.app.state.settings.theme === value ? 'selected' : '';
            return `<option value="${value}" ${selected}>${label}</option>`;
        }).join('');

        const currencySelectOptions = Object.entries(currencyOptions).map(([value, label]) => {
            const selected = this.app.state.settings.currency === value ? 'selected' : '';
            return `<option value="${value}" ${selected}>${label}</option>`;
        }).join('');

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <div class="settings-section-title">
                        <div class="settings-icon">⚙️</div>
                        <div>
                            <div style="font-weight: 600;">Pengaturan Aplikasi</div>
                            <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                Kustomisasi pengalaman penggunaan
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-content">
                    <!-- Theme Setting -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Tema</div>
                            <div class="setting-description">Pilih tampilan light atau dark mode</div>
                        </div>
                        <div class="setting-control">
                            <select id="themeSelect" class="setting-select">
                                ${themeSelectOptions}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Currency Setting -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Mata Uang</div>
                            <div class="setting-description">Format mata uang untuk semua transaksi</div>
                        </div>
                        <div class="setting-control">
                            <select id="currencySelect" class="setting-select" onchange="app.changeCurrency(this.value)">
                                ${currencySelectOptions}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Auto-save Setting -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Auto-save</div>
                            <div class="setting-description">Simpan data otomatis saat ada perubahan</div>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="autoSaveToggle" ${this.app.state.settings.autoSave ? 'checked' : ''} 
                                       onchange="app.toggleSetting('autoSave', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Notifications Setting -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Notifikasi</div>
                            <div class="setting-description">Aktifkan notifikasi pengingat</div>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="notificationsToggle" ${this.app.state.settings.notifications ? 'checked' : ''}
                                       onchange="app.toggleSetting('notifications', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDataManagementHTML() {
        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <div class="settings-section-title">
                        <div class="settings-icon">💾</div>
                        <div>
                            <div style="font-weight: 600;">Manajemen Data</div>
                            <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                Backup, restore, dan kelola data Anda
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-content">
                    <!-- Export Options -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Export Data</div>
                            <div class="setting-description">Ekspor data ke berbagai format</div>
                        </div>
                        <div class="setting-control">
                            <div class="button-group">
                                <button class="btn-outline" onclick="app.exportData('json')" style="font-size: 0.875rem;">
                                    JSON
                                </button>
                                <button class="btn-outline" onclick="app.exportData('csv')" style="font-size: 0.875rem;">
                                    CSV
                                </button>
                                <button class="btn-outline" onclick="app.generateProfessionalPDF()" style="font-size: 0.875rem;">
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Import Data -->
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Import Data</div>
                            <div class="setting-description">Impor data dari file backup</div>
                        </div>
                        <div class="setting-control">
                            <button class="btn-outline" onclick="app.importData()" style="font-size: 0.875rem;">
                                📥 Pilih File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDangerZoneHTML() {
        return `
            <div class="settings-section danger-zone">
                <div class="settings-section-header">
                    <div class="settings-section-title">
                        <div class="settings-icon">⚠️</div>
                        <div>
                            <div style="font-weight: 600; color: var(--danger);">Zona Berbahaya</div>
                            <div class="text-muted" style="font-size: 0.875rem; margin-top: 2px;">
                                Aksi ini tidak dapat dibatalkan
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-content">
                    <div class="danger-actions">
                        <button class="btn-outline danger" onclick="app.resetSettingsToDefault()">
                            <span>🔄</span> Reset Pengaturan
                        </button>
                        <button class="btn danger" onclick="app.clearData()">
                            <span>💥</span> Hapus Semua Data
                        </button>
                    </div>
                    <div class="danger-warning">
                        <span style="color: var(--danger);">⚠️ PERINGATAN:</span> 
                        Data yang dihapus tidak dapat dikembalikan. Pastikan Anda sudah backup data penting.
                    </div>
                </div>
            </div>
        `;
    }

    getProfileStats() {
        return {
            totalTransactions: this.app.state.transactions.income.length + this.app.state.transactions.expenses.length,
            activeGoals: this.app.state.goals.length
        };
    }

    initialize() {
        // Setup event listeners for settings
        this.setupEventListeners();

        // Update app status
        this.updateAppStatus();
    }

    setupEventListeners() {
        // Edit profile button
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.editProfile();
        });

        // Theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.onchange = (e) => {
                this.app.uiManager.changeTheme(e.target.value);
            };
        }

        // Currency select
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.onchange = (e) => {
                this.changeCurrency(e.target.value);
            };
        }

        // Auto-save toggle
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.onchange = (e) => {
                this.app.toggleSetting('autoSave', e.target.checked);
            };
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.onchange = (e) => {
                this.app.toggleSetting('notifications', e.target.checked);
            };
        }

        // Export buttons
        document.querySelectorAll('[onclick*="exportData"]').forEach(btn => {
            btn.onclick = (e) => {
                const format = e.target.textContent.trim();
                if (format === 'JSON') {
                    this.app.reportGenerator.exportData('json');
                } else if (format === 'CSV') {
                    this.app.reportGenerator.exportData('csv');
                }
            };
        });

        // PDF export button
        document.querySelector('[onclick*="generateProfessionalPDF"]')?.addEventListener('click', () => {
            this.app.reportGenerator.generateProfessionalPDF();
        });

        // Import data button
        document.querySelector('[onclick*="importData"]')?.addEventListener('click', () => {
            this.app.dataManager.importData();
        });

        // Reset settings button
        document.querySelector('[onclick*="resetSettingsToDefault"]')?.addEventListener('click', () => {
            this.resetSettingsToDefault();
        });

        // Clear data button
        document.querySelector('[onclick*="clearData"]')?.addEventListener('click', () => {
            this.app.dataManager.clearData();
        });
    }

    editProfile() {
        const newName = prompt('Masukkan nama baru:', this.app.state.user.name);
        if (newName && newName.trim() !== '') {
            this.app.state.user.name = newName.trim();
            this.app.state.user.avatar = newName.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            this.app.dataManager.saveData(false);
            this.refresh();
            this.app.uiManager.showNotification('Profil berhasil diperbarui!', 'success');
        }
    }

    changeCurrency(currency) {
        if (confirm(`Ubah mata uang ke ${currency}? Semua nilai akan dikonversi secara visual.`)) {
            this.app.state.settings.currency = currency;
            this.app.dataManager.saveData(true);
            this.app.uiManager.updateUI();
            this.app.uiManager.showNotification(`Mata uang diubah ke: ${currency}`, 'success');
        } else {
            // Reset select to previous value
            const select = document.getElementById('currencySelect');
            if (select) {
                select.value = this.app.state.settings.currency;
            }
        }
    }

    resetSettingsToDefault() {
        if (confirm('Reset semua pengaturan ke default? Data transaksi tidak akan terpengaruh.')) {
            this.app.state.settings = {
                currency: 'IDR',
                theme: 'auto',
                notifications: true,
                autoSave: true
            };
            this.app.dataManager.saveData(true);
            this.refresh();
            this.app.uiManager.showNotification('✅ Pengaturan direset ke default', 'success');
        }
    }

    updateAppStatus() {
        const appModeElement = document.getElementById('appMode');
        if (appModeElement) {
            const isOnline = navigator.onLine;
            appModeElement.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
            appModeElement.style.color = isOnline ? 'var(--success)' : 'var(--danger)';
        }
    }

    refresh() {
        // Refresh profile section
        const profileAvatar = document.getElementById('profileAvatar');
        const profileName = document.getElementById('profileName');

        if (profileAvatar) {
            profileAvatar.textContent = this.app.state.user.avatar;
        }

        if (profileName) {
            profileName.textContent = this.app.state.user.name;
        }

        // Refresh profile stats
        const profileStats = this.getProfileStats();
        const profileStatElements = document.querySelectorAll('.profile-stat .stat-value');
        if (profileStatElements.length >= 3) {
            profileStatElements[1].textContent = profileStats.totalTransactions;
            profileStatElements[2].textContent = profileStats.activeGoals;
        }

        // Refresh settings controls
        this.refreshSettingsControls();
    }

    refreshSettingsControls() {
        // Theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.app.state.settings.theme;
        }

        // Currency select
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = this.app.state.settings.currency;
        }

        // Auto-save toggle
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.checked = this.app.state.settings.autoSave;
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.checked = this.app.state.settings.notifications;
        }
    }
}

export default SettingsView;