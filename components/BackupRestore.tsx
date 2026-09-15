import React, { useState, useRef } from 'react';
import { PAOItem } from '../types';
import { exportToCSV, importFromCSV, downloadCSV, generateBackupFilename } from '../utils/csvBackup';
import { Download, Upload, FileText, AlertTriangle } from 'lucide-react';
import { Card, Button, Notice } from './ui';

interface BackupRestoreProps {
  items: PAOItem[];
  onRestore: (items: PAOItem[]) => void;
}

type MergeStrategy = 'replace' | 'merge-keep-existing' | 'merge-keep-new';

export const BackupRestore: React.FC<BackupRestoreProps> = ({ items, onRestore }) => {
  const [status, setStatus] = useState<{
    type: 'success' | 'danger' | 'warning' | null;
    message: string;
  }>({
    type: null,
    message: '',
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
        message: `Backup exported: ${filename}`,
      });

      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus({
        type: 'danger',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

        setPreviewItems(importedItems);
        setStatus({
          type: 'warning',
          message: `Found ${importedItems.length} items. Select a merge strategy to apply.`,
        });
      } catch (error) {
        console.error('Import error:', error);
        setStatus({
          type: 'danger',
          message: `Import failed: ${error instanceof Error ? error.message : 'Invalid CSV format'}`,
        });
        setPreviewItems(null);
      }
    };

    reader.onerror = () => {
      setStatus({
        type: 'danger',
        message: 'Failed to read file from disk',
      });
    };

    reader.readAsText(file);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (!previewItems) return;

    try {
      let finalItems: PAOItem[];

      if (mergeStrategy === 'replace') {
        finalItems = previewItems;
      } else {
        const itemMap = new Map<number, PAOItem>();

        if (mergeStrategy === 'merge-keep-existing') {
          previewItems.forEach((item) => itemMap.set(item.number, item));
          items.forEach((item) => {
            if (item.person || item.action || item.object) {
              itemMap.set(item.number, item);
            }
          });
        } else {
          items.forEach((item) => itemMap.set(item.number, item));
          previewItems.forEach((item) => {
            if (item.person || item.action || item.object) {
              itemMap.set(item.number, item);
            }
          });
        }

        finalItems = Array.from(itemMap.values());
        for (let i = 0; i < 100; i++) {
          if (!itemMap.has(i)) {
            finalItems.push({
              number: i,
              person: '',
              action: '',
              object: '',
              completed: false,
            });
          }
        }
        finalItems.sort((a, b) => a.number - b.number);
      }

      onRestore(finalItems);
      setStatus({
        type: 'success',
        message: `Restored ${previewItems.length} items successfully.`,
      });
      setPreviewItems(null);
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      console.error('Restore error:', error);
      setStatus({
        type: 'danger',
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleCancelRestore = () => {
    setPreviewItems(null);
    setStatus({ type: null, message: '' });
  };

  const conflictCount = previewItems
    ? previewItems.filter((i) => items.some((ex) => ex.number === i.number && (ex.person || ex.action || ex.object))).length
    : 0;

  return (
    <div className="space-y-4 font-sans">
      {status.type && (
        <Notice variant={status.type} title="Backup Status">
          {status.message}
        </Notice>
      )}

      {/* Preview & Merge Strategy */}
      {previewItems && (
        <Card variant="paper" padding="md" className="space-y-4 border-conflict/50">
          <div className="flex items-center gap-2 text-conflict font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Confirm CSV Import ({previewItems.length} cards found)</span>
          </div>

          <div className="p-3 bg-surface-subtle rounded-lg border border-border text-xs space-y-1 text-steel">
            <p>Cards with existing data: <strong>{conflictCount}</strong></p>
            <p>New empty slots filled: <strong>{previewItems.length - conflictCount}</strong></p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-charcoal block">Choose Merge Strategy:</span>

            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-surface-subtle cursor-pointer">
              <input
                type="radio"
                name="mergeStrategy"
                value="merge-keep-new"
                checked={mergeStrategy === 'merge-keep-new'}
                onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                className="mt-0.5 text-accent focus:ring-accent"
              />
              <div className="text-xs">
                <span className="font-semibold text-charcoal block">
                  Merge — Overwrite with imported file (Recommended)
                </span>
                <span className="text-steel">Imported data takes priority for duplicate numbers.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-surface-subtle cursor-pointer">
              <input
                type="radio"
                name="mergeStrategy"
                value="merge-keep-existing"
                checked={mergeStrategy === 'merge-keep-existing'}
                onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                className="mt-0.5 text-accent focus:ring-accent"
              />
              <div className="text-xs">
                <span className="font-semibold text-charcoal block">
                  Merge — Keep existing cards
                </span>
                <span className="text-steel">Only fill blank numbers; never overwrite existing entries.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-danger/30 hover:bg-danger-light/20 cursor-pointer">
              <input
                type="radio"
                name="mergeStrategy"
                value="replace"
                checked={mergeStrategy === 'replace'}
                onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
                className="mt-0.5 text-danger focus:ring-danger"
              />
              <div className="text-xs">
                <span className="font-semibold text-danger block">
                  Replace all (Destructive)
                </span>
                <span className="text-steel">Wipes current deck completely and resets with CSV.</span>
              </div>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={handleCancelRestore}>
              Cancel
            </Button>
            <Button size="sm" variant="accent" onClick={handleConfirmRestore}>
              Confirm &amp; Apply
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {!previewItems && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card
            variant="paper"
            padding="md"
            interactive
            onClick={handleExport}
            className="flex items-center gap-3.5"
          >
            <div className="p-2.5 bg-accent-light text-accent rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-charcoal text-sm">Export CSV Backup</h4>
              <p className="text-xs text-steel">Download all {items.length} cards as a spreadsheet</p>
            </div>
          </Card>

          <Card
            variant="paper"
            padding="md"
            interactive
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3.5"
          >
            <div className="p-2.5 bg-surface-subtle text-steel rounded-lg border border-border">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-charcoal text-sm">Restore CSV Backup</h4>
              <p className="text-xs text-steel">Upload and merge cards from a CSV file</p>
            </div>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
