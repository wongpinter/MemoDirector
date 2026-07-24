/**
 * Types and interfaces for LLM providers.
 * Config types live in llmConfig.ts.
 */

import { Suggestion } from '../types';

export interface LLMResponse {
  text: string;
  suggestions?: Suggestion[];
}

export interface ILLMProvider {
  generatePAOSuggestions(
    number: number,
    theme: string,
    specificPerson?: string,
    strictMode?: boolean,
    excludePersons?: string[],
  ): Promise<Suggestion[]>;

  generateSceneDescription(
    person: string,
    action: string,
    object: string,
    theme?: string,
    personDescription?: string,
  ): Promise<string>;

  generateMemoryImage?(sceneDescription: string): Promise<string>;

  generateMemoryVideo?(sceneDescription: string): Promise<{ blob: Blob; mimeType: string }>;
}
