/**
 * API Error Categorization Utilities
 * Helps distinguish between different types of errors for better user feedback
 */

export enum ErrorCategory {
  NETWORK = 'network',
  SERVER = 'server',
  AUTH = 'auth',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export interface CategorizedError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  originalError?: unknown;
}

/**
 * Categorize a Supabase error
 */
export function categorizeSupabaseError(error: any): CategorizedError {
  const code = error?.code;
  const message = error?.message || 'Unknown error';

  // No data found (PGRST116)
  if (code === 'PGRST116') {
    return {
      category: ErrorCategory.NOT_FOUND,
      message,
      userMessage: 'No data found. This is your first time syncing.',
      shouldRetry: false,
      originalError: error
    };
  }

  // Authentication errors
  if (code === 'PGRST301' || code === 'PGRST302' || message.includes('JWT')) {
    return {
      category: ErrorCategory.AUTH,
      message,
      userMessage: 'Authentication failed. Please sign in again.',
      shouldRetry: false,
      originalError: error
    };
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
    return {
      category: ErrorCategory.NETWORK,
      message,
      userMessage: 'Network error. Please check your connection and try again.',
      shouldRetry: true,
      originalError: error
    };
  }

  // Server errors (5xx)
  if (code && code.toString().startsWith('5')) {
    return {
      category: ErrorCategory.SERVER,
      message,
      userMessage: 'Server error. Please try again later.',
      shouldRetry: true,
      originalError: error
    };
  }

  // Rate limiting
  if (code === '429' || message.includes('rate limit')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      message,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      shouldRetry: true,
      originalError: error
    };
  }

  // Validation errors
  if (code === 'PGRST204' || message.includes('validation')) {
    return {
      category: ErrorCategory.VALIDATION,
      message,
      userMessage: 'Invalid data. Please check your input.',
      shouldRetry: false,
      originalError: error
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    message,
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    shouldRetry: false,
    originalError: error
  };
}

/**
 * Categorize an LLM provider error
 */
export function categorizeLLMError(error: any, provider: string): CategorizedError {
  const message = error?.message || error?.toString() || 'Unknown error';

  // Network/timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED')) {
    return {
      category: ErrorCategory.NETWORK,
      message,
      userMessage: `Connection to ${provider} timed out. Please check your connection and try again.`,
      shouldRetry: true,
      originalError: error
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('API key')) {
    return {
      category: ErrorCategory.AUTH,
      message,
      userMessage: `Invalid ${provider} API key. Please check your API key in settings.`,
      shouldRetry: false,
      originalError: error
    };
  }

  // Rate limiting
  if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      message,
      userMessage: `${provider} rate limit exceeded. Please wait a moment and try again.`,
      shouldRetry: true,
      originalError: error
    };
  }

  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return {
      category: ErrorCategory.SERVER,
      message,
      userMessage: `${provider} server error. Please try again later.`,
      shouldRetry: true,
      originalError: error
    };
  }

  // Validation errors
  if (message.includes('400') || message.includes('invalid')) {
    return {
      category: ErrorCategory.VALIDATION,
      message,
      userMessage: 'Invalid request. Please try a different prompt.',
      shouldRetry: false,
      originalError: error
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    message,
    userMessage: `${provider} error: ${message}. Please try again.`,
    shouldRetry: false,
    originalError: error
  };
}

/**
 * Get a user-friendly error message
 */
export function getUserErrorMessage(error: unknown, context: 'supabase' | 'llm' = 'supabase', provider?: string): string {
  if (context === 'supabase') {
    return categorizeSupabaseError(error).userMessage;
  } else {
    return categorizeLLMError(error, provider || 'AI provider').userMessage;
  }
}
