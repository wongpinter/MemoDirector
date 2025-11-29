import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { pullPAODataFromServer, checkServerData, clearLocalData, PullResult } from '../services/pullService';
import { useToast } from '../contexts/ToastContext';

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

  // Check for local data and server data on mount
  useEffect(() => {
    const checkData = async () => {
      // Check for any local PAO data (legacy or versions)
      const legacyData = localStorage.getItem('pao_data');
      const versionsData = localStorage.getItem('pao_versions');
      const hasAnyLocalData = !!(legacyData || versionsData);
      
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
        showToast({
          type: 'success',
          message: `✅ ${result.message}`
        });
        setHasLocalData(true);
        onPullComplete?.();
      } else {
        showToast({
          type: 'error',
          message: `❌ ${result.error}`
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast({
        type: 'error',
        message: `❌ Pull failed: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocal = () => {
    try {
      clearLocalData();
      
      // Recheck local data to ensure it's actually cleared
      const legacyData = localStorage.getItem('pao_data');
      const versionsData = localStorage.getItem('pao_versions');
      const hasAnyLocalData = !!(legacyData || versionsData);
      
      setHasLocalData(hasAnyLocalData);
      setPullResult(null);
      setShowClearConfirm(false);
      
      showToast({
        type: 'success',
        message: '✅ Local data cleared'
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: '❌ Failed to clear local data'
      });
    }
  };

  // Show component even if local data exists, but disable pull button

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 mb-1">Pull Data from Server</h3>
          <p className="text-sm text-slate-400">
            Restore your PAO data from the server to this device
          </p>
        </div>
      </div>

      {/* Server Data Status */}
      {serverData && (
        <div className={`p-3 rounded-md text-sm ${
          serverData.hasData 
            ? 'bg-blue-900/30 border border-blue-700/50 text-blue-200' 
            : 'bg-slate-700/50 border border-slate-600 text-slate-300'
        }`}>
          {serverData.hasData ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Data available on server</p>
                <p className="text-xs mt-1">
                  {serverData.itemsCount} items • {serverData.versionsCount} versions
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>No data found on server</p>
            </div>
          )}
        </div>
      )}

      {/* Pull Result */}
      {pullResult && (
        <div className={`p-3 rounded-md text-sm ${
          pullResult.success
            ? 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-200'
            : 'bg-red-900/30 border border-red-700/50 text-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {pullResult.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{pullResult.message || pullResult.error}</p>
              {pullResult.success && (
                <p className="text-xs mt-1">
                  Pulled {pullResult.itemsCount} items from {pullResult.versionsCount} versions
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Local Data Warning */}
      {hasLocalData && !pullResult && (
        <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-md text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Local data exists</p>
              <p className="text-xs mt-1 text-amber-200/80">
                Clear local data first to pull fresh data from server, or use sync to merge data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePull}
          disabled={isLoading || !serverData?.hasData || hasLocalData}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            isLoading || !serverData?.hasData || hasLocalData
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          title={
            hasLocalData 
              ? 'Clear local data first to pull from server'
              : !serverData?.hasData 
              ? 'No data available on server'
              : 'Pull data from server'
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Pulling...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Pull Data
            </>
          )}
        </button>

        {hasLocalData && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 rounded-md font-medium transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center gap-2"
            title="Clear local data to pull fresh data from server"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local
          </button>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-md space-y-3">
          <p className="text-sm text-red-200">
            This will delete all local data. You can pull fresh data from the server after clearing.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearLocal}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium transition-all"
            >
              Clear Local Data
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
