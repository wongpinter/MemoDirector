/**
 * Types and interfaces for LLM providers
 */

import { Suggestion } from "../types";

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
    strictMode?: boolean
  ): Promise<Suggestion[]>;

  /**
   * Generate scene description
   */
  generateSceneDescription(
    person: string,
    action: string,
    object: string
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
 * Get LLM configuration from environment variables
 */
export const getLLMConfig = (): LLMConfig => {
  // Check which provider is configured
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const ollamaUrl = import.meta.env.VITE_OLLAMA_BASE_URL;

  // Priority: Gemini > OpenAI > OpenRouter > Ollama
  if (geminiKey) {
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
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

  // Default to Gemini (will throw error if no key)
  return {
    provider: 'gemini',
    apiKey: geminiKey
  };
};
