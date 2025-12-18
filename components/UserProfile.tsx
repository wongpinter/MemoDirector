import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, Shield, Key, X } from 'lucide-react';
import { getCurrentUser, signOut, getUserDisplayName, getUserEmail, isAnonymousMode } from '../services/auth';
import { APIKeysSettings } from './APIKeysSettings';
import { DataPull } from './DataPull';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserProfile({ isOpen, onClose, onSignOut }: UserProfileProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'apikeys'>('profile');

  useEffect(() => {
    if (isOpen) {
      setUser(getCurrentUser());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      onSignOut();
      onClose();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const anonymousMode = isAnonymousMode();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ zIndex: 9999 }}>
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User size={24} className="text-indigo-400" />
            {anonymousMode ? 'Settings' : 'Profile & Settings'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${activeTab === 'profile'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <User size={18} className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${activeTab === 'apikeys'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <Key size={18} className="inline mr-2" />
            API Keys
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {anonymousMode ? (
                <div className="bg-amber-950/20 border border-amber-600/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Shield size={24} className="text-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-amber-300 mb-2">Anonymous Mode</h3>
                      <p className="text-amber-200/80 text-sm mb-4">
                        You're using the app without authentication. Your data is stored locally on this device only.
                      </p>
                      <div className="space-y-2 text-sm text-amber-200/70">
                        <p>• Data is not synced across devices</p>
                        <p>• No cloud backup available</p>
                        <p>• Sign in to enable multi-device sync</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* User Info Card */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{getUserDisplayName()}</h3>
                        <p className="text-slate-400 text-sm">{getUserEmail()}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail size={16} className="text-slate-500" />
                        <span className="text-slate-400">Email:</span>
                        <span className="text-white">{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar size={16} className="text-slate-500" />
                        <span className="text-slate-400">Member since:</span>
                        <span className="text-white">{formatDate(user?.metadata.creationTime || null)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Shield size={16} className="text-slate-500" />
                        <span className="text-slate-400">User ID:</span>
                        <span className="text-white font-mono text-xs">{user?.uid || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Sync Info */}
                  <div className="bg-blue-950/20 border border-blue-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="font-semibold mb-1">Your Data is Private</p>
                        <ul className="space-y-1 text-blue-200/80">
                          <li>• Your PAO data is stored in your own remote persistence space</li>
                          <li>• No other users can access your data</li>
                          <li>• Syncs automatically across your devices</li>
                          <li>• API keys are stored locally, never on our servers</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Data Management Section */}
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-100 mb-4">Data Management</h3>
                    <DataPull onPullComplete={() => {
                      // Optionally reload or refresh
                      window.location.reload();
                    }} />
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'apikeys' && (
            <APIKeysSettings />
          )}
        </div>
      </div>
    </div>
  );
}
