/* ====== GOOGLE DRIVE SERVICE ====== */
/* 
 * Secure Service for Google Drive API interactions
 * Uses Google Identity Services (GIS) for Auth v2
 * 
 * SECURITY RULES:
 * - Scope: 'https://www.googleapis.com/auth/drive.appdata' ONLY
 * - Token Storage: sessionStorage ONLY (cleared on tab close)
 * - No implicit background sync without user content
 */

export class GoogleDriveService {
    constructor() {
        this.tokenClient = null;
        this.accessToken = null;
        this.clientId = null;
        this.tokenExpiration = null;

        // Load token from session if available and valid
        this._loadSessionToken();
    }

    /**
     * Initializes the Google Identity Services client
     * @param {string} clientId - The Google Cloud Client ID provided by user
     */
    initClient(clientId) {
        if (!clientId) {
            console.warn('GoogleDriveService: No Client ID provided.');
            return;
        }

        this.clientId = clientId;

        // Check if GIS script is loaded
        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
            console.error('Google Identity Services script not loaded.');
            return;
        }

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: 'https://www.googleapis.com/auth/drive.appdata',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    this._handleTokenResponse(tokenResponse);
                }
            },
        });

        console.log('✅ Google Drive Service Initialized');
    }

    /* ====== AUTHENTICATION ====== */

    get isAuthenticated() {
        return !!this.accessToken && Date.now() < this.tokenExpiration;
    }

    async signIn() {
        if (!this.tokenClient) {
            throw new Error('Client ID not configured. Please go to Settings.');
        }

        // Trigger Popup
        return new Promise((resolve, reject) => {
            // Override callback for this specific request if needed, 
            // but initTokenClient callback handles it globaly. 
            // We can wrap the flow to await the result.

            // For simplicity in this architecture, we restart the flow or trust the global callback
            // to update state. To make it awaitable, we can override callback temporarily.

            this.tokenClient.callback = (resp) => {
                if (resp.error) {
                    reject(resp);
                } else {
                    this._handleTokenResponse(resp);
                    resolve(resp);
                }
            };

            // Prompt user
            // prompt: 'consent' forces auth screen if needed to insure we get a refresh of rights
            // Explicitly request scope as requested
            this.tokenClient.requestAccessToken({
                prompt: 'consent',
                scope: 'https://www.googleapis.com/auth/drive.appdata'
            });
        });
    }

    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Token revoked');
            });
        }
        this._clearSession();
    }

    _handleTokenResponse(tokenResponse) {
        this.accessToken = tokenResponse.access_token;
        // Expires in is usually 3599 seconds. Set explicit expiration.
        const expiresInSeconds = tokenResponse.expires_in || 3599;
        this.tokenExpiration = Date.now() + (expiresInSeconds * 1000);

        // Save strict session storage
        // Save strict session storage
        sessionStorage.setItem('fm_gdrive_token_v2', this.accessToken);
        sessionStorage.setItem('fm_gdrive_exp', this.tokenExpiration);

        console.log('✅ Google Drive Logged In');
    }

    _loadSessionToken() {
        const token = sessionStorage.getItem('fm_gdrive_token_v2');
        const exp = sessionStorage.getItem('fm_gdrive_exp');

        if (token && exp && Date.now() < parseInt(exp)) {
            this.accessToken = token;
            this.tokenExpiration = parseInt(exp);
            console.log('🔄 Restored Google Drive Session');
        } else {
            this._clearSession();
        }
    }

    _clearSession() {
        this.accessToken = null;
        this.tokenExpiration = null;
        sessionStorage.removeItem('fm_gdrive_token_v2');
        sessionStorage.removeItem('fm_gdrive_exp');
    }

    /* ====== DRIVE API OPERATIONS ====== */

    async _fetch(endpoint, options = {}) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please sign in again.');
        }

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers
        };

        const response = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                this._clearSession();
                throw new Error('Session expired. Please sign in again.');
            }
            const error = await response.json();
            throw new Error(error.error?.message || 'Drive API Error');
        }

        return response;
    }

    /**
     * Uploads a file to the App Data folder
     * @param {string} fileName - Name of the file
     * @param {Object} content - JSON object content (encrypted structure)
     */
    async uploadFile(fileName, content) {
        const metadata = {
            name: fileName,
            parents: ['appDataFolder']
        };

        const boundary = '314159265358979323846';
        const dashBoundary = `--${boundary}`;

        let body = '';
        body += dashBoundary + '\r\n';
        body += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
        body += JSON.stringify(metadata) + '\r\n\r\n';

        body += dashBoundary + '\r\n';
        body += 'Content-Type: application/octet-stream\r\n\r\n';
        body += content + '\r\n';

        body += dashBoundary + '--';

        const blob = new Blob([body], {
            type: `multipart/related; boundary=${boundary}`
        });

        // Bypass _fetch() for uploads - use direct fetch with full URL
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please sign in again.');
        }

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&spaces=appDataFolder',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: blob
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                this._clearSession();
                throw new Error('Session expired. Please sign in again.');
            }
            const error = await response.json();
            throw new Error(error.error?.message || 'Drive API Error');
        }

        return await response.json();
    }

    /**
     * Lists backup files in App Data folder
     */
    async listFiles() {
        const q = "name contains 'finmaster_backup_' and 'appDataFolder' in parents and trashed = false";
        const fields = 'files(id, name, createdTime, size)';
        const orderBy = 'createdTime desc';

        // Explicitly set spaces=appDataFolder
        const response = await this._fetch(`files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=30`, {
            method: 'GET'
        });

        return await response.json();
    }

    /**
     * Downloads file content
     * @param {string} fileId 
     */
    async downloadFile(fileId) {
        const response = await this._fetch(`files/${fileId}?alt=media`, {
            method: 'GET'
        });

        // Return text, let manager parse it (since it might be Base64)
        return await response.text();
    }

    /**
     * Deletes a file
     * @param {string} fileId 
     */
    async deleteFile(fileId) {
        await this._fetch(`files/${fileId}`, {
            method: 'DELETE'
        });
    }
}
