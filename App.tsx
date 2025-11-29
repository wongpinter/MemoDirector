import React, { useState } from 'react';
import { Grid, Settings, Download, Clapperboard, Loader2, Search, Check, BookOpen, Cloud, CloudOff, RefreshCw, Clock } from 'lucide-react';
import { PAOGrid } from './components/PAOGrid';
import { Stats } from './components/Stats';
import { AnkiExport } from './components/AnkiExport';
import { ReverseLookup } from './components/ReverseLookup';
import { PAOEditor } from './components/PAOEditor';
import { MajorSystemTrainer } from './components/MajorSystemTrainer';
import { VersionManager } from './components/VersionManager';
import { PAOItem } from './types';
import { usePAOData } from './hooks';
import { ToastProvider } from './contexts';

enum Tab {
  GRID = 'GRID',
  STATS = 'STATS',
  EXPORT = 'EXPORT',
  REVERSE = 'REVERSE',
  SYSTEM = 'SYSTEM'
}

export default function App() {
  const { items, loading, syncStatus, lastSyncTime, hasPendingSync, manualSync, updateItem, updateItems, reloadActiveVersion } = usePAOData();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GRID);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [prefillPerson, setPrefillPerson] = useState<string | undefined>(undefined);

  const handleVersionSwitch = () => {
    reloadActiveVersion();
  };

  const handleReverseAssign = (number: number, name: string) => {
    setSelectedNumber(number);
    setPrefillPerson(name);
    // Editor will open due to selectedNumber not null
  };

  const handleQuickAdd = (number: number, person: string) => {
    const existing = items.find(i => i.number === number);
    if (existing) {
        const updated: PAOItem = {
            ...existing,
            person: person,
            // Update completion status based on whether other fields already existed
            completed: !!(person && existing.action && existing.object)
        };
        updateItem(updated);
    }
  };

  const handleCloseEditor = () => {
    setSelectedNumber(null);
    setPrefillPerson(undefined);
  };

  // Construct initial data for the editor
  const getEditorInitialData = () => {
    if (selectedNumber === null) return undefined;
    
    const existing = items.find(i => i.number === selectedNumber);
    
    // If we have a prefill Person coming from Reverse Lookup, we merge it
    if (prefillPerson && existing) {
        return {
            ...existing,
            person: prefillPerson
        };
    }
    
    return existing;
  };

  return (
    <ToastProvider>
      <div className="h-screen flex flex-col w-full bg-slate-900 text-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between shadow-lg w-full">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-indigo-500/20 transform -rotate-6 transition-transform hover:rotate-0">
            <Clapperboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              MemoDirector
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-widest uppercase hidden xs:block">Cast &bull; Direct &bull; Remember</p>
          </div>
          <div className="ml-2 sm:ml-4">
            <VersionManager onVersionSwitch={handleVersionSwitch} />
          </div>
        </div>
        
        {/* Sync Status Indicator */}
        <div className="flex-1 flex justify-end px-2 sm:px-4 items-center gap-2">
            {/* Status Display */}
            <div className={`flex items-center gap-2 text-xs font-mono transition-all duration-300`}>
                {syncStatus === 'syncing' && (
                    <span className="flex items-center gap-1.5 text-blue-400">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="hidden sm:inline">Syncing to Cloud...</span>
                    </span>
                )}
                {syncStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <Check size={12} />
                        <span className="hidden sm:inline">Synced</span>
                    </span>
                )}
                {syncStatus === 'pending' && (
                    <span className="flex items-center gap-1.5 text-amber-400">
                        <Clock size={12} />
                        <span className="hidden sm:inline">Pending Sync</span>
                    </span>
                )}
                {syncStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-red-400">
                        <CloudOff size={12} />
                        <span className="hidden sm:inline">Sync Error</span>
                    </span>
                )}
                {syncStatus === 'idle' && !hasPendingSync && lastSyncTime && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <Cloud size={12} />
                        <span className="hidden sm:inline">
                            {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </span>
                )}
            </div>
            
            {/* Manual Sync Button */}
            <button
                onClick={manualSync}
                disabled={syncStatus === 'syncing'}
                className={`p-1.5 sm:p-2 rounded-md transition-all ${
                    hasPendingSync 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={hasPendingSync ? 'Sync pending changes to Firebase' : 'Sync to Firebase'}
            >
                <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            </button>
        </div>
        
        <div className="flex gap-0.5 sm:gap-1 bg-slate-800 p-0.5 sm:p-1 rounded-lg flex-shrink-0">
          <button 
            onClick={() => setActiveTab(Tab.GRID)}
            className={`p-1.5 sm:p-2 rounded-md transition-all ${activeTab === Tab.GRID ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            title="Studio Grid"
          >
            <Grid size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setActiveTab(Tab.REVERSE)}
            className={`p-1.5 sm:p-2 rounded-md transition-all ${activeTab === Tab.REVERSE ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            title="Casting Search"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>
           <button 
            onClick={() => setActiveTab(Tab.SYSTEM)}
            className={`p-1.5 sm:p-2 rounded-md transition-all ${activeTab === Tab.SYSTEM ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            title="Learn Major System"
          >
            <BookOpen size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setActiveTab(Tab.STATS)}
            className={`p-1.5 sm:p-2 rounded-md transition-all ${activeTab === Tab.STATS ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            title="Production Stats"
          >
            <Settings size={18} className="sm:w-5 sm:h-5" /> 
          </button>
          <button 
            onClick={() => setActiveTab(Tab.EXPORT)}
            className={`p-1.5 sm:p-2 rounded-md transition-all ${activeTab === Tab.EXPORT ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            title="Distribution (Export)"
          >
            <Download size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-4 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Opening Studio...</p>
          </div>
        ) : (
          <>
            {activeTab === Tab.GRID && (
              <PAOGrid 
                items={items} 
                onSelect={(num) => setSelectedNumber(num)} 
              />
            )}
            {activeTab === Tab.REVERSE && (
                <ReverseLookup 
                    items={items} 
                    onAssign={handleReverseAssign} 
                    onQuickAdd={handleQuickAdd}
                />
            )}
            {activeTab === Tab.SYSTEM && <MajorSystemTrainer />}
            {activeTab === Tab.STATS && <Stats items={items} onSelect={(num) => setSelectedNumber(num)} onRestore={updateItems} />}
            {activeTab === Tab.EXPORT && <AnkiExport items={items} />}
          </>
        )}
        </div>
      </main>

      {/* Editor Modal */}
      {selectedNumber !== null && (
        <PAOEditor
          number={selectedNumber}
          initialData={getEditorInitialData()}
          onClose={handleCloseEditor}
          onSave={updateItem}
          allItems={items}
        />
      )}
      </div>
    </ToastProvider>
  );
}