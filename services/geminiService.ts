import { GoogleGenAI } from "@google/genai";
import { Suggestion, SUGGESTION_SCHEMA } from "../types";
import { getPhoneticsForNumber } from "../constants";
import { sanitizeForAIPrompt } from "../utils/validation";
import { ILLMProvider } from "./llmTypes";
import {
  getPAOStrictPersonPrompt,
  getPAOPersonPrompt,
  getPAOThemePrompt,
  getSceneDescriptionPrompt,
  getImageGenerationPrompt,
  PAOPromptParams,
  ScenePromptParams
} from "./prompts";
import { withTimeout, DEFAULT_LLM_TIMEOUT, IMAGE_GENERATION_TIMEOUT, VIDEO_GENERATION_TIMEOUT, cleanLLMThinking, enforceWordLimit } from "./llmUtils";

/**
 * Gemini LLM Provider Implementation
 */
class GeminiProvider implements ILLMProvider {
  private ai: GoogleGenAI | null;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.model = model || 'gemini-2.5-flash';
    if (!apiKey) {
      this.ai = null;
    } else {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private ensureAI(): GoogleGenAI {
    if (!this.ai) {
      throw new Error("Gemini API Key is missing. Please check your environment variables.");
    }
    return this.ai;
  }

  async generatePAOSuggestions(
    number: number,
    theme: string,
    specificPerson?: string,
    strictMode: boolean = false,
    excludePersons?: string[]
  ): Promise<Suggestion[]> {
    const ai = this.ensureAI();

    // Sanitize inputs
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

    console.log('📤 [Gemini] PAO Prompt:\n', prompt);

    const response = await withTimeout(
      ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SUGGESTION_SCHEMA
        }
      }),
      DEFAULT_LLM_TIMEOUT,
      'Gemini API request timed out. Please try again.'
    );

    if (!response.text) {
      console.error('❌ [Gemini] Empty response');
      throw new Error('Gemini returned empty response');
    }

    console.log('📥 [Gemini] Raw Response:', response.text.substring(0, 500));

    try {
      const parsed = JSON.parse(response.text);
      const suggestions = parsed.suggestions || [];
      
      if (suggestions.length === 0) {
        console.warn('⚠️ [Gemini] No suggestions returned');
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
      console.error("❌ [Gemini] JSON Parse error:", e);
      console.error("❌ [Gemini] Response text:", response.text);
      throw new Error(`Gemini returned invalid JSON: ${e instanceof Error ? e.message : 'Parse failed'}`);
    }
  }

  async generateSceneDescription(person: string, action: string, object: string, theme?: string, personDescription?: string): Promise<string> {
    const ai = this.ensureAI();

    // Sanitize inputs
    const params: ScenePromptParams = {
      person: sanitizeForAIPrompt(person),
      action: sanitizeForAIPrompt(action),
      object: sanitizeForAIPrompt(object),
      theme: theme ? sanitizeForAIPrompt(theme) : undefined,
      personDescription: personDescription ? sanitizeForAIPrompt(personDescription) : undefined
    };

    const prompt = getSceneDescriptionPrompt(params);

    console.log('📤 [Gemini] Scene Prompt:\n', prompt);

    const response = await withTimeout(
      ai.models.generateContent({
        model: this.model,
        contents: prompt
      }),
      DEFAULT_LLM_TIMEOUT,
      'Gemini scene generation timed out. Please try again.'
    );

    return response.text?.trim() || `${person} is ${action} with ${object}.`;
  }

  async generateMemoryImage(sceneDescription: string): Promise<string> {
    const ai = this.ensureAI();

    const sanitizedScene = sanitizeForAIPrompt(sceneDescription);
    const prompt = getImageGenerationPrompt(sanitizedScene);

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      }),
      IMAGE_GENERATION_TIMEOUT,
      'Image generation timed out. Please try again.'
    );

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (textPart) {
      console.warn("Image Generation - Text returned:", textPart);
      throw new Error(`Model refused to generate image: ${textPart}`);
    }

    console.warn("Generative Error: Model response did not contain inline image data.", response);
    throw new Error("No image data generated. The model may have filtered the request due to safety settings.");
  }

  async generateMemoryVideo(sceneDescription: string): Promise<{blob: Blob, mimeType: string}> {
    const ai = this.ensureAI();
    const sanitizedScene = sanitizeForAIPrompt(sceneDescription);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: sanitizedScene,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const response = await fetch(`${videoUri}&key=${apiKey}`);
    if (!response.ok) throw new Error("Failed to download video");

    const blob = await response.blob();
    return { blob, mimeType: 'video/mp4' };
  }
}

// Legacy exports for backward compatibility
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export const getPAOSuggestions = async (
  number: number,
  theme: string,
  specificPerson?: string,
  strictMode: boolean = false
): Promise<Suggestion[]> => {
  const provider = new GeminiProvider(import.meta.env.VITE_GEMINI_API_KEY);
  return provider.generatePAOSuggestions(number, theme, specificPerson, strictMode);
};

export const getSceneDescription = async (person: string, action: string, object: string): Promise<string> => {
  const provider = new GeminiProvider(import.meta.env.VITE_GEMINI_API_KEY);
  return provider.generateSceneDescription(person, action, object);
};

export const generateMemoryImage = async (sceneDescription: string): Promise<string> => {
  const provider = new GeminiProvider(import.meta.env.VITE_GEMINI_API_KEY);
  return provider.generateMemoryImage(sceneDescription);
};

export const generateMemoryVideo = async (sceneDescription: string): Promise<{blob: Blob, mimeType: string}> => {
  const provider = new GeminiProvider(import.meta.env.VITE_GEMINI_API_KEY);
  return provider.generateMemoryVideo(sceneDescription);
};

export { GeminiProvider };