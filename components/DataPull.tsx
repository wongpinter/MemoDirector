import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Trash2 } from 'lucide-react';
import {
  pullPAODataFromServer,
  checkServerData,
  clearLocalData,
  PullResult,
} from '../services/pullService';
import { useToast } from '../contexts/ToastContext';
import { Card, Button, Notice } from './ui';

interface DataPullProps {
  onPullComplete?: () => void;
}

export function DataPull({ onPullComplete }: DataPullProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [serverData, setServerData] = useState<{
    hasData: boolean;
    itemsCount: number;
    versionsCount: number;
  } | null>(null);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const checkData = async () => {
      const legacyData = localStorage.getItem('pao_data');
      const versionsData = localStorage.getItem('pao_versions');
      const hasAnyLocalData = Boolean(legacyData || versionsData);

      setHasLocalData(hasAnyLocalData);

      const serverInfo = await checkServerData();
      setServerData(serverInfo);
    };

    checkData();
  }, []);

  const handlePull = async () => {
    setIsLoading(true);
    setPullResult(null);

    try {
      const result = await pullPAODataFromServer();
      setPullResult(result);

      if (result.success) {
        showToast(result.message || 'Data pulled successfully', 'success');
        setHasLocalData(true);
        onPullComplete?.();
      } else {
        showToast(result.error || 'Pull failed', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Pull failed: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocal = () => {
    try {
      clearLocalData();
      const legacyData = localStorage.getItem('pao_data');
      const versionsData = localStorage.getItem('pao_versions');
      const hasAnyLocalData = Boolean(legacyData || versionsData);

      setHasLocalData(hasAnyLocalData);
      setPullResult(null);
      setShowClearConfirm(false);
      showToast('Local deck data cleared', 'success');
    } catch {
      showToast('Failed to clear local data', 'error');
    }
  };

  return (
    <Card variant="paper" padding="md" className="space-y-4 font-sans">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent-light text-accent">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-charcoal text-base">Pull Remote Data</h4>
          <p className="text-xs text-steel">
            Fetch your saved deck from cloud storage directly to this browser.
          </p>
        </div>
      </div>

      {serverData && (
        <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs">
          {serverData.hasData ? (
            <div className="flex items-center gap-2 text-charcoal">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>
                Cloud data available: <strong>{serverData.itemsCount}</strong> cards across{' '}
                <strong>{serverData.versionsCount}</strong> versions.
              </span>
            </div>
          ) : (
            <span className="text-steel">No remote data found for this account.</span>
          )}
        </div>
      )}

      {pullResult && (
        <Notice variant={pullResult.success ? 'success' : 'danger'}>
          {pullResult.message || pullResult.error}
        </Notice>
      )}

      {hasLocalData && !pullResult && (
        <Notice variant="warning">
          Local cards already exist on this device. Clear local data first if you wish to overwrite
          cleanly from remote, or use normal sync to merge changes.
        </Notice>
      )}

      <div className="flex gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={handlePull}
          loading={isLoading}
          disabled={!serverData?.hasData || hasLocalData}
          icon={<Download className="w-4 h-4" />}
          className="flex-1"
        >
          Pull from Cloud
        </Button>

        {hasLocalData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            icon={<Trash2 className="w-4 h-4 text-danger" />}
          >
            Clear Local
          </Button>
        )}
      </div>

      {showClearConfirm && (
        <Notice variant="danger" title="Confirm Local Wipe">
          <p className="mb-2">
            This wipes local storage for this device. Any unsaved or un-synced cards will be deleted.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" onClick={handleClearLocal}>
              Wipe Local Cards
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
          </div>
        </Notice>
      )}
    </Card>
  );
}
