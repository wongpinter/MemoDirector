/**
 * Version Manager Service
 * Manages multiple PAO versions with LocalStorage-first strategy
 */

import { PAOVersion, PAOItem } from '../types';
import { getCurrentUserId } from './auth';
import { safeJsonParse } from '../utils';

const VERSIONS_KEY = 'pao_versions';
const ACTIVE_VERSION_KEY = 'pao_active_version';
const namespacedKey = (base: string) => `${base}_${getCurrentUserId()}`;

/**
 * Generate a unique ID for a version
 */
function generateVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate empty PAO items (00-99)
 */
function generateEmptyItems(): PAOItem[] {
  return Array.from({ length: 100 }, (_, i) => ({
    number: i,
    person: '',
    action: '',
    object: '',
    scene: '',
    completed: false,
    lastModified: Date.now()
  }));
}

/**
 * Load all versions from LocalStorage
 * Ensures isActive flags are synchronized with active version ID
 */
export function loadVersions(): PAOVersion[] {
  try {
    const key = namespacedKey(VERSIONS_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const versions = safeJsonParse<PAOVersion[]>(data, []);
      syncActiveFlags(versions);
      return versions;
    }

    const legacy = localStorage.getItem(VERSIONS_KEY);
    if (legacy) {
      const parsed = safeJsonParse<PAOVersion[]>(legacy, []);
      syncActiveFlags(parsed);
      localStorage.setItem(key, JSON.stringify(parsed));
      localStorage.removeItem(VERSIONS_KEY);
      return parsed;
    }

    return [];
  } catch (error) {
    console.error('Failed to load versions:', error);
    return [];
  }
}

/**
 * Synchronize isActive flags with the active version ID from localStorage
 * This ensures single source of truth (the localStorage ID)
 */
function syncActiveFlags(versions: PAOVersion[]): void {
  const activeId = getActiveVersionId();
  
  versions.forEach(v => {
    v.isActive = v.id === activeId;
  });
  
  // If no active ID but we have versions, set the first as active
  if (!activeId && versions.length > 0) {
    versions[0].isActive = true;
    setActiveVersionId(versions[0].id);
  }
}

/**
 * Save all versions to LocalStorage
 */
export function saveVersions(versions: PAOVersion[]): void {
  try {
    localStorage.setItem(namespacedKey(VERSIONS_KEY), JSON.stringify(versions));
  } catch (error) {
    console.error('Failed to save versions:', error);
    throw error;
  }
}

/**
 * Get the active version ID
 */
export function getActiveVersionId(): string | null {
  const key = namespacedKey(ACTIVE_VERSION_KEY);
  const value = localStorage.getItem(key);

  if (value) return value;

  const legacy = localStorage.getItem(ACTIVE_VERSION_KEY);
  if (legacy) {
    localStorage.setItem(key, legacy);
    localStorage.removeItem(ACTIVE_VERSION_KEY);
    return legacy;
  }

  return null;
}

/**
 * Set the active version ID
 */
export function setActiveVersionId(versionId: string): void {
  localStorage.setItem(namespacedKey(ACTIVE_VERSION_KEY), versionId);
}

/**
 * Get the active version
 * Uses localStorage ID as single source of truth
 */
export function getActiveVersion(): PAOVersion | null {
  const versions = loadVersions();
  const activeId = getActiveVersionId();

  if (!activeId) {
    // If no active ID, return the first version marked as active
    return versions.find(v => v.isActive) || null;
  }

  return versions.find(v => v.id === activeId) || null;
}

/**
 * Create a new version
 */
export function createVersion(name: string, description?: string, copyFromActive: boolean = false): PAOVersion {
  const versions = loadVersions();

  let items: PAOItem[];
  if (copyFromActive) {
    const activeVersion = getActiveVersion();
    items = activeVersion ? JSON.parse(JSON.stringify(activeVersion.items)) : generateEmptyItems();
  } else {
    items = generateEmptyItems();
  }

  const newVersion: PAOVersion = {
    id: generateVersionId(),
    name,
    description,
    createdAt: Date.now(),
    lastModified: Date.now(),
    isActive: versions.length === 0, // First version is active by default
    items
  };

  versions.push(newVersion);
  saveVersions(versions);

  if (newVersion.isActive) {
    setActiveVersionId(newVersion.id);
  }

  return newVersion;
}

/**
 * Update a version
 */
export function updateVersion(versionId: string, updates: Partial<Omit<PAOVersion, 'id' | 'createdAt'>>): PAOVersion | null {
  const versions = loadVersions();
  const index = versions.findIndex(v => v.id === versionId);

  if (index === -1) {
    return null;
  }

  versions[index] = {
    ...versions[index],
    ...updates,
    lastModified: Date.now()
  };

  saveVersions(versions);
  return versions[index];
}

/**
 * Delete a version
 */
export function deleteVersion(versionId: string): boolean {
  const versions = loadVersions();
  const index = versions.findIndex(v => v.id === versionId);

  if (index === -1) {
    return false;
  }

  const wasActive = versions[index].isActive;
  versions.splice(index, 1);

  // If deleted version was active, activate another one
  if (wasActive && versions.length > 0) {
    versions[0].isActive = true;
    setActiveVersionId(versions[0].id);
  } else if (versions.length === 0) {
    localStorage.removeItem(namespacedKey(ACTIVE_VERSION_KEY));
  }

  saveVersions(versions);
  return true;
}

/**
 * Switch active version
 */
export function switchActiveVersion(versionId: string): boolean {
  const versions = loadVersions();
  const targetVersion = versions.find(v => v.id === versionId);

  if (!targetVersion) {
    return false;
  }

  // Deactivate all versions
  versions.forEach(v => v.isActive = false);

  // Activate target version
  targetVersion.isActive = true;
  setActiveVersionId(versionId);

  saveVersions(versions);
  return true;
}

/**
 * Duplicate a version
 */
export function duplicateVersion(versionId: string, newName: string): PAOVersion | null {
  const versions = loadVersions();
  const sourceVersion = versions.find(v => v.id === versionId);

  if (!sourceVersion) {
    return null;
  }

  const newVersion: PAOVersion = {
    id: generateVersionId(),
    name: newName,
    description: sourceVersion.description,
    createdAt: Date.now(),
    lastModified: Date.now(),
    isActive: false,
    items: JSON.parse(JSON.stringify(sourceVersion.items))
  };

  versions.push(newVersion);
  saveVersions(versions);

  return newVersion;
}

/**
 * Create a default version from pulled data
 * Used when pulling data from server for the first time
 */
export function createDefaultVersion(items: PAOItem[]): PAOVersion {
  const versions = loadVersions();

  const defaultVersion: PAOVersion = {
    id: generateVersionId(),
    name: 'Default',
    description: 'Pulled from server',
    createdAt: Date.now(),
    lastModified: Date.now(),
    isActive: versions.length === 0, // Only active if no other versions exist
    items
  };

  versions.push(defaultVersion);
  saveVersions(versions);

  if (defaultVersion.isActive) {
    setActiveVersionId(defaultVersion.id);
  }

  return defaultVersion;
}

/**
 * Migrate existing PAO data to versioning system
 * This should be called once to migrate old data
 */
export function migrateToVersioning(existingItems: PAOItem[]): void {
  const versions = loadVersions();

  // Only migrate if no versions exist
  if (versions.length === 0) {
    const defaultVersion: PAOVersion = {
      id: generateVersionId(),
      name: 'Default',
      description: 'Original PAO system',
      createdAt: Date.now(),
      lastModified: Date.now(),
      isActive: true,
      items: existingItems
    };

    saveVersions([defaultVersion]);
    setActiveVersionId(defaultVersion.id);
    console.log('✅ Migrated existing PAO data to versioning system');
  }
}
