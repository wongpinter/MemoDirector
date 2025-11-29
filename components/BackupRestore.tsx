import React, { useState, useRef } from 'react';
import { PAOItem } from '../types';
import { exportToCSV, importFromCSV, downloadCSV, generateBackupFilename } from '../utils/csvBackup';
import { Download, Upload, FileText, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface BackupRestoreProps {
  items: PAOItem[];
  onRestore: (items: PAOItem[]) => void;
}

type MergeStrategy = 'replace' | 'merge-keep-existing' | 'merge-keep-new';

export const BackupRestore: React.FC<BackupRestoreProps> = ({ items, onRestore }) => {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ 
    type: null, 
    message: '' 
  });
  const [previewItems, setPreviewItems] = useState<PAOItem[] | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('merge-keep-new');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const csv = exportToCSV(items);
      const filename = generateBackupFilename();
      downloadCSV(csv, filename);
      
      setStatus({ 
        type: 'success', 
        message: `✓ Backup exported: ${filename}` 
      });
      
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus({ 
        type: 'error', 
        message: `✗ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const importedItems = importFromCSV(csvContent);
        
        // Show preview
        setPreviewItems(importedItems);
        setStatus({ 
          type: 'warning', 
          message: `Found ${importedItems.length} items. Choose merge strategy and confirm.` 
        });
      } catch (error) {
        console.error('Import error:', error);
        setStatus({ 
          type: 'error', 
          message: `✗ Import failed: ${error instanceof Error ? error.message : 'Invalid CSV format'}` 
        });
        setPreviewItems(null);
      }
    };

    reader.onerror = () => {
      setStatus({ 
        type: 'error', 
        message: '✗ Failed to read file' 
      });
    };

    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (!previewItems) return;

    try {
      let finalItems: PAOItem[];

      if (mergeStrategy === 'replace') {
        // Replace all existing data
        finalItems = previewItems;
      } else {
        // Merge strategies
        const existingMap = new Map<number, PAOItem>(items.map(item => [item.number, item]));
        const importedMap = new Map<number, PAOItem>(previewItems.map(item => [item.number, item]));

        finalItems = [];
        const allNumbers = new Set([...existingMap.keys(), ...importedMap.keys()]);

        for (const num of allNumbers) {
          const existing = existingMap.get(num);
          const imported = importedMap.get(num);

          if (!existing && imported) {
            // Only in imported
            finalItems.push(imported);
          } else if (existing && !imported) {
            // Only in existing
            finalItems.push(existing);
          } else if (existing && imported) {
            // In both - apply strategy
            if (mergeStrategy === 'merge-keep-existing') {
              finalItems.push(existing);
            } else {
              // merge-keep-new
              finalItems.push(imported);
            }
          }
        }

        // Sort by number
        finalItems.sort((a, b) => a.number - b.number);
      }

      onRestore(finalItems);
      
      setStatus({ 
        type: 'success', 
        message: `✓ Restored ${previewItems.length} items successfully!` 
      });
      setPreviewItems(null);
      
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      console.error('Restore error:', error);
      setStatus({ 
        type: 'error', 
        message: `✗ Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleCancelRestore = () => {
    setPreviewItems(null);
    setStatus({ type: null, message: '' });
  };

  const getConflictCount = (): number => {
    if (!previewItems) return 0;
    const existingNumbers = new Set(items.map(i => i.number));
    return previewItems.filter(i => existingNumbers.has(i.number)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Backup & Restore</h2>
            <p className="text-sm text-slate-400">Export your PAO data to CSV or restore from backup</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status.type && (
        <div className={`p-4 rounded-lg border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-emerald-950/30 border-emerald-600/50 text-emerald-300' :
          status.type === 'error' ? 'bg-rose-950/30 border-rose-600/50 text-rose-300' :
          'bg-amber-950/30 border-amber-600/50 text-amber-300'
        }`}>
          {status.type === 'success' && <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />}
          {status.type === 'error' && <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />}
          {status.type === 'warning' && <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {/* Preview & Merge Strategy */}
      {previewItems && (
        <div className="bg-slate-800/50 border border-amber-600/50 rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle size={18} />
            <span>Restore Preview</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Current Items</div>
              <div className="text-2xl font-bold text-white">{items.length}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Import Items</div>
              <div className="text-2xl font-bold text-indigo-400">{previewItems.length}</div>
            </div>
          </div>

          {getConflictCount() > 0 && (
            <div className="bg-amber-950/30 border border-amber-600/30 p-3 rounded-lg">
              <div className="text-amber-300 text-sm font-semibold mb-2">
                ⚠️ {getConflictCount()} conflicting numbers detected
              </div>
              <div className="text-xs text-amber-200/80">
                Choose how to handle conflicts:
              </div>
            </div>
          )}

          {/* Merge Strategy Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Merge Strategy
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="mergeStrategy"
                  value="merge-keep-new"
                  checked={mergeStrategy === 'merge-keep-new'}
                  onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Merge - Keep Imported (Recommended)</div>
                  <div className="text-xs text-slate-400">Import new items and update existing ones with imported data</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="mergeStrategy"
                  value="merge-keep-existing"
                  checked={mergeStrategy === 'merge-keep-existing'}
                  onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Merge - Keep Existing</div>
                  <div className="text-xs text-slate-400">Import only new items, don't update existing ones</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 border border-rose-700/50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="mergeStrategy"
                  value="replace"
                  checked={mergeStrategy === 'replace'}
                  onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-rose-300">Replace All (Destructive)</div>
                  <div className="text-xs text-rose-400/80">Delete all current data and replace with imported data</div>
                </div>
              </label>
            </div>
          </div>

          {/* Confirm/Cancel Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancelRestore}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
            >
              Confirm Restore
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!previewItems && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="group p-6 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-900/20"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600/20 group-hover:bg-indigo-600/30 rounded-lg transition-colors">
                <Download className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-white mb-1">Export Backup</h3>
                <p className="text-sm text-slate-400">Download all {items.length} items as CSV</p>
              </div>
            </div>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group p-6 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-900/20"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600/20 group-hover:bg-emerald-600/30 rounded-lg transition-colors">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-white mb-1">Restore Backup</h3>
                <p className="text-sm text-slate-400">Import PAO data from CSV file</p>
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Info Section */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-2">About CSV Backups</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• CSV files can be opened in Excel, Google Sheets, or any text editor</li>
          <li>• Backups include all PAO data: person, action, object, scenes, and media URLs</li>
          <li>• Use backups to transfer data between devices or keep offline copies</li>
          <li>• Restore operations are safe - you can choose how to merge data</li>
        </ul>
      </div>
    </div>
  );
};
