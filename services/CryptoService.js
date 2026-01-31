/* ====== CRYPTO SERVICE ====== */
/* 
 * Secure Client-Side Encryption Service
 * Uses Web Crypto API:
 * - PBKDF2 (SHA-256, 100,000 iterations) for Key Derivation
 * - AES-GCM (256-bit) for Encryption/Decryption
 * 
 * NO SENSITIVE DATA IS STORED.
 * Passwords are used ephemerally to derive keys and are then discarded.
 */

export class CryptoService {
    constructor() {
        this.algo = {
            name: 'AES-GCM',
            length: 256
        };
        this.kdf = {
            name: 'PBKDF2',
            hash: 'SHA-256',
            iterations: 100000
        };
    }

    /* ====== PUBLIC API ====== */

    /**
     * Encrypts a JSON object string using a password.
     * @param {string} dateJSON - The JSON string to encrypt.
     * @param {string} password - The user's password.
     * @returns {Promise<Object>} Object containing { ciphertext, salt, iv } (all base64 encoded).
     */
    async encryptData(dataJSON, password) {
        try {
            // 1. Generate random Salt and IV
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // 2. Derive Key from Password
            const key = await this._deriveKey(password, salt);

            // 3. Encrypt Data
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataJSON);

            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );

            // 4. Return packaged result (Base64 encoded for storage/transmission)
            return {
                ciphertext: this._arrayBufferToBase64(encryptedBuffer),
                salt: this._arrayBufferToBase64(salt),
                iv: this._arrayBufferToBase64(iv),
                version: 1 // For future compatibility
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Encryption failed. Please check your data or try again.');
        }
    }

    /**
     * Decrypts an encrypted package using a password.
     * @param {Object} encryptedPackage - { ciphertext, salt, iv }.
     * @param {string} password - The user's password.
     * @returns {Promise<string>} The decrypted JSON string.
     */
    async decryptData(encryptedPackage, password) {
        try {
            const { ciphertext, salt, iv } = encryptedPackage;

            // 1. Decode Base64 components
            const saltBuffer = this._base64ToArrayBuffer(salt);
            const ivBuffer = this._base64ToArrayBuffer(iv);
            const dataBuffer = this._base64ToArrayBuffer(ciphertext);

            // 2. Derive Key (Same parameters as encryption)
            const key = await this._deriveKey(password, saltBuffer);

            // 3. Decrypt Data
            // This will THROW if the password/key is wrong (Auth Tag mismatch)
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: ivBuffer },
                key,
                dataBuffer
            );

            // 4. Decode to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);

        } catch (error) {
            console.error('Decryption failed:', error);
            // Distinguish between wrong password and other errors if possible, 
            // but Web Crypto usually genericizes "OperationError" for tag mismatch.
            throw new Error('Decryption failed. Incorrect password or corrupted file.');
        }
    }

    /* ====== HELPERS ====== */

    async _deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.kdf.iterations,
                hash: this.kdf.hash
            },
            passwordKey,
            this.algo,
            false,
            ['encrypt', 'decrypt']
        );
    }

    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    _base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
