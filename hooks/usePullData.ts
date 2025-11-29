import { useState, useCallback } from 'react';
import { pullPAODataFromServer, checkServerData, clearLocalData, PullResult } from '../services/pullService';

export interface ServerDataInfo {
  hasData: boolean;
  itemsCount: number;
  versionsCount: number;
  error?: string;
}

/**
 * Custom hook for managing data pull operations
 */
export function usePullData() {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [serverData, setServerData] = useState<ServerDataInfo | null>(null);

  const checkServer = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await checkServerData();
      setServerData(data);
      return data;
    } catch (error) {
      console.error('Failed to check server data:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const pull = useCallback(async () => {
    setIsLoading(true);
    setPullResult(null);
    try {
      const result = await pullPAODataFromServer();
      setPullResult(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: PullResult = {
        success: false,
        itemsCount: 0,
        versionsCount: 0,
        error: errorMessage
      };
      setPullResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLocal = useCallback(() => {
    try {
      clearLocalData();
      setPullResult(null);
      return true;
    } catch (error) {
      console.error('Failed to clear local data:', error);
      return false;
    }
  }, []);

  return {
    isLoading,
    isChecking,
    pullResult,
    serverData,
    checkServer,
    pull,
    clearLocal
  };
}
