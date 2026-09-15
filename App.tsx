import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Grid, Search, BookOpen, Settings as SettingsIcon, Clapperboard, Loader2, Check, Cloud, CloudOff, RefreshCw, Clock, User as UserIcon, LogIn } from 'lucide-react';
import { PAOGrid } from './components/PAOGrid';
import { VersionManager } from './components/VersionManager';
import { PAOItem } from './types';
import { usePAOData } from './hooks';
import { ToastProvider } from './contexts';
import { initializeAuth, onAuthChange, isAuthenticated, getUserDisplayName, isAnonymousMode } from './services/auth';
import { User } from '@supabase/supabase-js';
import { Button, Badge, TabGroup } from './components/ui';

const Settings = React.lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const ReverseLookup = React.lazy(() => import('./components/ReverseLookup').then(m => ({ default: m.ReverseLookup })));
const Landing = React.lazy(() => import('./components/Landing').then(m => ({ default: m.Landing })));
const PAOEditor = React.lazy(() => import('./components/PAOEditor').then(m => ({ default: m.PAOEditor })));
const MajorSystemTrainer = React.lazy(() => import('./components/MajorSystemTrainer').then(m => ({ default: m.MajorSystemTrainer })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));

enum Tab {
  GRID = 'GRID',
  REVERSE = 'REVERSE',
  SYSTEM = 'SYSTEM',
  SETTINGS = 'SETTINGS',
}

export default function App() {
  const { items, loading, syncStatus, lastSyncTime, hasPendingSync, manualSync, updateItem, updateItems, reloadActiveVersion } = usePAOData();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GRID);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [prefillPerson, setPrefillPerson] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    try { return localStorage.getItem('md_landing') !== 'true'; } catch { return true; }
  });

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

  // Example PAO data for onboarding
  const handleLoadExample = useCallback(() => {
    const now = Date.now();
    const examples: PAOItem[] = [
      { number: 0, person: 'Zeus', action: 'Thundering', object: 'Lightning', scene: 'Zeus hurls a crackling lightning bolt from Mount Olympus, splitting the sky with deafening thunder.', completed: true, lastModified: now },
      { number: 1, person: 'Superman', action: 'Soaring', object: 'Cape', scene: 'Superman rockets through clouds, red cape rippling behind him as he scans the city below with x-ray vision.', completed: true, lastModified: now },
      { number: 14, person: 'Thor', action: 'Swinging', object: 'Hammer', scene: 'Thor spins Mjolnir above his head, storm clouds gathering as lightning arcs across the sky.', completed: true, lastModified: now },
      { number: 34, person: 'Mario', action: 'Jumping', object: 'Mushroom', scene: 'Mario bounces off a giant red mushroom, coins scattering everywhere as he lands with a triumphant "Wahoo!"', completed: true, lastModified: now },
      { number: 52, person: 'Leonardo', action: 'Painting', object: 'Canvas', scene: 'Leonardo da Vinci carefully applies paint to a massive canvas, the Mona Lisa\'s enigmatic smile emerging under his brush.', completed: true, lastModified: now },
      { number: 77, person: 'Cookie Monster', action: 'Devouring', object: 'Cookie', scene: 'Cookie Monster demolishes a giant chocolate chip cookie, crumbs exploding everywhere as he shouts "ME WANT MORE!"', completed: true, lastModified: now },
    ];
    const merged = items.map(item => {
      const ex = examples.find(e => e.number === item.number);
      return ex || item;
    });
    updateItems(merged);
  }, [items, updateItems]);

  const handleEnterApp = () => {
    localStorage.setItem('md_landing', 'true');
    setShowLanding(false);
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
      {showLanding ? (
        <Suspense fallback={<div className="min-h-screen bg-canvas flex items-center justify-center text-steel"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
          <Landing onEnter={handleEnterApp} />
        </Suspense>
      ) : (
      <div className="h-screen flex flex-col w-full bg-canvas text-charcoal overflow-hidden font-sans">
        {/* Header */}
        <header className="flex-shrink-0 z-30 bg-surface border-b border-border p-2 md:p-3 shadow-sm w-full overflow-x-auto">
          {/* Single row layout that scrolls horizontally on mobile if needed */}
          <div className="flex items-center gap-3 min-w-max md:min-w-0 md:justify-between max-w-7xl mx-auto">
            {/* Left side: Logo + Version */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="bg-accent text-surface p-1.5 rounded-lg shadow-sm">
                <Clapperboard className="w-5 h-5" />
              </div>
              <h1 className="text-lg md:text-xl font-display font-bold tracking-tight text-charcoal">
                MemoDirector
              </h1>
              <VersionManager onVersionSwitch={handleVersionSwitch} />
            </div>

            {/* Right side: Sync + Auth + Navigation */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Sync Status */}
              <div className="flex items-center gap-1.5">
                {syncStatus === 'syncing' && <Loader2 size={15} className="animate-spin text-accent" />}
                {syncStatus === 'saved' && <Check size={15} className="text-accent" />}
                {syncStatus === 'pending' && <Clock size={15} className="text-conflict" />}
                {syncStatus === 'error' && <CloudOff size={15} className="text-danger" />}
                {syncStatus === 'idle' && !hasPendingSync && lastSyncTime && <Cloud size={15} className="text-steel" />}

                <Button
                  variant={hasPendingSync ? 'accent' : 'ghost'}
                  size="sm"
                  onClick={manualSync}
                  disabled={syncStatus === 'syncing'}
                  className="h-8 w-8 p-0"
                  title={hasPendingSync ? 'Sync pending changes to remote persistence' : 'Sync to remote persistence'}
                  icon={<RefreshCw size={15} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />}
                />
              </div>

              {/* Auth/Profile Button */}
              {!isAuthenticated() && (
                <Badge variant="subtle" size="sm" className="hidden sm:inline-flex">
                  Offline Mode
                </Badge>
              )}
              {isAuthenticated() ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileModal(true)}
                  className="h-8 w-8 p-0"
                  title="View your profile, API keys, and account settings"
                  icon={<UserIcon size={16} />}
                />
              ) : (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  title="Sign in to sync your PAO data across devices"
                  icon={<LogIn size={15} />}
                >
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}

              {/* Navigation Tabs */}
              <TabGroup<Tab>
                tabs={[
                  { id: Tab.GRID, label: <span className="hidden sm:inline">Grid</span>, title: 'Studio Grid', icon: <Grid size={15} /> },
                  { id: Tab.REVERSE, label: <span className="hidden sm:inline">Search</span>, title: 'Talent Scout', icon: <Search size={15} /> },
                  { id: Tab.SYSTEM, label: <span className="hidden sm:inline">System</span>, title: 'Major System', icon: <BookOpen size={15} /> },
                  { id: Tab.SETTINGS, label: <span className="hidden sm:inline">Settings</span>, title: 'Settings', icon: <SettingsIcon size={15} /> },
                ]}
                activeId={activeTab}
                onChange={setActiveTab}
                size="sm"
              />
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
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                {activeTab === Tab.GRID && (
                  <PAOGrid
                    items={items}
                    onSelect={(num) => setSelectedNumber(num)}
                    onLoadExample={handleLoadExample}
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
                {activeTab === Tab.SETTINGS && <Settings items={items} onSelect={(num) => setSelectedNumber(num)} onRestore={updateItems} />}
              </Suspense>
            )}
          </div>
        </main>

        {/* Editor Modal */}
        {selectedNumber !== null && (
          <Suspense fallback={null}>
            <PAOEditor
              number={selectedNumber}
              initialData={getEditorInitialData()}
              onClose={handleCloseEditor}
              onSave={updateItem}
              allItems={items}
            />
          </Suspense>
        )}

        {/* Auth Modal */}
        <Suspense fallback={null}>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        </Suspense>

        {/* User Profile Modal */}
        <Suspense fallback={null}>
          <UserProfile
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onSignOut={handleSignOut}
          />
        </Suspense>
      </div>
      )}
    </ToastProvider>
  );
}