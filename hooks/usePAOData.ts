import { useState, useEffect, useCallback, useRef } from 'react';
import { PAOItem } from '../types';
import { useDebouncedValue } from './useDebouncedValue';
import { UI_CONSTANTS } from '../constants';
import {
  loadPAOData,
  saveToLocalStorage,
  syncToRemote,
  hasPendingSync as checkPendingSync,
  getLastSyncTime,
} from '../services/syncQueue';
import { load as storeLoad } from '../services/paoStore';
import { waitForAuth } from '../services/auth';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'pending';

// ── usePAOItems — item loading + auto-save + mutation ────────────

export function usePAOItems() {
  const [items, setItems] = useState<PAOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const debouncedItems = useDebouncedValue(items, UI_CONSTANTS.DEBOUNCE_DELAY);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await waitForAuth();
        const data = await loadPAOData();
        setItems(data);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || !isInitialized) return;
    saveToLocalStorage(debouncedItems);
  }, [debouncedItems, loading, isInitialized]);

  const updateItem = useCallback((updatedItem: PAOItem) => {
    setItems(prev =>
      prev.map(item =>
        item.number === updatedItem.number
          ? { ...updatedItem, lastModified: Date.now() }
          : item,
      ),
    );
  }, []);

  const updateItems = useCallback((newItems: PAOItem[]) => {
    setItems(newItems);
  }, []);

  const reloadActiveVersion = useCallback(() => {
    setItems(storeLoad());
  }, []);

  return { items, loading, updateItem, updateItems, reloadActiveVersion };
}

// ── usePAOSync — cloud sync status + trigger ─────────────────────

export function usePAOSync(ready: boolean, onMerged?: () => void) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingSync, setPendingSync] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  const manualSync = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await syncToRemote();

    if (result.success) {
      if (result.merged) onMerged?.();
      setSyncStatus('saved');
      setLastSyncTime(Date.now());
      setPendingSync(checkPendingSync());
    } else {
      setSyncStatus('error');
    }

    const t = setTimeout(
      () => setSyncStatus('idle'),
      UI_CONSTANTS.SAVE_STATUS_DISPLAY_DURATION,
    );
    timeoutRefs.current.push(t);

    return result;
  }, [onMerged]);

  // Sync-on-mount (also fires on ready transition)
  useEffect(() => {
    if (ready) manualSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Init
  useEffect(() => {
    setLastSyncTime(getLastSyncTime());
    setPendingSync(checkPendingSync());
  }, []);

  return { syncStatus, lastSyncTime, hasPendingSync: pendingSync, manualSync };
}

// ── usePAOData — composed, backward-compat interface ─────────────

export function usePAOData() {
  const { items, loading, updateItem, updateItems, reloadActiveVersion } = usePAOItems();
  const { syncStatus, lastSyncTime, hasPendingSync, manualSync } = usePAOSync(
    !loading,
    reloadActiveVersion,
  );

  return {
    items,
    loading,
    syncStatus,
    lastSyncTime,
    hasPendingSync,
    manualSync,
    updateItem,
    updateItems,
    reloadActiveVersion,
  };
}
