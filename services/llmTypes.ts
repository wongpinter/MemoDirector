/**
 * Types and interfaces for LLM providers
 */

import { Suggestion } from "../types";
import { loadAPIKeys, getModelPreference, getDefaultModel, getPreferredProvider } from './apiKeys';

export type LLMProvider = 'gemini' | 'openai' | 'openrouter' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface LLMResponse {
  text: string;
  suggestions?: Suggestion[];
}

export interface ILLMProvider {
  /**
   * Generate PAO suggestions
   */
  generatePAOSuggestions(
    number: number,
    theme: string,
    specificPerson?: string,
    strictMode?: boolean,
    excludePersons?: string[]
  ): Promise<Suggestion[]>;

  /**
   * Generate scene description
   */
  generateSceneDescription(
    person: string,
    action: string,
    object: string,
    theme?: string,
    personDescription?: string
  ): Promise<string>;

  /**
   * Generate memory image (optional - not all providers support this)
   */
  generateMemoryImage?(sceneDescription: string): Promise<string>;

  /**
   * Generate memory video (optional - not all providers support this)
   */
  generateMemoryVideo?(sceneDescription: string): Promise<{blob: Blob, mimeType: string}>;
}

/**
 * Get LLM configuration from local storage (user's API keys) or environment variables (fallback)
 */
export const getLLMConfig = (): LLMConfig => {
  // First, try to get keys from local storage (user-provided keys)
  const localKeys = loadAPIKeys();
  const preferredProvider = getPreferredProvider();
  
  // If user has set a preferred provider and it's available, use it
  if (preferredProvider) {
    if (preferredProvider === 'gemini' && localKeys.gemini) {
      return {
        provider: 'gemini',
        apiKey: localKeys.gemini,
        model: getModelPreference('gemini') || getDefaultModel('gemini')
      };
    }
    if (preferredProvider === 'openai' && localKeys.openai) {
      return {
        provider: 'openai',
        apiKey: localKeys.openai,
        model: getModelPreference('openai') || getDefaultModel('openai')
      };
    }
    if (preferredProvider === 'openrouter' && localKeys.openrouter) {
      return {
        provider: 'openrouter',
        apiKey: localKeys.openrouter,
        baseUrl: 'https://openrouter.ai/api/v1',
        model: getModelPreference('openrouter') || getDefaultModel('openrouter')
      };
    }
    if (preferredProvider === 'ollama' && localKeys.ollama) {
      return {
        provider: 'ollama',
        baseUrl: localKeys.ollama.baseUrl,
        model: localKeys.ollama.model
      };
    }
  }
  
  // Fallback to priority order: Gemini > OpenAI > OpenRouter > Ollama
  if (localKeys.gemini) {
    return {
      provider: 'gemini',
      apiKey: localKeys.gemini,
      model: getModelPreference('gemini') || getDefaultModel('gemini')
    };
  }

  if (localKeys.openai) {
    return {
      provider: 'openai',
      apiKey: localKeys.openai,
      model: getModelPreference('openai') || getDefaultModel('openai')
    };
  }

  if (localKeys.openrouter) {
    return {
      provider: 'openrouter',
      apiKey: localKeys.openrouter,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: getModelPreference('openrouter') || getDefaultModel('openrouter')
    };
  }

  if (localKeys.ollama) {
    return {
      provider: 'ollama',
      baseUrl: localKeys.ollama.baseUrl,
      model: localKeys.ollama.model
    };
  }

  // Fallback to environment variables (for backward compatibility during development)
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const ollamaUrl = import.meta.env.VITE_OLLAMA_BASE_URL;

  if (geminiKey) {
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp'
    };
  }

  if (openaiKey) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
    };
  }

  if (openrouterKey) {
    return {
      provider: 'openrouter',
      apiKey: openrouterKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'
    };
  }

  if (ollamaUrl) {
    return {
      provider: 'ollama',
      baseUrl: ollamaUrl || 'http://localhost:11434',
      model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2'
    };
  }

  // No API key configured
  throw new Error('No AI provider configured. Please add your API key in Settings.');
};
