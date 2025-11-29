import { Type } from "@google/genai";

export interface PAOItem {
  number: number;
  person: string;
  action: string;
  object: string;
  scene?: string;
  imageUrl?: string;
  videoUrl?: string;
  notes?: string;
  completed: boolean;
  lastModified?: number; // Timestamp for conflict resolution
}

export interface PAOVersion {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  isActive: boolean;
  items: PAOItem[];
}

export interface Suggestion {
  person: string;
  action: string;
  object: string;
  notes?: string;
  person_description?: string;
  reasoning?: string; // Legacy field, kept for backward compatibility
}

export interface MajorSystemRule {
  digit: number;
  sounds: string[];
  mnemonic: string;
  examples: string[];
}

export const MAJOR_SYSTEM: MajorSystemRule[] = [
  { digit: 0, sounds: ['s', 'z', 'soft c'], mnemonic: 'Zero starts with Z', examples: ['Saw', 'Zoo', 'Ice'] },
  { digit: 1, sounds: ['t', 'd', 'th'], mnemonic: 'T has 1 downstroke', examples: ['Tie', 'Tea', 'Hat'] },
  { digit: 2, sounds: ['n'], mnemonic: 'N has 2 downstrokes', examples: ['Noah', 'Knee', 'Hen'] },
  { digit: 3, sounds: ['m'], mnemonic: 'M has 3 downstrokes', examples: ['Ma', 'Ham', 'Home'] },
  { digit: 4, sounds: ['r'], mnemonic: 'Four ends with R', examples: ['Rye', 'Oar', 'Ray'] },
  { digit: 5, sounds: ['l'], mnemonic: 'L is Roman numeral for 50', examples: ['Law', 'Eel', 'Ale'] },
  { digit: 6, sounds: ['j', 'sh', 'ch', 'soft g'], mnemonic: 'J looks like 6', examples: ['Jaw', 'Shoe', 'Ash'] },
  { digit: 7, sounds: ['k', 'hard c', 'hard g', 'q'], mnemonic: 'K can be made of two 7s', examples: ['Key', 'Cow', 'Egg'] },
  { digit: 8, sounds: ['f', 'v'], mnemonic: 'Script f looks like 8', examples: ['Ivy', 'Fee', 'Hoof'] },
  { digit: 9, sounds: ['p', 'b'], mnemonic: 'P is 9 backwards', examples: ['Pie', 'Bee', 'Ape'] },
];

export const SUGGESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          person: { type: Type.STRING, description: "The character name." },
          action: { type: Type.STRING, description: "An action characteristic of the person." },
          object: { type: Type.STRING, description: "An object associated with the person." },
          notes: { type: Type.STRING, description: "Optional: explain how the name decodes to the number." },
          person_description: { type: Type.STRING, description: "Short description of who the person is." }
        },
        required: ["person", "action", "object"]
      }
    }
  }
};