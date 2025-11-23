/**
 * OpenRouter LLM Provider Implementation
 * OpenRouter uses OpenAI-compatible API, so we extend OpenAIProvider
 */

import { OpenAIProvider } from "./openaiProvider";

export class OpenRouterProvider extends OpenAIProvider {
  constructor(apiKey: string, model?: string) {
    // OpenRouter uses a different base URL but same API format
    super(apiKey, model || 'anthropic/claude-3.5-sonnet', 'https://openrouter.ai/api/v1');
  }

  protected async makeRequest(messages: Array<{role: string, content: string}>, jsonMode: boolean = false): Promise<string> {
    const response = await fetch(`${(this as any).baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(this as any).apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MemoDirector'
      },
      body: JSON.stringify({
        model: (this as any).model,
        messages,
        ...(jsonMode && { response_format: { type: 'json_object' } })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
