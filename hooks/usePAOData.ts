import { useState, useEffect, useCallback } from 'react';
import { PAOItem } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { UI_CONSTANTS } from '../constants';
import { 
  loadPAOData, 
  saveToLocalStorage, 
  syncToFirebase, 
  startPeriodicSync,
  hasPendingSync,
  getLastSyncTime
} from '../services/syncQueue';
import { migrateToVersioning, getActiveVersion } from '../services/versionManager';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'pending';

/**
 * Custom hook for managing PAO data with LocalStorage-first and periodic Firebase sync
 */
export function usePAOData() {
  const [items, setItems] = useState<PAOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  
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
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-save to LocalStorage when items change (debounced)
  useEffect(() => {
    if (loading) return; // Don't save during initial load

    try {
      saveToLocalStorage(debouncedItems);
      setSyncStatus('pending'); // Mark as pending sync to Firebase
      setTimeout(() => {
        if (hasPendingSync()) {
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
  }, [debouncedItems, loading]);

  // Start periodic sync on mount
  useEffect(() => {
    const cleanup = startPeriodicSync(async (status, merged) => {
      if (status === 'syncing') {
        setSyncStatus('syncing');
      } else if (status === 'synced') {
        // If data was merged, reload from LocalStorage to get the merged result
        if (merged) {
          const mergedData = await loadPAOData();
          setItems(mergedData);
          console.log('🔄 Reloaded merged data from periodic sync');
        }
        
        setSyncStatus('saved');
        setLastSyncTime(Date.now());
        setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
      } else if (status === 'error') {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
      }
    });

    return cleanup;
  }, []);

  // Manual sync function
  const manualSync = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await syncToFirebase();
    
    if (result.success) {
      // If data was merged, reload from LocalStorage to get the merged result
      if (result.merged) {
        const mergedData = await loadPAOData();
        setItems(mergedData);
        console.log('🔄 Reloaded merged data');
      }
      
      setSyncStatus('saved');
      setLastSyncTime(Date.now());
      setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
    }
    
    return result;
  }, []);

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
    hasPendingSync: hasPendingSync(),
    manualSync,
    updateItem,
    updateItems,
    reloadActiveVersion,
  };
}
