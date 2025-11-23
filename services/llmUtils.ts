/**
 * Utility functions for LLM operations
 */

/**
 * Default timeout for LLM requests (30 seconds)
 */
export const DEFAULT_LLM_TIMEOUT = 30000;

/**
 * Timeout for image generation (60 seconds)
 */
export const IMAGE_GENERATION_TIMEOUT = 60000;

/**
 * Timeout for video generation (120 seconds)
 */
export const VIDEO_GENERATION_TIMEOUT = 120000;

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Request timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Wraps a fetch request with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_LLM_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
}

/**
 * Clean up LLM thinking/reasoning text from responses
 * Removes common thinking patterns that leak into output
 */
export function cleanLLMThinking(text: string): string {
  if (!text) return text;

  // Remove thinking patterns
  const thinkingPatterns = [
    /\(.*?words.*?\)/gi,                    // (6 words), (7 words - ok!)
    /\bOk,?\s+that'?s?\s+\d+\s+words\.?/gi, // Ok, that's 6 words
    /\bWait,?\s+I\s+need\s+to\s+.+?\./gi,   // Wait, I need to check...
    /\bLet\s+me\s+.+?\./gi,                 // Let me rephrase...
    /\bI'?ll\s+.+?\./gi,                    // I'll stick to that
    /\bMy\s+bad,?\s+.+?\./gi,               // My bad, I'll count...
    /\bOh,?\s+the\s+previous\s+one\s+.+?\./gi, // Oh, the previous one was...
    /\bStill\s+OK!?\s*/gi,                  // Still OK!
    /\bOkay,?\s+I'?ll\s+.+?\./gi,          // Okay, I'll stick to that
    /\bI'?m\s+overthinking\s+this\.?/gi,   // I'm overthinking this
    /\bNo!\s+\d+\s+words\.?/gi,            // No! 7 words
  ];

  let cleaned = text;
  
  // Apply all patterns
  for (const pattern of thinkingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up extra whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove leading/trailing punctuation artifacts
  cleaned = cleaned.replace(/^[,.\s]+|[,.\s]+$/g, '');

  return cleaned;
}

/**
 * Enforce word limit on text
 */
export function enforceWordLimit(text: string, maxWords: number): string {
  if (!text) return text;
  
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  return words.slice(0, maxWords).join(' ');
}
