/* ====== BACKUP MANAGER MODULE ====== */
import { CryptoService } from '../services/CryptoService.js';
import { GoogleDriveService } from '../services/GoogleDriveService.js';

export class BackupManager {
    constructor(app) {
        this.app = app;
        this.cryptoService = new CryptoService();
        this.driveService = new GoogleDriveService();
    }

    /**
     * Initializes the backup system with the Google Client ID
     * @param {string} clientId 
     */
    initialize(clientId) {
        this.driveService.initClient(clientId);
    }

    get isConfigured() {
        return !!this.driveService.clientId;
    }

    get isLoggedIn() {
        return this.driveService.isAuthenticated;
    }

    /**
     * Authentication Flow
     */
    async login() {
        try {
            await this.driveService.signIn();
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    logout() {
        this.driveService.signOut();
    }

    /**
     * Perform Secure Backup
     * @param {string} password - User provided password for encryption
     */
    async backupNow(password) {
        if (!password) throw new Error('Password is required for encryption.');
        if (!this.isLoggedIn) throw new Error('Not logged into Google Drive.');

        try {
            // 1. Export Data (Validation happens in DataManager)
            const exportData = this.app.dataManager.exportData();
            const jsonString = JSON.stringify(exportData);

            // 2. Encrypt Data
            console.log('🔒 Encrypting backup...');
            const encryptedPackage = await this.cryptoService.encryptData(jsonString, password);

            // 3. Generate Filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `finmaster_backup_${timestamp}.json`;

            // 4. Upload to Drive
            // Base64 encode to ensure it's treated as a raw string and not parsed as JSON by Drive
            const contentToUpload = btoa(JSON.stringify(encryptedPackage));

            console.log('☁️ Uploading to Drive...');
            const result = await this.driveService.uploadFile(fileName, contentToUpload);

            console.log('✅ Backup successful:', result.id);
            return result;

        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }

    /**
     * List available backups
     */
    async getBackups() {
        if (!this.isLoggedIn) return [];
        try {
            const list = await this.driveService.listFiles();
            return list.files || [];
        } catch (error) {
            console.error('Failed to list backups:', error);
            throw error;
        }
    }

    /**
     * Restore from a backup file
     * @param {string} fileId 
     * @param {string} password 
     */
    async restoreBackup(fileId, password) {
        if (!password) throw new Error('Password required to decrypt.');

        try {
            // 1. Download Encrypted Content (Text)
            console.log('⬇️ Downloading backup...');
            const encryptedContentBase64 = await this.driveService.downloadFile(fileId);

            // 2. Decrypt Content
            console.log('unlocking Decrypting data...');

            // Decode Base64 to get the original encrypted package JSON
            let encryptedPackage;
            try {
                // If the file is base64 encoded string
                encryptedPackage = JSON.parse(atob(encryptedContentBase64));
            } catch (e) {
                console.error('Base64 decode failed, trying raw JSON parse:', e);
                // Fallback for legacy backups
                encryptedPackage = JSON.parse(encryptedContentBase64);
            }

            const jsonString = await this.cryptoService.decryptData(encryptedPackage, password);
            const data = JSON.parse(jsonString);

            // 3. Import Data (Validation happens in DataManager)
            console.log('💾 Importing data...');
            const success = this.app.dataManager.importData(data);

            if (success) {
                console.log('✅ Restore complete. Reloading app...');
                setTimeout(() => window.location.reload(), 1000);
            }

            return success;

        } catch (error) {
            console.error('Restore failed:', error);
            throw new Error('Restore failed. Wrong password or corrupted file.');
        }
    }

    /**
     * Delete a backup file
     * @param {string} fileId 
     */
    async deleteBackup(fileId) {
        try {
            await this.driveService.deleteFile(fileId);
            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            throw error;
        }
    }
}
