/**
 * Type declarations for window extensions and third-party libraries
 */

declare global {
  interface Window {
    /**
     * Google AI Studio API key selection interface
     */
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export {};
