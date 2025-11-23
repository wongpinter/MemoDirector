/**
 * Ollama LLM Provider Implementation
 * Ollama is a local LLM runner with OpenAI-compatible API
 */

import { Suggestion } from "../types";
import { ILLMProvider } from "./llmTypes";
import { getPhoneticsForNumber } from "../constants";
import { sanitizeForAIPrompt } from "../utils/validation";
import {
  getPAOStrictPersonPrompt,
  getPAOPersonPrompt,
  getPAOThemePrompt,
  getSceneDescriptionPrompt,
  PAOPromptParams,
  ScenePromptParams
} from "./prompts";
import { fetchWithTimeout, DEFAULT_LLM_TIMEOUT, cleanLLMThinking, enforceWordLimit } from "./llmUtils";

export class OllamaProvider implements ILLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.model = model || 'llama3.2';
  }

  private async makeRequest(prompt: string, systemPrompt?: string, jsonMode: boolean = false): Promise<string> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
          format: jsonMode ? 'json' : undefined
        })
      },
      DEFAULT_LLM_TIMEOUT
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  async generatePAOSuggestions(
    number: number,
    theme: string,
    specificPerson?: string,
    strictMode: boolean = false,
    excludePersons?: string[]
  ): Promise<Suggestion[]> {
    const sanitizedTheme = sanitizeForAIPrompt(theme);
    const sanitizedPerson = specificPerson ? sanitizeForAIPrompt(specificPerson) : undefined;

    const phonetics = getPhoneticsForNumber(number);
    const strNum = number.toString().padStart(2, '0');
    const d1 = strNum[0];
    const d2 = strNum[1];

    const params: PAOPromptParams = {
      number,
      strNum,
      d1,
      d2,
      phonetics,
      theme: sanitizedTheme,
      specificPerson: sanitizedPerson,
      strictMode,
      excludePersons
    };

    let prompt = "";

    if (sanitizedPerson && sanitizedPerson.trim().length > 0) {
      if (strictMode) {
        prompt = getPAOStrictPersonPrompt(params);
      } else {
        prompt = getPAOPersonPrompt(params);
      }
    } else {
      prompt = getPAOThemePrompt(params);
    }

    const systemPrompt = 'You are an expert in the Major System mnemonic technique. Always respond with valid JSON.';
    
    console.log('📤 [Ollama] PAO Prompt:\n', prompt);
    
    try {
      const responseText = await this.makeRequest(prompt, systemPrompt, true);
      console.log('📥 [Ollama] Raw Response:', responseText.substring(0, 500));

      const parsed = JSON.parse(responseText);
      const suggestions = parsed.suggestions || [];
      
      if (suggestions.length === 0) {
        console.warn('⚠️ [Ollama] No suggestions returned');
      }
      
      // Clean up thinking text from person_description
      return suggestions.map((s: Suggestion) => ({
        ...s,
        person_description: s.person_description 
          ? enforceWordLimit(cleanLLMThinking(s.person_description), 15)
          : s.person_description,
        notes: s.notes 
          ? cleanLLMThinking(s.notes)
          : s.notes
      }));
    } catch (e) {
      console.error("❌ [Ollama] Error:", e);
      if (e instanceof Error) {
        throw new Error(`Ollama failed: ${e.message}`);
      }
      throw new Error('Ollama request failed. Check console for details.');
    }
  }

  async generateSceneDescription(person: string, action: string, object: string): Promise<string> {
    const params: ScenePromptParams = {
      person: sanitizeForAIPrompt(person),
      action: sanitizeForAIPrompt(action),
      object: sanitizeForAIPrompt(object)
    };

    const prompt = getSceneDescriptionPrompt(params);
    const systemPrompt = 'You are an expert Memory Palace coach specializing in creating vivid, memorable scenes.';

    console.log('📤 [Ollama] Scene Prompt:\n', prompt);

    const responseText = await this.makeRequest(prompt, systemPrompt);
    return responseText.trim() || `${person} is ${action} with ${object}.`;
  }
}
