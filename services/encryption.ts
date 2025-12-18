import CryptoJS from 'crypto-js';

// Application specific secret - in a real app this should be more complex
// or derived from user input, but for local storage obfuscation this works
// to prevent casual "Inspect Element" snooping.
const SECRET_KEY = 'MemoDirector_Secure_Key_v1';
const ENCRYPTED_PREFIX = 'enc:';

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
    if (!text) return '';
    try {
        const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
        return `${ENCRYPTED_PREFIX}${encrypted}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        return text;
    }
}

/**
 * Decrypt a string value
 * Handles both encrypted values (starting with prefix) and legacy plain text
 */
export function decrypt(text: string): string {
    if (!text) return '';

    // If it's not encrypted (legacy data), return as is
    if (!text.startsWith(ENCRYPTED_PREFIX)) {
        return text;
    }

    try {
        const encryptedContent = text.slice(ENCRYPTED_PREFIX.length);
        const bytes = CryptoJS.AES.decrypt(encryptedContent, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption results in empty string (invalid key/data), return original
        if (!decrypted) return text;

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return text;
    }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(text: string): boolean {
    return text.startsWith(ENCRYPTED_PREFIX);
}
