/**
 * Safe JSON parsing utilities
 * Provides error-safe JSON.parse with fallback values
 */

/**
 * Safely parse JSON with error handling
 * @param jsonString - The JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely parse JSON with validation
 * @param jsonString - The JSON string to parse
 * @param validator - Function to validate the parsed object
 * @param fallback - Fallback value if parsing or validation fails
 * @returns Parsed and validated object or fallback value
 */
export function safeJsonParseWithValidation<T>(
  jsonString: string | null | undefined,
  validator: (value: unknown) => value is T,
  fallback: T
): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (validator(parsed)) {
      return parsed;
    }
    console.error('JSON validation failed');
    return fallback;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}
