import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, Shield, X } from 'lucide-react';
import { getCurrentUser, signOut, getUserDisplayName, getUserEmail, isAnonymousMode } from '../services/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserProfile({ isOpen, onClose, onSignOut }: UserProfileProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);

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
      day: 'numeric',
    });
  };

  const anonymousMode = isAnonymousMode();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ zIndex: 9999 }}>
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={22} className="text-indigo-400" />
            Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {anonymousMode ? (
            <div className="bg-amber-950/20 border border-amber-600/30 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield size={24} className="text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-amber-300 mb-2">Offline Mode</h3>
                  <p className="text-amber-200/80 text-sm mb-4">
                    You're using the app without an account. Data is stored locally on this device.
                  </p>
                  <ul className="space-y-2 text-sm text-amber-200/70">
                    <li>• No cross-device sync</li>
                    <li>• No cloud backup</li>
                    <li>• Sign in to enable sync</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                    <span className="text-white">{formatDate(user?.created_at || null)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield size={16} className="text-slate-500" />
                    <span className="text-slate-400">ID:</span>
                    <span className="text-white font-mono text-xs">{user?.id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* API Keys and data tools moved to Settings tab */}
              <div className="text-xs text-slate-500 text-center">
                API Keys, sync, backup, and export are in <strong>Settings</strong>
              </div>

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
      </div>
    </div>
  );
}
