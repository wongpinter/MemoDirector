/**
 * Sync Queue Service
 * Manages LocalStorage-first saves with periodic Firebase sync
 */

import { PAOItem } from '../types';
import { savePAOList as saveToFirebase, loadPAOList } from './db';

const SYNC_QUEUE_KEY = 'pao_sync_queue';
const LAST_SYNC_KEY = 'pao_last_sync';
const SYNC_INTERVAL = 30000; // 30 seconds

export interface SyncQueueItem {
  timestamp: number;
  items: PAOItem[];
}

/**
 * Save items to LocalStorage immediately (fast, offline-safe)
 */
export function saveToLocalStorage(items: PAOItem[]): void {
  try {
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
 */
export function loadFromLocalStorage(): PAOItem[] | null {
  try {
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
 */
export async function syncToFirebase(): Promise<{ success: boolean; error?: string; merged?: boolean }> {
  try {
    const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
    
    if (!queueData) {
      return { success: true }; // Nothing to sync
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
    
    // Save merged result to Firebase
    await saveToFirebase(mergedItems);
    
    // If data was merged, update LocalStorage with the merged result
    if (wasMerged) {
      console.log('🔄 Data merged from remote, updating LocalStorage');
      localStorage.setItem('pao_data', JSON.stringify(mergedItems));
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
 */
export async function loadPAOData(): Promise<PAOItem[]> {
  // 1. Try LocalStorage first (instant)
  const localData = loadFromLocalStorage();
  
  if (localData) {
    console.log('✅ Loaded from LocalStorage');
    
    // Sync from Firebase in background to check for updates
    try {
      const firebaseData = await loadPAOList();
      
      // If Firebase has data, merge with conflict resolution
      if (firebaseData && firebaseData.length > 0) {
        const mergedData = mergeItems(localData, firebaseData);
        
        // Check if merge resulted in changes
        if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
          console.log('🔄 Merged newer data from Firebase');
          saveToLocalStorage(mergedData);
          return mergedData;
        }
        
        console.log('ℹ️ Local data is up to date');
      }
    } catch (error) {
      console.log('ℹ️ Firebase not available, using LocalStorage');
    }
    
    return localData;
  }
  
  // 2. If no local data, try Firebase
  try {
    const firebaseData = await loadPAOList();
    if (firebaseData && firebaseData.length > 0) {
      // Save to LocalStorage for next time
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
