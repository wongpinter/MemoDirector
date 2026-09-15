import { describe, it, expect } from 'vitest';
import { calculateMajorNumber, getPhoneticsForNumber } from '../constants';
import { detectConflicts, hasConflicts, getConflictSummary } from '../utils/conflictDetection';
import { validatePAONumber, sanitizeForAIPrompt, validatePAOField, validateTheme } from '../utils/validation';
import { safeJsonParse } from '../utils/jsonParse';
import { PAOItem } from '../types';

describe('Major System Logic', () => {
  it('encodes initials for multi-word names', () => {
    const results = calculateMajorNumber('Tony Stark');
    const initialsMatch = results.find(r => r.method === 'Initials');
    expect(initialsMatch).toBeDefined();
    expect(initialsMatch?.number).toBe(10); // T=1, S=0
  });

  it('encodes sequential phonetics for single names', () => {
    const results = calculateMajorNumber('Sun');
    expect(results.length).toBeGreaterThan(0);
    // S=0, N=2 -> 02 -> number is 2
    expect(results[0].number).toBe(2);
  });

  it('handles empty input gracefully', () => {
    expect(calculateMajorNumber('')).toEqual([]);
  });

  it('formats phonetics for numbers 00-99', () => {
    const phonetics00 = getPhoneticsForNumber(0);
    expect(phonetics00).toContain('0 (s/z/soft c)');
    const phonetics14 = getPhoneticsForNumber(14);
    expect(phonetics14).toContain('1 (t/d/th)');
    expect(phonetics14).toContain('4 (r)');
  });
});

describe('Conflict Detection', () => {
  it('detects duplicated person, action, and object across different cards', () => {
    const items: PAOItem[] = [
      { number: 1, person: 'Batman', action: 'Punching', object: 'Batarang', completed: true },
      { number: 2, person: 'Batman', action: 'Flying', object: 'Batmobile', completed: true },
      { number: 3, person: 'Robin', action: 'Punching', object: 'Staff', completed: true },
      { number: 4, person: 'Joker', action: 'Laughing', object: 'Batarang', completed: true },
    ];

    const conflicts = detectConflicts(items);
    expect(hasConflicts(1, conflicts)).toBe(true);

    const num1 = conflicts.get(1);
    expect(num1).toBeDefined();
    expect(num1?.person?.numbers).toEqual([2]);
    expect(num1?.action?.numbers).toEqual([3]);
    expect(num1?.object?.numbers).toEqual([4]);

    const summary = getConflictSummary(num1!);
    expect(summary).toContain('Person');
    expect(summary).toContain('Action');
    expect(summary).toContain('Object');
  });

  it('returns false for conflict-free items', () => {
    const items: PAOItem[] = [
      { number: 1, person: 'Batman', action: 'Punching', object: 'Batarang', completed: true },
      { number: 2, person: 'Superman', action: 'Flying', object: 'Cape', completed: true },
    ];

    const conflicts = detectConflicts(items);
    expect(hasConflicts(1, conflicts)).toBe(false);
  });
});

describe('Validation & Sanitization', () => {
  it('validates PAO number range (0-99 integers)', () => {
    expect(validatePAONumber(0)).toBe(true);
    expect(validatePAONumber(99)).toBe(true);
    expect(validatePAONumber(-1)).toBe(false);
    expect(validatePAONumber(100)).toBe(false);
    expect(validatePAONumber(3.14)).toBe(false);
  });

  it('sanitizes text for AI prompts by stripping control chars and brackets', () => {
    const dirty = '<script>test\x00</script>';
    expect(sanitizeForAIPrompt(dirty)).toBe('scripttest/script');
  });

  it('validates PAO field lengths', () => {
    const valid = validatePAOField('Valid action', 'Action');
    expect(valid.valid).toBe(true);
    expect(valid.sanitized).toBe('Valid action');

    const longText = 'a'.repeat(300);
    const invalid = validatePAOField(longText, 'Scene');
    expect(invalid.valid).toBe(false);
    expect(invalid.sanitized.length).toBe(280);
  });

  it('validates theme strings', () => {
    expect(validateTheme('   ').valid).toBe(false);
    expect(validateTheme('Sci-Fi Heroes').valid).toBe(true);
  });
});

describe('JSON Utilities', () => {
  it('parses valid JSON and returns fallback on invalid JSON', () => {
    expect(safeJsonParse('{"name":"Memo"}', { name: '' })).toEqual({ name: 'Memo' });
    expect(safeJsonParse('invalid-json', { fallback: 123 })).toEqual({ fallback: 123 });
  });
});
