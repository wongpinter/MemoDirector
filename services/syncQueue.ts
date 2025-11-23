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
 * Sync queued items to Firebase
 */
export async function syncToFirebase(): Promise<{ success: boolean; error?: string }> {
  try {
    const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
    
    if (!queueData) {
      return { success: true }; // Nothing to sync
    }
    
    const queueItem: SyncQueueItem = JSON.parse(queueData);
    
    // Save to Firebase
    await saveToFirebase(queueItem.items);
    
    // Clear queue and update last sync time
    localStorage.removeItem(SYNC_QUEUE_KEY);
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    
    console.log('✅ Synced to Firebase');
    return { success: true };
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
export function startPeriodicSync(onSyncStatusChange?: (status: 'syncing' | 'synced' | 'error') => void): () => void {
  const intervalId = setInterval(async () => {
    if (hasPendingSync()) {
      console.log('🔄 Starting periodic sync...');
      onSyncStatusChange?.('syncing');
      
      const result = await syncToFirebase();
      
      if (result.success) {
        onSyncStatusChange?.('synced');
      } else {
        onSyncStatusChange?.('error');
      }
    }
  }, SYNC_INTERVAL);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Load data with LocalStorage-first strategy
 */
export async function loadPAOData(): Promise<PAOItem[]> {
  // 1. Try LocalStorage first (instant)
  const localData = loadFromLocalStorage();
  
  if (localData) {
    console.log('✅ Loaded from LocalStorage');
    
    // Sync from Firebase in background to check for updates
    try {
      const firebaseData = await loadPAOList();
      
      // If Firebase has data, check if it's newer
      const lastSync = getLastSyncTime();
      if (firebaseData && firebaseData.length > 0) {
        // For now, we trust LocalStorage as source of truth
        // In production, you'd compare timestamps
        console.log('ℹ️ Firebase data available but using LocalStorage');
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
