/**
 * Authentication Service
 * Handles user authentication with Firebase Auth
 * Provides user-specific data isolation for multi-tenant support
 */

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getApps } from 'firebase/app';
import { STORAGE_KEYS } from '../constants';

let auth: Auth | null = null;
let authInitAttempted = false;

/**
 * Initialize Firebase Auth
 * Only attempts once per session to avoid log spam
 */
export function initializeAuth(): Auth | null {
  // Only attempt initialization once
  if (authInitAttempted) {
    return auth;
  }
  authInitAttempted = true;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      auth = getAuth(apps[0]);
      console.log('✅ Firebase Auth initialized');
      return auth;
    }
    console.log('ℹ️ Firebase not initialized, auth unavailable');
    return null;
  } catch (error) {
    console.error('❌ Failed to initialize auth:', error);
    return null;
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    initializeAuth();
  }
  return auth?.currentUser || null;
}

/**
 * Get current user ID (for database paths)
 */
export function getCurrentUserId(): string {
  const user = getCurrentUser();
  return user?.uid || 'anonymous';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, displayName?: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    console.log('✅ User signed up:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign up failed:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User signed in:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign in failed:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    console.log('✅ User signed in with Google:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google sign in failed:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    await firebaseSignOut(auth);
    console.log('✅ User signed out');
  } catch (error) {
    console.error('❌ Sign out failed:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
  } catch (error: any) {
    console.error('❌ Password reset failed:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    initializeAuth();
  }

  if (!auth) {
    // Auth unavailable (Firebase not configured) - return no-op cleanup
    return () => { };
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Get user-friendly error messages
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

/**
 * Get user display name or email
 */
export function getUserDisplayName(): string {
  const user = getCurrentUser();
  if (!user) return 'Guest';
  return user.displayName || user.email || 'User';
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  const user = getCurrentUser();
  return user?.email || null;
}

/**
 * Check if running in anonymous mode (no Firebase or no authenticated user)
 */
export function isAnonymousMode(): boolean {
  return getCurrentUserId() === 'anonymous';
}

/**
 * Get user-scoped storage key for sync preference
 */
function getSyncStorageKey(): string {
  const userId = getCurrentUserId();
  return `${STORAGE_KEYS.SYNC_ENABLED}_${userId}`;
}

/**
 * Check if cloud sync is enabled for the current user
 * Returns false for anonymous users or if not explicitly enabled
 */
export function isSyncEnabled(): boolean {
  // Anonymous users never have sync enabled
  if (isAnonymousMode()) {
    return false;
  }

  const value = localStorage.getItem(getSyncStorageKey());
  return value === 'true';
}

/**
 * Enable or disable cloud sync for the current user
 */
export function setSyncEnabled(enabled: boolean): void {
  if (isAnonymousMode()) {
    console.warn('Cannot enable sync for anonymous users');
    return;
  }

  localStorage.setItem(getSyncStorageKey(), enabled ? 'true' : 'false');
  console.log(`✅ Cloud sync ${enabled ? 'enabled' : 'disabled'}`);
}
