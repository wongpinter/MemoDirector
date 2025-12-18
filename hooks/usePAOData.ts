import { useState, useEffect, useCallback } from 'react';
import { PAOItem } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { UI_CONSTANTS } from '../constants';
import {
  loadPAOData,
  saveToLocalStorage,
  syncToRemote,
  hasPendingSync as checkPendingSync,
  getLastSyncTime
} from '../services/syncQueue';
import { migrateToVersioning, getActiveVersion } from '../services/versionManager';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'pending';

/**
 * Custom hook for managing PAO data with LocalStorage-first and periodic Remote sync
 */
export function usePAOData() {
  const [items, setItems] = useState<PAOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Guard for auto-save
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingSyncState, setPendingSyncState] = useState(false); // Reactive pending state

  // Debounce items for auto-save
  const debouncedItems = useDebouncedValue(items, UI_CONSTANTS.DEBOUNCE_DELAY);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await loadPAOData();

        // Migrate to versioning if needed
        migrateToVersioning(data);

        // Load from active version
        const activeVersion = getActiveVersion();
        if (activeVersion) {
          setItems(activeVersion.items);
        } else {
          setItems(data);
        }

        setLastSyncTime(getLastSyncTime());
        setPendingSyncState(checkPendingSync());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true); // Mark as initialized after first load
      }
    }
    loadData();
  }, []);

  // Auto-save to LocalStorage when items change (debounced)
  useEffect(() => {
    // Don't save during initial load or before initialization
    if (loading || !isInitialized) return;

    try {
      saveToLocalStorage(debouncedItems);
      setSyncStatus('pending');
      setPendingSyncState(true);
      setTimeout(() => {
        const pending = checkPendingSync();
        setPendingSyncState(pending);
        if (pending) {
          setSyncStatus('pending');
        } else {
          setSyncStatus('idle');
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to save to LocalStorage:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
    }
  }, [debouncedItems, loading, isInitialized]);



  // Manual sync function
  const manualSync = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await syncToRemote();

    if (result.success) {
      // If data was merged, reload from LocalStorage to get the merged result
      if (result.merged) {
        const mergedData = await loadPAOData();
        setItems(mergedData);
        console.log('🔄 Reloaded merged data');
      }

      setSyncStatus('saved');
      setLastSyncTime(Date.now());
      setPendingSyncState(checkPendingSync());
      setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
    }

    return result;
  }, []);

  // Trigger initial sync on mount (after local load) to fetch latest cloud data
  // This implements the "Sync on Load" strategy to mitigate conflicts by:
  // 1. Fetching remote data immediately
  // 2. Merging with local data using timestamp-based resolution (Last Write Wins)
  useEffect(() => {
    if (isInitialized) {
      console.log('🔄 Initializing "Sync on Load" mitigation...');
      manualSync();
    }
  }, [isInitialized, manualSync]);

  const updateItem = (updatedItem: PAOItem) => {
    // Add timestamp to track when this item was last modified
    const itemWithTimestamp = {
      ...updatedItem,
      lastModified: Date.now()
    };

    setItems(prev =>
      prev.map(item =>
        item.number === itemWithTimestamp.number ? itemWithTimestamp : item
      )
    );
  };

  const updateItems = (newItems: PAOItem[]) => {
    setItems(newItems);
  };

  const reloadActiveVersion = useCallback(async () => {
    const activeVersion = getActiveVersion();
    if (activeVersion) {
      setItems(activeVersion.items);
    }
  }, []);

  return {
    items,
    loading,
    syncStatus,
    lastSyncTime,
    hasPendingSync: pendingSyncState,
    manualSync,
    updateItem,
    updateItems,
    reloadActiveVersion,
  };
}

