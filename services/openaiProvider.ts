/**
 * OpenAI LLM Provider Implementation
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

export class OpenAIProvider implements ILLMProvider {
  protected apiKey: string;
  protected model: string;
  protected baseUrl: string;

  constructor(apiKey: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  protected async makeRequest(messages: Array<{ role: string, content: string }>, jsonMode: boolean = false): Promise<string> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          ...(jsonMode && { response_format: { type: 'json_object' } })
        })
      },
      DEFAULT_LLM_TIMEOUT
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
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

    const messages = [
      {
        role: 'system',
        content: 'You are an expert in the Major System mnemonic technique. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('📤 [OpenAI] PAO Prompt:\n', prompt);

    try {
      const responseText = await this.makeRequest(messages, true);
      console.log('📥 [OpenAI] Raw Response:', responseText.substring(0, 500));

      const parsed = JSON.parse(responseText);
      const suggestions = parsed.suggestions || [];

      if (suggestions.length === 0) {
        console.warn('⚠️ [OpenAI] No suggestions returned');
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
      console.error("❌ [OpenAI] Error:", e);
      if (e instanceof Error) {
        throw new Error(`OpenAI failed: ${e.message}`);
      }
      throw new Error('OpenAI request failed. Check console for details.');
    }
  }

  async generateSceneDescription(person: string, action: string, object: string, theme?: string, personDescription?: string): Promise<string> {
    const params: ScenePromptParams = {
      person: sanitizeForAIPrompt(person),
      action: sanitizeForAIPrompt(action),
      object: sanitizeForAIPrompt(object),
      theme: theme ? sanitizeForAIPrompt(theme) : undefined,
      personDescription: personDescription ? sanitizeForAIPrompt(personDescription) : undefined
    };

    const prompt = getSceneDescriptionPrompt(params);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert Memory Palace coach specializing in creating vivid, memorable scenes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('📤 [OpenAI] Scene Prompt:\n', prompt);

    const responseText = await this.makeRequest(messages);
    return responseText.trim() || `${person} is ${action} with ${object}.`;
  }
}
