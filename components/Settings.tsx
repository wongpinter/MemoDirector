import React, { useState } from 'react';
import { BarChart3, Key, RefreshCw, Download, Cloud, CloudOff } from 'lucide-react';
import { PAOItem } from '../types';
import { Stats } from './Stats';
import { APIKeysSettings } from './APIKeysSettings';
import { AnkiExport } from './AnkiExport';
import { BackupRestore } from './BackupRestore';
import { DataPull } from './DataPull';
import { isAuthenticated } from '../services/auth';
import { isSyncEnabled, setSyncEnabled } from '../services/preferences';
import { Card, TabGroup, Notice } from './ui';

interface SettingsProps {
  items: PAOItem[];
  onSelect?: (number: number) => void;
  onRestore?: (items: PAOItem[]) => void;
}

type SettingsTab = 'stats' | 'apikeys' | 'sync' | 'export';

export const Settings: React.FC<SettingsProps> = ({ items, onSelect, onRestore }) => {
  const [tab, setTab] = useState<SettingsTab>('stats');

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'apikeys', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync & Data', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="py-2 w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Internal Navigation Tabs */}
      <div>
        <TabGroup<SettingsTab>
          tabs={tabs}
          activeId={tab}
          onChange={setTab}
          size="md"
        />
      </div>

      {/* Tab Content */}
      {tab === 'stats' && <Stats items={items} onSelect={onSelect} />}

      {tab === 'apikeys' && <APIKeysSettings />}

      {tab === 'sync' && (
        <div className="space-y-6">
          {/* Cloud Sync Toggle */}
          {isAuthenticated() ? (
            <SyncToggle />
          ) : (
            <Card variant="paper" padding="lg" className="text-center">
              <CloudOff className="w-8 h-8 mx-auto mb-2 text-steel" />
              <h4 className="font-semibold text-charcoal text-base">Offline Local Mode</h4>
              <p className="text-steel text-xs mt-1">
                Sign in to link devices and sync to cloud storage.
              </p>
            </Card>
          )}

          {/* Data Pull (authenticated only) */}
          {isAuthenticated() && <DataPull />}

          {/* Backup & Restore */}
          {onRestore && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
                Backup & Restore
              </h3>
              <BackupRestore items={items} onRestore={onRestore} />
            </div>
          )}
        </div>
      )}

      {tab === 'export' && <AnkiExport items={items} />}
    </div>
  );
};

function SyncToggle() {
  const [enabled, setEnabled] = useState(() => isSyncEnabled());

  const toggle = () => {
    const next = !enabled;
    setSyncEnabled(next);
    setEnabled(next);
  };

  return (
    <Card variant="paper" padding="md" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-subtle border border-border">
            {enabled ? (
              <Cloud className="w-5 h-5 text-accent" />
            ) : (
              <CloudOff className="w-5 h-5 text-steel" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-charcoal">Cloud Synchronization</h3>
            <p className="text-xs text-steel">
              {enabled
                ? 'Your PAO deck automatically syncs across connected devices.'
                : 'Data is stored locally on this device only.'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
        </label>
      </div>

      {!enabled && (
        <Notice variant="warning">
          With sync disabled, your deck only exists in this browser. Export backups regularly to
          prevent accidental data loss.
        </Notice>
      )}
    </Card>
  );
}
