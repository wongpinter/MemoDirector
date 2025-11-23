import { API_LIMITS } from '../constants';

/**
 * Validates and sanitizes user input for PAO fields
 */
export function validatePAOField(value: string, fieldName: string): { valid: boolean; error?: string; sanitized: string } {
  // Remove leading/trailing whitespace
  const trimmed = value.trim();
  
  // Check max length
  if (trimmed.length > API_LIMITS.MAX_SCENE_LENGTH) {
    return {
      valid: false,
      error: `${fieldName} must be ${API_LIMITS.MAX_SCENE_LENGTH} characters or less`,
      sanitized: trimmed.substring(0, API_LIMITS.MAX_SCENE_LENGTH)
    };
  }
  
  // Basic sanitization - remove control characters
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F]/g, '');
  
  return {
    valid: true,
    sanitized
  };
}

/**
 * Validates theme input
 */
export function validateTheme(theme: string): { valid: boolean; error?: string; sanitized: string } {
  const trimmed = theme.trim();
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Theme cannot be empty',
      sanitized: ''
    };
  }
  
  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Theme must be 100 characters or less',
      sanitized: trimmed.substring(0, 100)
    };
  }
  
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F]/g, '');
  
  return {
    valid: true,
    sanitized
  };
}

/**
 * Sanitizes text for AI prompts to prevent injection
 */
export function sanitizeForAIPrompt(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, API_LIMITS.MAX_PROMPT_LENGTH);
}

/**
 * Validates number is within PAO range (0-99)
 */
export function validatePAONumber(num: number): boolean {
  return Number.isInteger(num) && num >= 0 && num <= 99;
}
