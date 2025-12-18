/**
 * API Keys Service
 * Manages user's AI provider API keys stored locally
 * Keys are NEVER sent to the server - they stay on the user's device
 */

import { encrypt, decrypt, isEncrypted } from './encryption';

export interface APIKeys {
  gemini?: string;
  openai?: string;
  openrouter?: string;
  ollama?: {
    baseUrl: string;
    model: string;
  };
}

export interface APIKeyConfig {
  provider: 'gemini' | 'openai' | 'openrouter' | 'ollama';
  key?: string;
  model?: string;
  baseUrl?: string; // For Ollama
}

const STORAGE_KEY = 'user_api_keys';
const MODEL_STORAGE_KEY = 'user_ai_models';
const PREFERRED_PROVIDER_KEY = 'user_preferred_provider';

/**
 * Save API key for a provider
 */
export function saveAPIKey(config: APIKeyConfig): void {
  try {
    const keys = loadAPIKeys();

    if (config.provider === 'ollama') {
      keys.ollama = {
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model || 'llama3.2'
      };
    } else {
      if (config.key) {
        // valid key?
        keys[config.provider] = encrypt(config.key);
      }
    }

    // keys object is what we save to localStorage
    // For other keys (that we didn't just update), we need to make sure we don't double-encrypt
    // But wait - loadAPIKeys returns DECRYPTED keys. 
    // So 'keys' variable right now contains decrypted keys.
    // When we save, we need to encrypt ALL of them?
    // 
    // Wait, loadAPIKeys() returns the usable (decrypted) keys.
    // So 'keys' variable holds plain text keys.
    // We need to re-encrypt EVERYTHING before saving.

    const keysToSave: any = { ...keys };

    // Encrypt all string keys before saving
    const providers: (keyof APIKeys)[] = ['gemini', 'openai', 'openrouter'];
    providers.forEach(p => {
      const val = keysToSave[p];
      if (typeof val === 'string') {
        keysToSave[p] = encrypt(val);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(keysToSave));

    // Save model preference
    if (config.model) {
      saveModelPreference(config.provider, config.model);
    }

    console.log(`✅ API key saved for ${config.provider}`);
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw error;
  }
}

/**
 * Load all API keys
 */
export function loadAPIKeys(): APIKeys {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const keys = JSON.parse(stored);
      // Migrate legacy keys if needed
      let hasLegacy = false;

      const processedKeys: APIKeys = {};

      // Handle Ollama specially since it's an object
      if (keys.ollama) {
        processedKeys.ollama = keys.ollama;
      }

      // Process string keys (providers)
      const providers: ('gemini' | 'openai' | 'openrouter')[] = ['gemini', 'openai', 'openrouter'];
      providers.forEach(provider => {
        const value = keys[provider];
        if (typeof value === 'string') {
          if (!isEncrypted(value)) {
            // It's a legacy plain text key
            hasLegacy = true;
            // Encrypt it for the return value so the app works consistent
            // We'll save the encrypted version back to disk below
          }
          // Always decrypt for usage in the app
          processedKeys[provider] = decrypt(value as string);
        }
      });

      // If we found legacy keys, re-save them encrypted immediately
      if (hasLegacy) {
        // We need to construct what we want to save
        const keysToSave = { ...keys };
        providers.forEach(provider => {
          const value = keysToSave[provider];
          if (typeof value === 'string' && !isEncrypted(value)) {
            keysToSave[provider] = encrypt(value);
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keysToSave));
        console.log('🔒 Legacy API keys migrated to encrypted storage');
      }

      return processedKeys;
    }
    return {};
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return {};
  }
}

/**
 * Get API key for a specific provider
 */
export function getAPIKey(provider: 'gemini' | 'openai' | 'openrouter'): string | null {
  const keys = loadAPIKeys();
  return keys[provider] || null;
}

/**
 * Get Ollama configuration
 */
export function getOllamaConfig(): { baseUrl: string; model: string } | null {
  const keys = loadAPIKeys();
  return keys.ollama || null;
}

/**
 * Delete API key for a provider
 */
export function deleteAPIKey(provider: keyof APIKeys): void {
  try {
    const keys = loadAPIKeys();
    delete keys[provider];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    console.log(`✅ API key deleted for ${provider}`);
  } catch (error) {
    console.error('Failed to delete API key:', error);
    throw error;
  }
}

/**
 * Check if any API key is configured
 */
export function hasAnyAPIKey(): boolean {
  const keys = loadAPIKeys();
  return !!(keys.gemini || keys.openai || keys.openrouter || keys.ollama);
}

/**
 * Get the first available provider
 */
export function getAvailableProvider(): 'gemini' | 'openai' | 'openrouter' | 'ollama' | null {
  const keys = loadAPIKeys();

  if (keys.gemini) return 'gemini';
  if (keys.openai) return 'openai';
  if (keys.openrouter) return 'openrouter';
  if (keys.ollama) return 'ollama';

  return null;
}

/**
 * Save model preference for a provider
 */
function saveModelPreference(provider: string, model: string): void {
  try {
    const models = loadModelPreferences();
    models[provider] = model;
    localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models));
  } catch (error) {
    console.error('Failed to save model preference:', error);
  }
}

/**
 * Load model preferences
 */
function loadModelPreferences(): Record<string, string> {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('Failed to load model preferences:', error);
    return {};
  }
}

/**
 * Get model preference for a provider
 */
export function getModelPreference(provider: string): string | null {
  const models = loadModelPreferences();
  return models[provider] || null;
}

/**
 * Get default models for each provider
 */
export function getDefaultModel(provider: 'gemini' | 'openai' | 'openrouter' | 'ollama'): string {
  const defaults: Record<string, string> = {
    gemini: 'gemini-2.0-flash-exp',
    openai: 'gpt-4o-mini',
    openrouter: 'anthropic/claude-3.5-sonnet',
    ollama: 'llama3.2'
  };
  return defaults[provider];
}

/**
 * Validate API key format (basic check)
 */
export function validateAPIKey(provider: 'gemini' | 'openai' | 'openrouter', key: string): boolean {
  if (!key || key.trim().length === 0) {
    return false;
  }

  // Basic format validation
  switch (provider) {
    case 'gemini':
      return key.startsWith('AI') && key.length > 20;
    case 'openai':
      return key.startsWith('sk-') && key.length > 20;
    case 'openrouter':
      return key.startsWith('sk-or-') && key.length > 20;
    default:
      return key.length > 10;
  }
}

/**
 * Mask API key for display (show first 8 and last 4 characters)
 */
export function maskAPIKey(key: string): string {
  if (key.length <= 12) {
    return '••••••••';
  }
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

/**
 * Set preferred provider
 */
export function setPreferredProvider(provider: 'gemini' | 'openai' | 'openrouter' | 'ollama'): void {
  try {
    localStorage.setItem(PREFERRED_PROVIDER_KEY, provider);
    console.log(`✅ Preferred provider set to ${provider}`);
  } catch (error) {
    console.error('Failed to set preferred provider:', error);
  }
}

/**
 * Get preferred provider
 */
export function getPreferredProvider(): string | null {
  return localStorage.getItem(PREFERRED_PROVIDER_KEY);
}

/**
 * Clear all API keys (for logout or reset)
 */
export function clearAllAPIKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODEL_STORAGE_KEY);
    localStorage.removeItem(PREFERRED_PROVIDER_KEY);
    console.log('✅ All API keys cleared');
  } catch (error) {
    console.error('Failed to clear API keys:', error);
  }
}

/**
 * Export API keys (for backup)
 */
export function exportAPIKeys(): string {
  const keys = loadAPIKeys();
  return JSON.stringify(keys, null, 2);
}

/**
 * Import API keys (from backup)
 */
export function importAPIKeys(jsonString: string): void {
  try {
    const keys = JSON.parse(jsonString);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    console.log('✅ API keys imported');
  } catch (error) {
    console.error('Failed to import API keys:', error);
    throw new Error('Invalid API keys format');
  }
}
