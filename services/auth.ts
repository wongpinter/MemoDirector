/**
 * Authentication Service
 * Handles user authentication with Supabase Auth
 * Provides user-specific data isolation for multi-tenant support
 */

import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

let currentUser: User | null = null;
let broadcastAuthChange: ((user: User | null) => void) | null = null;
let isAuthInitialized = false;
let authInitPromise: Promise<void> | null = null;

/**
 * Initialize Auth listener and return unsubscribe function.
 * No-op when Supabase is not configured (offline mode).
 */
export function initializeAuth(): () => void {
  if (!supabase) {
    isAuthInitialized = true;
    console.log('🔒 Supabase not configured — running in offline mode.');
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    if (event === 'SIGNED_IN') {
      console.log('✅ User signed in:', currentUser?.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('✅ User signed out');
    }

    if (broadcastAuthChange) {
      broadcastAuthChange(currentUser);
    }
    
    isAuthInitialized = true;
  });

  // Initial check with error handling
  if (!authInitPromise) {
    authInitPromise = supabase!.auth.getSession()
      .then(({ data: { session } }) => {
        currentUser = session?.user || null;
        if (broadcastAuthChange) {
          broadcastAuthChange(currentUser);
        }
        isAuthInitialized = true;
      })
      .catch((err) => {
        console.error('❌ Auth initialization error:', err);
        isAuthInitialized = true; // Mark as initialized even on error
      });
  }

  return () => subscription.unsubscribe();
}

/**
 * Check if auth is initialized
 */
export function isAuthReady(): boolean {
  return isAuthInitialized;
}

/**
 * Wait for auth to initialize
 */
export async function waitForAuth(): Promise<void> {
  if (isAuthInitialized) return;
  if (authInitPromise) {
    await authInitPromise;
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Get current user ID (for database paths)
 */
export function getCurrentUserId(): string {
  return currentUser?.id || 'anonymous';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, displayName?: string): Promise<{ user: User; session: Session | null }> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    console.error('❌ Sign up failed:', error);
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign up successful but no user returned');
  }

  return { user: data.user, session: data.session };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Sign in failed:', error);
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign in successful but no user returned');
  }

  return data.user;
}



/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('❌ Sign out failed:', error);
    throw new Error(error.message);
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('❌ Password reset failed:', error);
    throw new Error(error.message);
  }
  console.log('✅ Password reset email sent to:', email);
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!supabase) {
    callback(null);
    return () => { broadcastAuthChange = null; };
  }
  broadcastAuthChange = callback;
  if (!currentUser) {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        currentUser = session?.user || null;
        callback(currentUser);
      })
      .catch((err) => {
        console.error('❌ Error getting session:', err);
        callback(null); // Call with null on error
      });
  } else {
    callback(currentUser);
  }

  // Return a cleanup function
  return () => {
    broadcastAuthChange = null;
  };
}

/**
 * Get user display name or email
 */
export function getUserDisplayName(): string {
  if (!currentUser) return 'Guest';
  // Supabase stores extra data in user_metadata
  return currentUser.user_metadata?.display_name || currentUser.email || 'User';
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  return currentUser?.email || null;
}

/**
 * Check if running in anonymous mode
 */
export function isAnonymousMode(): boolean {
  return getCurrentUserId() === 'anonymous';
}


