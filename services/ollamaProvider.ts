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

export class OllamaProvider implements ILLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.model = model || 'llama3.2';
  }

  private async makeRequest(prompt: string, systemPrompt?: string, jsonMode: boolean = false): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
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
    });

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
    strictMode: boolean = false
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
      strictMode
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
    const responseText = await this.makeRequest(prompt, systemPrompt, true);

    try {
      const parsed = JSON.parse(responseText);
      return parsed.suggestions || [];
    } catch (e) {
      console.error("JSON Parse error", e);
      return [];
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

    const responseText = await this.makeRequest(prompt, systemPrompt);
    return responseText.trim() || `${person} is ${action} with ${object}.`;
  }
}
