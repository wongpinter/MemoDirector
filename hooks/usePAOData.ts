import { useState, useEffect } from 'react';
import { PAOItem } from '../types';
import { loadPAOList, savePAOList } from '../services/db';
import { useLocalStorage } from './useLocalStorage';
import { useDebouncedValue } from './useDebouncedValue';
import { STORAGE_KEYS, UI_CONSTANTS } from '../constants';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

/**
 * Custom hook for managing PAO data with auto-save and sync
 */
export function usePAOData() {
  const [items, setItems] = useState<PAOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  
  // Local storage fallback for offline/anonymous users
  const [localItems, setLocalItems] = useLocalStorage<PAOItem[]>(STORAGE_KEYS.PAO_DATA, []);
  
  // Debounce items for auto-save
  const debouncedItems = useDebouncedValue(items, UI_CONSTANTS.DEBOUNCE_DELAY);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await loadPAOList();
        setItems(data);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to local storage
        setItems(localItems);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-save when items change (debounced)
  useEffect(() => {
    if (loading) return; // Don't save during initial load

    async function saveData() {
      setSyncStatus('syncing');
      try {
        await savePAOList(debouncedItems);
        setLocalItems(debouncedItems); // Also save to local storage
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
      } catch (error) {
        console.error('Failed to save changes:', error);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION);
      }
    }

    saveData();
  }, [debouncedItems, loading]);

  const updateItem = (updatedItem: PAOItem) => {
    setItems(prev => 
      prev.map(item => 
        item.number === updatedItem.number ? updatedItem : item
      )
    );
  };

  const updateItems = (newItems: PAOItem[]) => {
    setItems(newItems);
  };

  return {
    items,
    loading,
    syncStatus,
    updateItem,
    updateItems,
  };
}
