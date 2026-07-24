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

interface SettingsProps {
  items: PAOItem[];
  onSelect?: (number: number) => void;
  onRestore?: (items: PAOItem[]) => void;
}

type SettingsTab = 'stats' | 'apikeys' | 'sync' | 'export';

export const Settings: React.FC<SettingsProps> = ({ items, onSelect, onRestore }) => {
  const [tab, setTab] = useState<SettingsTab>('stats');

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={16} /> },
    { id: 'apikeys', label: 'API Keys', icon: <Key size={16} /> },
    { id: 'sync', label: 'Sync & Data', icon: <RefreshCw size={16} /> },
    { id: 'export', label: 'Export', icon: <Download size={16} /> },
  ];

  return (
    <div className="py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mx-auto">
      {/* Internal tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' && <Stats items={items} onSelect={onSelect} />}

      {tab === 'apikeys' && <APIKeysSettings />}

      {tab === 'sync' && (
        <div className="space-y-6">
          {/* Cloud Sync Toggle */}
          {isAuthenticated() ? (
            <SyncToggle />
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
              <CloudOff size={32} className="mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400 text-sm">Sign in to enable cloud sync</p>
            </div>
          )}

          {/* Data Pull (authenticated only) */}
          {isAuthenticated() && <DataPull />}

          {/* Backup & Restore */}
          {onRestore && (
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Backup & Restore</h3>
              <BackupRestore items={items} onRestore={onRestore} />
            </div>
          )}
        </div>
      )}

      {tab === 'export' && <AnkiExport items={items} />}
    </div>
  );
};

/** Cloud sync toggle card — extracted for reuse */
function SyncToggle() {
  const [enabled, setEnabled] = useState(() => isSyncEnabled());

  const toggle = () => {
    const next = !enabled;
    setSyncEnabled(next);
    setEnabled(next);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-indigo-600/20' : 'bg-slate-700/50'}`}>
            {enabled ? (
              <Cloud className="w-5 h-5 text-indigo-400" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Cloud Sync</h3>
            <p className="text-sm text-slate-400">
              {enabled
                ? 'Data syncs automatically to remote persistence'
                : 'Data stored locally only'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            enabled ? 'bg-indigo-600' : 'bg-slate-600'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {!enabled && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
          <p className="text-xs text-amber-300">
            <strong>Note:</strong> With sync disabled, your data only exists on this device.
            Enable sync to back up and access from other devices.
          </p>
        </div>
      )}
    </div>
  );
}
