import React, { useState, useEffect } from 'react';
import { Grid, Settings, Download, Clapperboard, Loader2, Search, Check, BookOpen, Cloud, CloudOff, RefreshCw, Clock, User as UserIcon, LogIn } from 'lucide-react';
import { PAOGrid } from './components/PAOGrid';
import { Stats } from './components/Stats';
import { AnkiExport } from './components/AnkiExport';
import { ReverseLookup } from './components/ReverseLookup';
import { PAOEditor } from './components/PAOEditor';
import { MajorSystemTrainer } from './components/MajorSystemTrainer';
import { VersionManager } from './components/VersionManager';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { PAOItem } from './types';
import { usePAOData } from './hooks';
import { ToastProvider } from './contexts';
import { initializeAuth, onAuthChange, isAuthenticated, getUserDisplayName } from './services/auth';
import { User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initialize auth and listen for changes
  useEffect(() => {
    const unsubscribeAuth = initializeAuth();
    const unsubscribeChange = onAuthChange((user) => {
      setUser(user);
    });
    
    // Cleanup both subscriptions
    return () => {
      unsubscribeAuth();
      unsubscribeChange();
    };
  }, []);

  const handleVersionSwitch = () => {
    reloadActiveVersion();
  };

  const handleAuthSuccess = async () => {
    // Reload data after authentication without full page reload
    try {
      await manualSync(); // Sync to fetch user's data
      await reloadActiveVersion(); // Reload active version
      setShowAuthModal(false);
    } catch (error) {
      console.error('Failed to reload data after auth:', error);
      // Fallback to full reload if sync fails
      window.location.reload();
    }
  };

  const handleSignOut = () => {
    // Clear local state and reload
    // Full reload is acceptable here as user is signing out
    window.location.reload();
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
        <header className="flex-shrink-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-2 md:p-4 shadow-lg w-full overflow-x-auto">
          {/* Single row layout that scrolls horizontally on mobile if needed */}
          <div className="flex items-center gap-2 min-w-max md:min-w-0 md:justify-between">
            {/* Left side: Logo + Version */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-500/20 transform -rotate-6 transition-transform hover:rotate-0">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-base md:text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                MemoDirector
              </h1>
              <VersionManager onVersionSwitch={handleVersionSwitch} />
            </div>

            {/* Right side: Sync + Auth + Navigation */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sync Status */}
              <div className="flex items-center gap-1">
                {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin text-blue-400" />}
                {syncStatus === 'saved' && <Check size={14} className="text-emerald-400" />}
                {syncStatus === 'pending' && <Clock size={14} className="text-amber-400" />}
                {syncStatus === 'error' && <CloudOff size={14} className="text-red-400" />}
                {syncStatus === 'idle' && !hasPendingSync && lastSyncTime && <Cloud size={14} className="text-slate-500" />}

                <button
                  onClick={manualSync}
                  disabled={syncStatus === 'syncing'}
                  className={`p-1.5 rounded-md transition-all ${hasPendingSync
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={hasPendingSync ? 'Sync pending changes to remote persistence' : 'Sync to remote persistence'}
                >
                  <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Auth/Profile Button */}
              {isAuthenticated() ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="p-1.5 rounded-md transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  title="View your profile, API keys, and account settings"
                >
                  <UserIcon size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="p-1.5 rounded-md transition-all bg-indigo-600 hover:bg-indigo-500 text-white"
                  title="Sign in to sync your PAO data across devices"
                >
                  <LogIn size={18} />
                </button>
              )}

              {/* Navigation Tabs */}
              <div className="flex gap-0.5 bg-slate-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveTab(Tab.GRID)}
                  className={`p-1.5 md:p-2 rounded-md transition-all ${activeTab === Tab.GRID ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Studio Grid - View and edit your 100 PAO cards"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setActiveTab(Tab.REVERSE)}
                  className={`p-1.5 md:p-2 rounded-md transition-all ${activeTab === Tab.REVERSE ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Casting Search - Find celebrities and assign to numbers"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setActiveTab(Tab.SYSTEM)}
                  className={`p-1.5 md:p-2 rounded-md transition-all ${activeTab === Tab.SYSTEM ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Major System - Learn phonetic number encoding"
                >
                  <BookOpen size={18} />
                </button>
                <button
                  onClick={() => setActiveTab(Tab.STATS)}
                  className={`p-1.5 md:p-2 rounded-md transition-all ${activeTab === Tab.STATS ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Settings & Stats - View progress and manage data"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => setActiveTab(Tab.EXPORT)}
                  className={`p-1.5 md:p-2 rounded-md transition-all ${activeTab === Tab.EXPORT ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Export - Download your PAO data for Anki"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
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

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* User Profile Modal */}
        <UserProfile
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSignOut={handleSignOut}
        />
      </div>
    </ToastProvider>
  );
}