/**
 * LLM Config — key management + provider resolution.
 *
 * BYOK model: keys live in localStorage (encrypted), never touch the server.
 * Callers use getConfig() for the fully resolved provider config.
 * Settings UI uses getKeys() / setKey() / removeKey() for CRUD.
 */

import { encrypt, decrypt, isEncrypted } from './encryption';
import { safeJsonParse } from '../utils';

// ── types ────────────────────────────────────────────────────────

export type LLMProvider = 'gemini' | 'openai' | 'openrouter' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface APIKeys {
  gemini?: string;
  openai?: string;
  openrouter?: string;
  ollama?: { baseUrl: string; model: string };
}

export interface APIKeyConfig {
  provider: LLMProvider;
  key?: string;
  model?: string;
  baseUrl?: string;
}

// ── internal ──────────────────────────────────────────────────────

interface EncryptedAPIKeys {
  gemini?: string;
  openai?: string;
  openrouter?: string;
  ollama?: { baseUrl: string; model: string };
}

const STORAGE_KEY = 'user_api_keys';
const MODEL_STORAGE_KEY = 'user_ai_models';
const PREFERRED_PROVIDER_KEY = 'user_preferred_provider';

const PROVIDER_DEFAULTS: Record<LLMProvider, string> = {
  gemini: 'gemini-2.0-flash-exp',
  openai: 'gpt-4o-mini',
  openrouter: 'anthropic/claude-3.5-sonnet',
  ollama: 'llama3.2',
};

function _loadModelPreferences(): Record<string, string> {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  if (!stored) return {};
  return safeJsonParse<Record<string, string>>(stored, {});
}

function _saveModelPreference(provider: string, model: string): void {
  const models = _loadModelPreferences();
  models[provider] = model;
  localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models));
}

// ── public: resolved config ───────────────────────────────────────

/**
 * Fully resolved config for the provider factory.
 * Priority: user keys (respecting preferred provider) → env vars → throw.
 */
export function getConfig(): LLMConfig {
  const keys = getKeys();
  const preferred = getPreferredProvider();

  // 1. preferred provider
  if (preferred) {
    if (preferred === 'gemini' && keys.gemini) return _makeConfig('gemini', keys.gemini);
    if (preferred === 'openai' && keys.openai) return _makeConfig('openai', keys.openai);
    if (preferred === 'openrouter' && keys.openrouter)
      return { ..._makeConfig('openrouter', keys.openrouter), baseUrl: 'https://openrouter.ai/api/v1' };
    if (preferred === 'ollama' && keys.ollama)
      return { provider: 'ollama', baseUrl: keys.ollama.baseUrl, model: keys.ollama.model };
  }

  // 2. first available user key
  if (keys.gemini) return _makeConfig('gemini', keys.gemini);
  if (keys.openai) return _makeConfig('openai', keys.openai);
  if (keys.openrouter)
    return { ..._makeConfig('openrouter', keys.openrouter), baseUrl: 'https://openrouter.ai/api/v1' };
  if (keys.ollama)
    return { provider: 'ollama', baseUrl: keys.ollama.baseUrl, model: keys.ollama.model };

  // 3. env var fallback
  const gk = import.meta.env.VITE_GEMINI_API_KEY;
  if (gk) return { provider: 'gemini', apiKey: gk, model: import.meta.env.VITE_GEMINI_MODEL || PROVIDER_DEFAULTS.gemini };

  const ok = import.meta.env.VITE_OPENAI_API_KEY;
  if (ok) return { provider: 'openai', apiKey: ok, model: import.meta.env.VITE_OPENAI_MODEL || PROVIDER_DEFAULTS.openai };

  const rk = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (rk)
    return { provider: 'openrouter', apiKey: rk, baseUrl: 'https://openrouter.ai/api/v1', model: import.meta.env.VITE_OPENROUTER_MODEL || PROVIDER_DEFAULTS.openrouter };

  const ou = import.meta.env.VITE_OLLAMA_BASE_URL;
  if (ou)
    return { provider: 'ollama', baseUrl: ou, model: import.meta.env.VITE_OLLAMA_MODEL || PROVIDER_DEFAULTS.ollama };

  throw new Error('No AI provider configured. Please add your API key in Settings.');
}

function _makeConfig(provider: LLMProvider, apiKey: string): LLMConfig {
  return {
    provider,
    apiKey,
    model: getModelPreference(provider) || PROVIDER_DEFAULTS[provider],
  };
}

// ── public: key CRUD ──────────────────────────────────────────────

/** All decrypted keys — for settings UI. */
export function getKeys(): APIKeys {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  const raw = safeJsonParse<EncryptedAPIKeys>(stored, {});
  const keys: APIKeys = {};
  let hasLegacy = false;

  if (raw.ollama) keys.ollama = raw.ollama;

  const stringProviders: Array<'gemini' | 'openai' | 'openrouter'> = ['gemini', 'openai', 'openrouter'];
  for (const p of stringProviders) {
    const val = raw[p];
    if (typeof val === 'string') {
      if (!isEncrypted(val)) hasLegacy = true;
      keys[p] = decrypt(val);
    }
  }

  if (hasLegacy) {
    const toSave: EncryptedAPIKeys = { ...raw };
    for (const p of stringProviders) {
      if (typeof toSave[p] === 'string' && !isEncrypted(toSave[p]!)) {
        (toSave[p] as string) = encrypt(toSave[p]!);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  return keys;
}

/** Save (or update) a key for a provider. Handles encryption internally. */
export function setKey(config: APIKeyConfig): void {
  const keys = getKeys();

  if (config.provider === 'ollama') {
    keys.ollama = {
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama3.2',
    };
  } else if (config.key) {
    keys[config.provider] = config.key;
  }

  const toSave: EncryptedAPIKeys = { ...keys };
  const stringProviders: Array<'gemini' | 'openai' | 'openrouter'> = ['gemini', 'openai', 'openrouter'];
  for (const p of stringProviders) {
    if (typeof toSave[p] === 'string') {
      (toSave[p] as string) = encrypt(toSave[p]!);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

  if (config.model) setModelPreference(config.provider, config.model);
}

/** Remove a key for a provider. */
export function removeKey(provider: keyof APIKeys): void {
  const keys = getKeys();
  delete keys[provider];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** True if at least one provider has a key configured. */
export function hasAnyKey(): boolean {
  const keys = getKeys();
  return !!(keys.gemini || keys.openai || keys.openrouter || keys.ollama);
}

/** First available provider, respecting preferred. Null if none. */
export function getAvailableProvider(): LLMProvider | null {
  const preferred = getPreferredProvider();
  const keys = getKeys();

  if (preferred && keys[preferred as keyof APIKeys]) return preferred;
  if (keys.gemini) return 'gemini';
  if (keys.openai) return 'openai';
  if (keys.openrouter) return 'openrouter';
  if (keys.ollama) return 'ollama';
  return null;
}

/** Clear all keys, model preferences, and preferred provider. */
export function clearAllKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(MODEL_STORAGE_KEY);
  localStorage.removeItem(PREFERRED_PROVIDER_KEY);
}

// ── public: model preferences ─────────────────────────────────────

export function getModelPreference(provider: string): string | null {
  return _loadModelPreferences()[provider] || null;
}

export function setModelPreference(provider: string, model: string): void {
  _saveModelPreference(provider, model);
}

export function getDefaultModel(provider: LLMProvider): string {
  return PROVIDER_DEFAULTS[provider];
}

// ── public: preferred provider ────────────────────────────────────

export function getPreferredProvider(): LLMProvider | null {
  return (localStorage.getItem(PREFERRED_PROVIDER_KEY) as LLMProvider) || null;
}

export function setPreferredProvider(provider: LLMProvider): void {
  localStorage.setItem(PREFERRED_PROVIDER_KEY, provider);
}

// ── public: presentation utilities (settings UI) ──────────────────

/** Mask a key for display: "sk-abc...xyz". */
export function maskAPIKey(key: string): string {
  if (key.length <= 12) return '••••••••';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

/** Basic format validation. */
export function validateAPIKey(provider: LLMProvider, key: string): boolean {
  if (!key || key.trim().length === 0) return false;
  switch (provider) {
    case 'gemini':     return key.startsWith('AI') && key.length > 20;
    case 'openai':     return key.startsWith('sk-') && key.length > 20;
    case 'openrouter': return key.startsWith('sk-or-') && key.length > 20;
    default:           return key.length > 10;
  }
}

// ── public: export/import ─────────────────────────────────────────

export function exportKeys(): string {
  return JSON.stringify(getKeys(), null, 2);
}

export function importKeys(jsonString: string): void {
  const parsed = safeJsonParse<EncryptedAPIKeys>(jsonString, {});
  if (Object.keys(parsed).length === 0) throw new Error('Invalid API keys format');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}
