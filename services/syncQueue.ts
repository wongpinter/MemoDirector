/**
 * Sync Queue Service
 * Manages LocalStorage-first saves with periodic Remote (Supabase) sync
 * Updated to support version management
 */

import { PAOItem } from '../types';
import {
  savePAOList as saveToRemote,
  loadPAOListFromRemote,
  syncVersionsToRemote,
  loadVersions as loadVersionsFromRemote,
  isRemoteReadyForSync
} from './db';
import { loadVersions, saveVersions, getActiveVersion, updateVersion } from './versionManager';
import { getCurrentUserId } from './auth';
import { safeSetItem, safeGetItem, safeRemoveItem, getStorageUsage, StorageResult, safeJsonParse } from '../utils';

const namespacedKey = (base: string) => `${base}_${getCurrentUserId()}`;
const SYNC_QUEUE_KEY_BASE = 'pao_sync_queue';
const LAST_SYNC_KEY_BASE = 'pao_last_sync';

// Sync lock to prevent race conditions
let isSyncing = false;
const LEGACY_KEYS = {
  data: 'pao_data',
  versions: 'pao_versions',
  activeVersion: 'pao_active_version',
  queue: 'pao_sync_queue',
  lastSync: 'pao_last_sync',
} as const;

const migrateLegacyDataIfNeeded = () => {
  const uid = getCurrentUserId();
  if (uid === 'anonymous') return;

  const pairs: Array<[string, string]> = [
    [LEGACY_KEYS.data, namespacedKey('pao_data')],
    [LEGACY_KEYS.versions, namespacedKey('pao_versions')],
    [LEGACY_KEYS.activeVersion, namespacedKey('pao_active_version')],
    [LEGACY_KEYS.queue, namespacedKey(SYNC_QUEUE_KEY_BASE)],
    [LEGACY_KEYS.lastSync, namespacedKey(LAST_SYNC_KEY_BASE)],
  ];

  pairs.forEach(([legacyKey, scopedKey]) => {
    const hasScoped = safeGetItem(scopedKey);
    const legacyValue = safeGetItem(legacyKey);

    if (!hasScoped && legacyValue) {
      safeSetItem(scopedKey, legacyValue);
      safeRemoveItem(legacyKey);
    }
  });
};

export interface SyncQueueItem {
  timestamp: number;
  items: PAOItem[];
}

/**
 * Save items to LocalStorage immediately (fast, offline-safe)
 * Now updates the active version with quota handling
 */
export function saveToLocalStorage(items: PAOItem[]): StorageResult {
  try {
    migrateLegacyDataIfNeeded();

    // Update active version with new items
    const activeVersion = getActiveVersion();
    if (activeVersion) {
      updateVersion(activeVersion.id, { items });
    }

    const dataKey = namespacedKey('pao_data');
    const dataStr = JSON.stringify(items);
    
    // Check storage usage before saving
    const { percentage } = getStorageUsage();
    if (percentage > 90) {
      console.warn('⚠️ LocalStorage usage at ${percentage}%');
    }
    
    const result = safeSetItem(dataKey, dataStr);
    if (!result.success) {
      console.error('❌ Failed to save to LocalStorage:', result.error);
      return result;
    }

    // Add to sync queue
    const queueItem: SyncQueueItem = {
      timestamp: Date.now(),
      items
    };
    const queueResult = safeSetItem(namespacedKey(SYNC_QUEUE_KEY_BASE), JSON.stringify(queueItem));
    if (!queueResult.success) {
      console.error('❌ Failed to save to sync queue:', queueResult.error);
      return queueResult;
    }

    console.log('✅ Saved to LocalStorage');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to save to LocalStorage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load items from LocalStorage
 * Now loads from active version
 */
export function loadFromLocalStorage(): PAOItem[] | null {
  try {
    migrateLegacyDataIfNeeded();
    const dataKey = namespacedKey('pao_data');

    // Try to load from active version first
    const activeVersion = getActiveVersion();
    if (activeVersion) {
      return activeVersion.items;
    }

    // Fallback to namespaced storage
    const data = safeGetItem(dataKey);
    if (data) {
      return safeJsonParse<PAOItem[]>(data, []);
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load from LocalStorage:', error);
    return null;
  }
}

/**
 * Check if there are pending changes to sync
 */
export function hasPendingSync(): boolean {
  migrateLegacyDataIfNeeded();
  const queueData = safeGetItem(namespacedKey(SYNC_QUEUE_KEY_BASE));
  return !!queueData;
}

/**
 * Get the last sync timestamp
 */
export function getLastSyncTime(): number | null {
  migrateLegacyDataIfNeeded();
  const lastSync = safeGetItem(namespacedKey(LAST_SYNC_KEY_BASE));
  return lastSync ? parseInt(lastSync, 10) : null;
}

/**
 * Merge items with conflict resolution based on lastModified timestamp
 */
function mergeItems(localItems: PAOItem[], remoteItems: PAOItem[]): PAOItem[] {
  const merged: PAOItem[] = [];

  for (let i = 0; i < Math.max(localItems.length, remoteItems.length); i++) {
    const local = localItems[i];
    const remote = remoteItems[i];

    if (!local && remote) {
      merged.push(remote);
    } else if (local && !remote) {
      merged.push(local);
    } else if (local && remote) {
      // Both exist - use the one with the latest timestamp
      const localTime = local.lastModified || 0;
      const remoteTime = remote.lastModified || 0;

      if (localTime > remoteTime) {
        merged.push(local);
        console.log(`🔄 Item ${local.number}: Using local (newer)`);
      } else if (remoteTime > localTime) {
        merged.push(remote);
        console.log(`🔄 Item ${remote.number}: Using remote (newer)`);
      } else {
        // Same timestamp or both missing - prefer local
        merged.push(local);
      }
    }
  }

  return merged;
}

/**
 * Sync queued items to Remote with conflict resolution
 * Now syncs all versions
 * Uses a lock to prevent race conditions from concurrent sync operations
 */
export async function syncToRemote(): Promise<{ success: boolean; error?: string; merged?: boolean }> {
  // Prevent concurrent sync operations
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return { success: false, error: 'Sync already in progress' };
  }

  isSyncing = true;
  
  try {
    migrateLegacyDataIfNeeded();
    if (!isRemoteReadyForSync()) {
      return { success: false, error: 'Remote sync not available' };
    }

    const queueData = safeGetItem(namespacedKey(SYNC_QUEUE_KEY_BASE));

    if (!queueData) {
      // Still sync versions even if no queue
      const localVersions = loadVersions();
      if (localVersions.length > 0) {
        await syncVersionsToRemote(localVersions);
      }
      return { success: true };
    }

    const queueItem = safeJsonParse<SyncQueueItem>(queueData, { timestamp: Date.now(), items: [] });
    const localItems = queueItem.items;

    // Fetch current Remote data to check for conflicts
    let remoteItems: PAOItem[] = [];
    try {
      remoteItems = await loadPAOListFromRemote();
    } catch (e) {
      console.log('ℹ️ No remote data found, proceeding with local data');
    }

    // Merge with conflict resolution
    const mergedItems = remoteItems.length > 0
      ? mergeItems(localItems, remoteItems)
      : localItems;

    const wasMerged = remoteItems.length > 0 &&
      JSON.stringify(mergedItems) !== JSON.stringify(localItems);

    // Save merged result to Remote
    await saveToRemote(mergedItems);

    // Sync all versions
    const localVersions = loadVersions();
    await syncVersionsToRemote(localVersions);

    // If data was merged, update LocalStorage with the merged result
    if (wasMerged) {
      console.log('🔄 Data merged from remote, updating LocalStorage');
      safeSetItem(namespacedKey('pao_data'), JSON.stringify(mergedItems));

      // Update active version
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        updateVersion(activeVersion.id, { items: mergedItems });
      }
    }

    // Clear queue and update last sync time
    safeRemoveItem(namespacedKey(SYNC_QUEUE_KEY_BASE));
    safeSetItem(namespacedKey(LAST_SYNC_KEY_BASE), Date.now().toString());

    console.log('✅ Synced to Remote');
    return { success: true, merged: wasMerged };
  } catch (error) {
    console.error('❌ Failed to sync to Remote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    // Always release the lock
    isSyncing = false;
  }
}



/**
 * Load data with LocalStorage-first strategy and conflict resolution
 * Now loads from active version
 */
export async function loadPAOData(): Promise<PAOItem[]> {
  // 1. Try LocalStorage first (instant) - from active version
  const localData = loadFromLocalStorage();

  if (localData) {
    console.log('✅ Loaded from LocalStorage (active version)');

    // Sync from Remote in background to check for updates
    try {
      // Load versions from Remote
      const { versions: remoteVersions } = await loadVersionsFromRemote();
      if (remoteVersions.length > 0) {
        // Merge versions (simplified - just update if remote is newer)
        const localVersions = loadVersions();
        let hasUpdates = false;

        remoteVersions.forEach(remoteVersion => {
          const localVersion = localVersions.find(v => v.id === remoteVersion.id);
          if (!localVersion || remoteVersion.lastModified > localVersion.lastModified) {
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          console.log('🔄 Newer versions found in Remote');
          saveVersions(remoteVersions);
          const activeVersion = getActiveVersion();
          if (activeVersion) {
            return activeVersion.items;
          }
        }
      }

      // Also check remote List data (if we still use it alongside versions)
      const remoteData = await loadPAOListFromRemote();
      if (remoteData && remoteData.length > 0) {
        const mergedData = mergeItems(localData, remoteData);

        if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
          console.log('🔄 Merged newer data from Remote');
          saveToLocalStorage(mergedData);
          return mergedData;
        }
      }
    } catch (error) {
      console.log('ℹ️ Remote sync not available, using LocalStorage');
    }

    return localData;
  }

  // 2. If no local data, try Remote
  try {
    // Try loading versions first
    const { versions: remoteVersions } = await loadVersionsFromRemote();
    if (remoteVersions.length > 0) {
      saveVersions(remoteVersions);
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        return activeVersion.items;
      }
    }

    // Fallback to List data
    const remoteData = await loadPAOListFromRemote();
    if (remoteData && remoteData.length > 0) {
      saveToLocalStorage(remoteData);
      return remoteData;
    }
  } catch (error) {
    console.log('ℹ️ Remote not available');
  }

  // 3. Return empty array if nothing found
  return Array.from({ length: 100 }, (_, i) => ({
    number: i,
    person: '',
    action: '',
    object: '',
    scene: '',
    completed: false
  }));
}
