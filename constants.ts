import { MAJOR_SYSTEM } from "./types.ts";

export const TOTAL_NUMBERS = 100; // 00 to 99

// Helper to get sounds description for a number (0-99)
export const getPhoneticsForNumber = (num: number): string => {
  const str = num.toString().padStart(2, '0');
  const d1 = parseInt(str[0]);
  const d2 = parseInt(str[1]);

  const s1 = MAJOR_SYSTEM.find(r => r.digit === d1)?.sounds.join('/') || '';
  const s2 = MAJOR_SYSTEM.find(r => r.digit === d2)?.sounds.join('/') || '';

  return `${d1} (${s1}) + ${d2} (${s2})`;
};

export const DEFAULT_THEMES = [
  "General / Famous People",
  "Marvel Universe",
  "DC Universe",
  "Star Wars",
  "Harry Potter",
  "Lord of the Rings",
  "Disney / Pixar",
  "Greek Mythology",
  "Video Games (Nintendo, Sony, etc)",
  "Anime",
  "Historical Figures"
];

// UI Constants
export const UI_CONSTANTS = {
  CHAR_LIMIT: 280,
  DEBOUNCE_DELAY: 1000,
  TOAST_DURATION: 3000,
  TOOLTIP_OFFSET: 250,
  MAX_IMAGE_SIZE: 200 * 1024, // 200KB
  GRID_PREVIEW_LINES: 2,
  SAVE_STATUS_DISPLAY_DURATION: 2000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  PAO_DATA: 'mindpalace_pao_data',
  CUSTOM_THEMES: 'mindpalace_custom_themes',
  USER_PREFERENCES: 'mindpalace_preferences',
  SYNC_ENABLED: 'mindpalace_sync_enabled',
} as const;

// API Limits (for future backend implementation)
export const API_LIMITS = {
  REQUESTS_PER_MINUTE: 10,
  MAX_PROMPT_LENGTH: 2000,
  MAX_SCENE_LENGTH: 280,
} as const;

// --- Reverse Lookup Logic ---

export interface MajorResult {
  number: number;
  method: 'Initials' | 'Phonetic';
  explanation: string;
}

// Helper to process a string and return all found sounds in order
const getMajorSounds = (text: string): { val: number, char: string }[] => {
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  const sounds: { val: number, char: string }[] = [];
  let i = 0;

  while (i < clean.length) {
    const c = clean[i];
    const next = clean[i + 1] || '';

    let digit = -1;
    let consumed = 1;

    // Check specific combinations first
    if (c === 'p' && next === 'h') { digit = 8; consumed = 2; } // Phone
    else if (c === 's' && next === 'h') { digit = 6; consumed = 2; } // Shoe
    else if (c === 'c' && next === 'h') { digit = 6; consumed = 2; } // Cheese
    else if (c === 't' && next === 'h') { digit = 1; consumed = 2; } // The
    else if (c === 'n' && next === 'g') { digit = 2; consumed = 2; } // Ring
    else if (c === 'c') {
      if (['e', 'i', 'y'].includes(next)) digit = 0; // Ceiling
      else digit = 7; // Cat
    }
    else if (c === 'g') {
      if (['e', 'i', 'y'].includes(next)) digit = 6; // Gem
      else digit = 7; // Game
    }
    else if (c === 'x') {
      // X is K(7)S(0). 
      if (i === 0) digit = 0; // Start of word (Xylophone)
      else {
        // Push 7 (K) now, let the logic below push 0 (S)
        sounds.push({ val: 7, char: 'x(k)' });
        digit = 0;
      }
    }
    // Standard Mapping
    else if (['s', 'z'].includes(c)) digit = 0;
    else if (['t', 'd'].includes(c)) digit = 1;
    else if (['n'].includes(c)) digit = 2;
    else if (['m'].includes(c)) digit = 3;
    else if (['r'].includes(c)) digit = 4;
    else if (['l'].includes(c)) digit = 5;
    else if (['j'].includes(c)) digit = 6;
    else if (['k', 'q'].includes(c)) digit = 7;
    else if (['f', 'v'].includes(c)) digit = 8;
    else if (['p', 'b'].includes(c)) digit = 9;

    if (digit !== -1) {
      // Double letter check (skip consecutive same chars unless it's a special combo case)
      const isDouble = (i > 0 && clean[i - 1] === c && consumed === 1 && !['a', 'e', 'i', 'o', 'u'].includes(c));

      if (!isDouble) {
        // For X, if we are here, we are pushing the 'S'(0) part.
        const charLabel = (c === 'x' && digit === 0) ? 'x(s)' : clean.substring(i, i + consumed);
        sounds.push({ val: digit, char: charLabel });
      }
    }

    i += consumed;
  }
  return sounds;
}

export const calculateMajorNumber = (text: string): MajorResult[] => {
  const results: MajorResult[] = [];
  if (!text) return [];

  // 1. Initials Strategy (First sound of Word 1 + First sound of Word 2)
  // Useful for "Tony Stark" -> T, S -> 10
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    const s1 = getMajorSounds(words[0])[0];
    const s2 = getMajorSounds(words[1])[0];

    if (s1 && s2) {
      const num = parseInt(`${s1.val}${s2.val}`);
      results.push({
        number: num,
        method: 'Initials',
        explanation: `Initials: ${s1.char.toUpperCase()}(${s1.val}) + ${s2.char.toUpperCase()}(${s2.val})`
      });
    }
  }

  // 2. Full Phonetic Stream (Sequential sounds)
  // Useful for "Sun Wukong" -> S, N -> 02
  const allSounds = getMajorSounds(text);
  if (allSounds.length >= 2) {
    const s1 = allSounds[0];
    const s2 = allSounds[1];
    const num = parseInt(`${s1.val}${s2.val}`);

    // Only add if it's a different number than the Initials strategy to avoid duplicates
    // If numbers are same, we implicitly prefer displaying it once, 
    // but the explanation for 'Initials' is usually more intuitive for 2-word names if it matches.
    const existing = results.find(r => r.number === num);
    if (!existing) {
      results.push({
        number: num,
        method: 'Phonetic',
        explanation: `Phonetic: ${s1.char.toUpperCase()}(${s1.val}) + ${s2.char.toUpperCase()}(${s2.val})`
      });
    }
  }

  // 3. Fallback: Single Digit (Partial match)
  // Only if we found nothing else
  if (results.length === 0 && allSounds.length === 1) {
    results.push({
      number: allSounds[0].val,
      method: 'Phonetic',
      explanation: `Partial: ${allSounds[0].char.toUpperCase()}(${allSounds[0].val}). Need 2 sounds.`
    });
  }

  return results;
};