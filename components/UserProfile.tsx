import React, { useState, useEffect } from 'react';
import { User, LogOut, Mail, Calendar, Shield } from 'lucide-react';
import {
  getCurrentUser,
  signOut,
  getUserDisplayName,
  getUserEmail,
  isAnonymousMode,
} from '../services/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Modal, Button, Card, Notice } from './ui';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          <span className="font-display font-bold text-xl text-charcoal">Account Profile</span>
        </div>
      }
      subtitle="View profile status and authentication details"
      maxWidth="md"
    >
      <div className="space-y-4">
        {anonymousMode ? (
          <Notice variant="info" title="Offline Mode Active">
            <p className="mt-1">
              You are using MemoDirector locally on this browser. Sign in or create an account to
              sync your deck across devices.
            </p>
          </Notice>
        ) : (
          <>
            <Card variant="subtle" padding="md" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent text-surface flex items-center justify-center font-display font-bold text-xl">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal text-base">{getUserDisplayName()}</h3>
                  <p className="text-steel text-xs">{getUserEmail()}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center justify-between text-steel">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-medium text-charcoal">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-steel">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Member Since
                  </span>
                  <span className="font-medium text-charcoal">
                    {formatDate(user?.created_at || null)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-steel">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Account ID
                  </span>
                  <span className="font-mono text-charcoal truncate max-w-xs">{user?.id || 'N/A'}</span>
                </div>
              </div>
            </Card>

            <Button
              variant="danger"
              size="md"
              onClick={handleSignOut}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full"
            >
              Sign Out
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
