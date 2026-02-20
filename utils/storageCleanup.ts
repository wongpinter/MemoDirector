/**
 * LocalStorage Cleanup Utilities
 * Manages cleanup of legacy and unused localStorage keys
 */

import { safeRemoveItem } from './localStorage';

/**
 * List of known legacy keys that may need cleanup
 */
const KNOWN_LEGACY_KEYS = [
  'pao_data',
  'pao_versions',
  'pao_active_version',
  'pao_sync_queue',
  'pao_last_sync',
  'firebase_auth_user', // Legacy Firebase keys (now using Supabase)
  'user_api_keys_legacy',
  'custom_themes_legacy',
] as const;

/**
 * Check for and report legacy keys in localStorage
 * @returns Array of legacy keys found
 */
export function findLegacyKeys(): string[] {
  const foundKeys: string[] = [];
  
  KNOWN_LEGACY_KEYS.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      foundKeys.push(key);
    }
  });
  
  return foundKeys;
}

/**
 * Clean up specific legacy keys
 * @param keys - Array of key names to remove
 * @returns Number of keys successfully removed
 */
export function cleanupLegacyKeys(keys: string[]): number {
  let removed = 0;
  
  keys.forEach(key => {
    const result = safeRemoveItem(key);
    if (result.success) {
      removed++;
      console.log(`🧹 Cleaned up legacy key: ${key}`);
    }
  });
  
  return removed;
}

/**
 * Clean up all known legacy keys
 * Should only be called after migration is complete
 * @returns Number of keys successfully removed
 */
export function cleanupAllLegacyKeys(): number {
  const legacyKeys = findLegacyKeys();
  
  if (legacyKeys.length === 0) {
    console.log('✅ No legacy keys found - storage is clean');
    return 0;
  }
  
  console.log(`🧹 Found ${legacyKeys.length} legacy keys to clean up`);
  return cleanupLegacyKeys(legacyKeys);
}

/**
 * Get localStorage usage report
 * Helps identify what's taking up space
 */
export function getStorageReport(): {
  totalKeys: number;
  legacyKeys: string[];
  topKeys: Array<{ key: string; size: number }>;
} {
  const legacyKeys = findLegacyKeys();
  const allKeys: Array<{ key: string; size: number }> = [];
  
  // Collect all keys and their sizes
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = value ? new Blob([value]).size : 0;
      allKeys.push({ key, size });
    }
  }
  
  // Sort by size descending
  const topKeys = allKeys
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
  
  return {
    totalKeys: localStorage.length,
    legacyKeys,
    topKeys
  };
}

/**
 * Check if cleanup is recommended
 * Returns true if there are legacy keys or storage is >80% full
 */
export function isCleanupRecommended(): boolean {
  const legacyKeys = findLegacyKeys();
  
  if (legacyKeys.length > 0) {
    return true;
  }
  
  // Check storage usage
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        totalSize += value ? new Blob([value]).size : 0;
      }
    }
    
    // Estimate quota (typically 5-10MB, using conservative 5MB)
    const estimatedQuota = 5 * 1024 * 1024;
    const percentage = (totalSize / estimatedQuota) * 100;
    
    return percentage > 80;
  } catch (error) {
    console.error('Failed to check storage usage:', error);
    return false;
  }
}
