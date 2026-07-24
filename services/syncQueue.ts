/**
 * Sync Queue Service
 * Manages cloud sync to Remote (Supabase).
 * LocalStorage persistence is delegated to paoStore.
 */

import { PAOItem } from '../types';
import {
  savePAOList as saveToRemote,
  loadPAOListFromRemote,
  syncVersionsToRemote,
  loadVersions as loadVersionsFromRemote,
  isRemoteReadyForSync,
} from './db';
import { load as storeLoad, save as storeSave, listVersions } from './paoStore';
import { getCurrentUserId } from './auth';
import { safeSetItem, safeGetItem, safeRemoveItem, StorageResult, safeJsonParse } from '../utils';

const namespacedKey = (base: string) => `${base}_${getCurrentUserId()}`;
const SYNC_QUEUE_KEY_BASE = 'pao_sync_queue';
const LAST_SYNC_KEY_BASE = 'pao_last_sync';

// Sync lock to prevent race conditions
let isSyncing = false;

export interface SyncQueueItem {
  timestamp: number;
  items: PAOItem[];
}

/**
 * Save items to LocalStorage (via paoStore) + write sync queue.
 * Returns StorageResult so callers can detect quota exceeded.
 */
export function saveToLocalStorage(items: PAOItem[]): StorageResult {
  const result = storeSave(items);
  if (!result.success) return result;

  const queueItem: SyncQueueItem = { timestamp: Date.now(), items };
  safeSetItem(namespacedKey(SYNC_QUEUE_KEY_BASE), JSON.stringify(queueItem));

  return result;
}

/**
 * Load items from LocalStorage (via paoStore).
 */
export function loadFromLocalStorage(): PAOItem[] {
  return storeLoad();
}

/**
 * Check if there are pending changes to sync.
 */
export function hasPendingSync(): boolean {
  const queueData = safeGetItem(namespacedKey(SYNC_QUEUE_KEY_BASE));
  return !!queueData;
}

/**
 * Get the last sync timestamp.
 */
export function getLastSyncTime(): number | null {
  const lastSync = safeGetItem(namespacedKey(LAST_SYNC_KEY_BASE));
  return lastSync ? parseInt(lastSync, 10) : null;
}

/**
 * Merge items with conflict resolution based on lastModified timestamp.
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
      const localTime = local.lastModified || 0;
      const remoteTime = remote.lastModified || 0;

      if (localTime > remoteTime) {
        merged.push(local);
      } else if (remoteTime > localTime) {
        merged.push(remote);
      } else {
        merged.push(local);
      }
    }
  }

  return merged;
}

/**
 * Sync queued items to Remote with conflict resolution.
 * Uses a lock to prevent race conditions from concurrent sync operations.
 */
export async function syncToRemote(): Promise<{ success: boolean; error?: string; merged?: boolean }> {
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return { success: false, error: 'Sync already in progress' };
  }

  isSyncing = true;

  try {
    if (!isRemoteReadyForSync()) {
      return { success: false, error: 'Remote sync not available' };
    }

    const queueData = safeGetItem(namespacedKey(SYNC_QUEUE_KEY_BASE));

    if (!queueData) {
      // Still sync versions even if no queue
      const versions = listVersions();
      if (versions.length > 0) {
        await syncVersionsToRemote(versions);
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
    const versions = listVersions();
    await syncVersionsToRemote(versions);

    // If data was merged, update LocalStorage with the merged result
    if (wasMerged) {
      console.log('🔄 Data merged from remote, updating LocalStorage');
      storeSave(mergedItems);
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Load data with LocalStorage-first strategy and conflict resolution.
 * Delegates local storage to paoStore; handles Remote fallback.
 */
export async function loadPAOData(): Promise<PAOItem[]> {
  // 1. Try LocalStorage first (instant)
  const localData = storeLoad();

  if (localData.length > 0 && localData.some(item => item.person || item.action || item.object)) {
    console.log('✅ Loaded from LocalStorage (active version)');

    // Sync from Remote in background to check for updates
    try {
      const { versions: remoteVersions } = await loadVersionsFromRemote();
      if (remoteVersions.length > 0) {
        const localVersions = listVersions();
        let hasUpdates = false;

        remoteVersions.forEach(remoteVersion => {
          const localVersion = localVersions.find(v => v.id === remoteVersion.id);
          if (!localVersion || remoteVersion.lastModified > localVersion.lastModified) {
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          console.log('🔄 Newer versions found in Remote');
          // Remote versions saved internally by version sync
          const activeVersion = remoteVersions.find(v => v.isActive);
          if (activeVersion) return activeVersion.items;
        }
      }

      const remoteData = await loadPAOListFromRemote();
      if (remoteData && remoteData.length > 0) {
        const mergedData = mergeItems(localData, remoteData);

        if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
          console.log('🔄 Merged newer data from Remote');
          storeSave(mergedData);
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
    const { versions: remoteVersions } = await loadVersionsFromRemote();
    if (remoteVersions.length > 0) {
      // pony tail: sync remote versions into paoStore when cloud becomes real
      const activeVersion = remoteVersions.find(v => v.isActive);
      if (activeVersion) return activeVersion.items;
    }

    const remoteData = await loadPAOListFromRemote();
    if (remoteData && remoteData.length > 0) {
      storeSave(remoteData);
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
    completed: false,
  }));
}
