/**
 * Sync Queue Service
 * Manages LocalStorage-first saves with periodic Firebase sync
 * Updated to support version management
 */

import { PAOItem } from '../types';
import { savePAOList as saveToFirebase, loadPAOList, syncVersionsToFirebase, loadVersions as loadVersionsFromFirebase } from './db';
import { loadVersions, saveVersions, getActiveVersion, updateVersion } from './versionManager';

const SYNC_QUEUE_KEY = 'pao_sync_queue';
const LAST_SYNC_KEY = 'pao_last_sync';
const SYNC_INTERVAL = 30000; // 30 seconds

export interface SyncQueueItem {
  timestamp: number;
  items: PAOItem[];
}

/**
 * Save items to LocalStorage immediately (fast, offline-safe)
 * Now updates the active version
 */
export function saveToLocalStorage(items: PAOItem[]): void {
  try {
    // Update active version with new items
    const activeVersion = getActiveVersion();
    if (activeVersion) {
      updateVersion(activeVersion.id, { items });
    }
    
    // Keep legacy storage for backward compatibility
    localStorage.setItem('pao_data', JSON.stringify(items));
    
    // Add to sync queue
    const queueItem: SyncQueueItem = {
      timestamp: Date.now(),
      items
    };
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queueItem));
    
    console.log('✅ Saved to LocalStorage');
  } catch (error) {
    console.error('❌ Failed to save to LocalStorage:', error);
    throw error;
  }
}

/**
 * Load items from LocalStorage
 * Now loads from active version
 */
export function loadFromLocalStorage(): PAOItem[] | null {
  try {
    // Try to load from active version first
    const activeVersion = getActiveVersion();
    if (activeVersion) {
      return activeVersion.items;
    }
    
    // Fallback to legacy storage
    const data = localStorage.getItem('pao_data');
    if (data) {
      return JSON.parse(data);
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
  const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
  return !!queueData;
}

/**
 * Get the last sync timestamp
 */
export function getLastSyncTime(): number | null {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
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
 * Sync queued items to Firebase with conflict resolution
 * Now syncs all versions
 */
export async function syncToFirebase(): Promise<{ success: boolean; error?: string; merged?: boolean }> {
  try {
    const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
    
    if (!queueData) {
      // Still sync versions even if no queue
      const localVersions = loadVersions();
      if (localVersions.length > 0) {
        await syncVersionsToFirebase(localVersions);
      }
      return { success: true };
    }
    
    const queueItem: SyncQueueItem = JSON.parse(queueData);
    const localItems = queueItem.items;
    
    // Fetch current Firebase data to check for conflicts
    let remoteItems: PAOItem[] = [];
    try {
      remoteItems = await loadPAOList();
    } catch (e) {
      console.log('ℹ️ No remote data found, proceeding with local data');
    }
    
    // Merge with conflict resolution
    const mergedItems = remoteItems.length > 0 
      ? mergeItems(localItems, remoteItems)
      : localItems;
    
    const wasMerged = remoteItems.length > 0 && 
      JSON.stringify(mergedItems) !== JSON.stringify(localItems);
    
    // Save merged result to Firebase (legacy)
    await saveToFirebase(mergedItems);
    
    // Sync all versions
    const localVersions = loadVersions();
    await syncVersionsToFirebase(localVersions);
    
    // If data was merged, update LocalStorage with the merged result
    if (wasMerged) {
      console.log('🔄 Data merged from remote, updating LocalStorage');
      localStorage.setItem('pao_data', JSON.stringify(mergedItems));
      
      // Update active version
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        updateVersion(activeVersion.id, { items: mergedItems });
      }
    }
    
    // Clear queue and update last sync time
    localStorage.removeItem(SYNC_QUEUE_KEY);
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    
    console.log('✅ Synced to Firebase');
    return { success: true, merged: wasMerged };
  } catch (error) {
    console.error('❌ Failed to sync to Firebase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Start periodic sync (call this once on app init)
 */
export function startPeriodicSync(onSyncStatusChange?: (status: 'syncing' | 'synced' | 'error', merged?: boolean) => void): () => void {
  const intervalId = setInterval(async () => {
    if (hasPendingSync()) {
      console.log('🔄 Starting periodic sync...');
      onSyncStatusChange?.('syncing');
      
      const result = await syncToFirebase();
      
      if (result.success) {
        onSyncStatusChange?.('synced', result.merged);
      } else {
        onSyncStatusChange?.('error');
      }
    }
  }, SYNC_INTERVAL);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
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
    
    // Sync from Firebase in background to check for updates
    try {
      // Load versions from Firebase
      const firebaseVersions = await loadVersionsFromFirebase();
      if (firebaseVersions.length > 0) {
        // Merge versions (simplified - just update if remote is newer)
        const localVersions = loadVersions();
        let hasUpdates = false;
        
        firebaseVersions.forEach(remoteVersion => {
          const localVersion = localVersions.find(v => v.id === remoteVersion.id);
          if (!localVersion || remoteVersion.lastModified > localVersion.lastModified) {
            hasUpdates = true;
          }
        });
        
        if (hasUpdates) {
          console.log('🔄 Newer versions found in Firebase');
          saveVersions(firebaseVersions);
          const activeVersion = getActiveVersion();
          if (activeVersion) {
            return activeVersion.items;
          }
        }
      }
      
      // Also check legacy Firebase data
      const firebaseData = await loadPAOList();
      if (firebaseData && firebaseData.length > 0) {
        const mergedData = mergeItems(localData, firebaseData);
        
        if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
          console.log('🔄 Merged newer data from Firebase');
          saveToLocalStorage(mergedData);
          return mergedData;
        }
      }
    } catch (error) {
      console.log('ℹ️ Firebase not available, using LocalStorage');
    }
    
    return localData;
  }
  
  // 2. If no local data, try Firebase
  try {
    // Try loading versions first
    const firebaseVersions = await loadVersionsFromFirebase();
    if (firebaseVersions.length > 0) {
      saveVersions(firebaseVersions);
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        return activeVersion.items;
      }
    }
    
    // Fallback to legacy data
    const firebaseData = await loadPAOList();
    if (firebaseData && firebaseData.length > 0) {
      saveToLocalStorage(firebaseData);
      return firebaseData;
    }
  } catch (error) {
    console.log('ℹ️ Firebase not available');
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
