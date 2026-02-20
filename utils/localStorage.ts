/**
 * Safe LocalStorage utilities with quota management
 */

export interface StorageResult {
  success: boolean;
  error?: string;
  quotaExceeded?: boolean;
}

/**
 * Safely set an item in localStorage with quota error handling
 */
export function safeSetItem(key: string, value: string): StorageResult {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof DOMException) {
      // QuotaExceededError
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('❌ LocalStorage quota exceeded');
        return {
          success: false,
          error: 'Storage quota exceeded. Please free up space by removing old data.',
          quotaExceeded: true
        };
      }
      // SecurityError (e.g., in private browsing mode)
      if (e.name === 'SecurityError') {
        console.error('❌ LocalStorage access denied');
        return {
          success: false,
          error: 'Storage access denied. Please check browser settings.'
        };
      }
    }
    
    console.error('❌ Failed to save to localStorage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown storage error'
    };
  }
}

/**
 * Safely get an item from localStorage
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error('❌ Failed to read from localStorage:', e);
    return null;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function safeRemoveItem(key: string): StorageResult {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (e) {
    console.error('❌ Failed to remove from localStorage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown storage error'
    };
  }
}

/**
 * Get estimated localStorage usage
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0;
  
  try {
    // Calculate approximate size of all localStorage data
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character is typically 2 bytes in UTF-16
          used += (key.length + value.length) * 2;
        }
      }
    }
  } catch (e) {
    console.error('Failed to calculate storage usage:', e);
  }
  
  // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
  const total = 5 * 1024 * 1024; // 5MB in bytes
  const percentage = Math.round((used / total) * 100);
  
  return { used, total, percentage };
}

/**
 * Check if localStorage has enough space for data
 */
export function hasStorageSpace(estimatedSize: number): boolean {
  const { used, total } = getStorageUsage();
  return (used + estimatedSize) < (total * 0.9); // Keep 10% buffer
}

/**
 * Clear old or non-essential localStorage data to free up space
 */
export function cleanupStorage(keysToPreserve: string[] = []): StorageResult {
  try {
    const keysToRemove: string[] = [];
    
    // Identify keys that can be removed (not in preserve list)
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        if (!keysToPreserve.includes(key)) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleaned up ${keysToRemove.length} localStorage items`);
    
    return {
      success: true,
      error: `Cleaned up ${keysToRemove.length} items`
    };
  } catch (e) {
    console.error('❌ Failed to cleanup storage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown cleanup error'
    };
  }
}

/**
 * Compress large strings before storing (simple implementation)
 * For production, consider using a proper compression library like lz-string
 */
export function compressData(data: string): string {
  // Simple implementation - just return as is
  // In production, use: import LZString from 'lz-string'; return LZString.compress(data);
  return data;
}

/**
 * Decompress stored data
 */
export function decompressData(data: string): string {
  // Simple implementation - just return as is
  // In production, use: import LZString from 'lz-string'; return LZString.decompress(data);
  return data;
}
