/**
 * Unified LLM Service
 * Factory for creating and managing LLM providers
 */

import { ILLMProvider, getLLMConfig } from "./llmTypes";
import { GeminiProvider } from "./geminiService";
import { OpenAIProvider } from "./openaiProvider";
import { OpenRouterProvider } from "./openrouterProvider";
import { OllamaProvider } from "./ollamaProvider";
import { Suggestion } from "../types";

/**
 * Get the appropriate LLM provider based on configuration
 */
export const getLLMProvider = (): ILLMProvider => {
  const config = getLLMConfig();

  switch (config.provider) {
    case 'gemini':
      if (!config.apiKey) {
        throw new Error("Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file.");
      }
      return new GeminiProvider(config.apiKey, config.model);

    case 'openai':
      if (!config.apiKey) {
        throw new Error("OpenAI API key is required. Please set VITE_OPENAI_API_KEY in your .env file.");
      }
      return new OpenAIProvider(config.apiKey, config.model);

    case 'openrouter':
      if (!config.apiKey) {
        throw new Error("OpenRouter API key is required. Please set VITE_OPENROUTER_API_KEY in your .env file.");
      }
      return new OpenRouterProvider(config.apiKey, config.model);

    case 'ollama':
      return new OllamaProvider(config.baseUrl, config.model);

    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
};

/**
 * Generate PAO suggestions using the configured LLM provider
 */
export const getPAOSuggestions = async (
  number: number,
  theme: string,
  specificPerson?: string,
  strictMode: boolean = false
): Promise<Suggestion[]> => {
  const config = getLLMConfig();
  console.log('🤖 LLM Provider:', config.provider, '| Model:', config.model);
  console.log('📝 PAO Request:', { number, theme, specificPerson, strictMode });
  
  const provider = getLLMProvider();
  return provider.generatePAOSuggestions(number, theme, specificPerson, strictMode);
};

/**
 * Generate scene description using the configured LLM provider
 */
export const getSceneDescription = async (
  person: string,
  action: string,
  object: string
): Promise<string> => {
  const config = getLLMConfig();
  console.log('🤖 LLM Provider:', config.provider, '| Model:', config.model);
  console.log('🎬 Scene Request:', { person, action, object });
  
  const provider = getLLMProvider();
  return provider.generateSceneDescription(person, action, object);
};

/**
 * Generate memory image (only supported by Gemini)
 */
export const generateMemoryImage = async (sceneDescription: string): Promise<string> => {
  const provider = getLLMProvider();
  
  if (!provider.generateMemoryImage) {
    throw new Error("Image generation is only supported by Gemini provider.");
  }
  
  return provider.generateMemoryImage(sceneDescription);
};

/**
 * Generate memory video (only supported by Gemini)
 */
export const generateMemoryVideo = async (sceneDescription: string): Promise<{blob: Blob, mimeType: string}> => {
  const provider = getLLMProvider();
  
  if (!provider.generateMemoryVideo) {
    throw new Error("Video generation is only supported by Gemini provider.");
  }
  
  return provider.generateMemoryVideo(sceneDescription);
};
