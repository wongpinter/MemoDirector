/**
 * Conflict Detection Utility
 * Detects when PAO elements are reused across different numbers
 */

import { PAOItem } from '../types';

export interface Conflict {
  type: 'person' | 'action' | 'object';
  value: string;
  numbers: number[];
}

export interface ItemConflicts {
  person?: Conflict;
  action?: Conflict;
  object?: Conflict;
}

/**
 * Detect all conflicts in the PAO system
 */
export const detectConflicts = (items: PAOItem[]): Map<number, ItemConflicts> => {
  const conflictMap = new Map<number, ItemConflicts>();
  
  // Build indexes for each type
  const personIndex = new Map<string, number[]>();
  const actionIndex = new Map<string, number[]>();
  const objectIndex = new Map<string, number[]>();
  
  // Index all items
  items.forEach(item => {
    if (item.person) {
      const normalized = item.person.toLowerCase().trim();
      if (!personIndex.has(normalized)) {
        personIndex.set(normalized, []);
      }
      const personList = personIndex.get(normalized);
      if (personList) {
        personList.push(item.number);
      }
    }
    
    if (item.action) {
      const normalized = item.action.toLowerCase().trim();
      if (!actionIndex.has(normalized)) {
        actionIndex.set(normalized, []);
      }
      const actionList = actionIndex.get(normalized);
      if (actionList) {
        actionList.push(item.number);
      }
    }
    
    if (item.object) {
      const normalized = item.object.toLowerCase().trim();
      if (!objectIndex.has(normalized)) {
        objectIndex.set(normalized, []);
      }
      const objectList = objectIndex.get(normalized);
      if (objectList) {
        objectList.push(item.number);
      }
    }
  });
  
  // Find conflicts (values used in multiple numbers)
  items.forEach(item => {
    const conflicts: ItemConflicts = {};
    
    if (item.person) {
      const normalized = item.person.toLowerCase().trim();
      const numbers = personIndex.get(normalized) || [];
      if (numbers.length > 1) {
        conflicts.person = {
          type: 'person',
          value: item.person,
          numbers: numbers.filter(n => n !== item.number)
        };
      }
    }
    
    if (item.action) {
      const normalized = item.action.toLowerCase().trim();
      const numbers = actionIndex.get(normalized) || [];
      if (numbers.length > 1) {
        conflicts.action = {
          type: 'action',
          value: item.action,
          numbers: numbers.filter(n => n !== item.number)
        };
      }
    }
    
    if (item.object) {
      const normalized = item.object.toLowerCase().trim();
      const numbers = objectIndex.get(normalized) || [];
      if (numbers.length > 1) {
        conflicts.object = {
          type: 'object',
          value: item.object,
          numbers: numbers.filter(n => n !== item.number)
        };
      }
    }
    
    if (Object.keys(conflicts).length > 0) {
      conflictMap.set(item.number, conflicts);
    }
  });
  
  return conflictMap;
};

/**
 * Check if an item has any conflicts
 */
export const hasConflicts = (number: number, conflictMap: Map<number, ItemConflicts>): boolean => {
  return conflictMap.has(number);
};

/**
 * Get conflict summary for display
 */
export const getConflictSummary = (conflicts: ItemConflicts): string => {
  const parts: string[] = [];
  
  if (conflicts.person) {
    parts.push(`Person "${conflicts.person.value}" also used in ${conflicts.person.numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
  }
  
  if (conflicts.action) {
    parts.push(`Action "${conflicts.action.value}" also used in ${conflicts.action.numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
  }
  
  if (conflicts.object) {
    parts.push(`Object "${conflicts.object.value}" also used in ${conflicts.object.numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
  }
  
  return parts.join(' • ');
};
