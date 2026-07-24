/**
 * User preferences — app-level settings persisted per-user in localStorage.
 */

import { getCurrentUserId, isAnonymousMode } from './auth';
import { STORAGE_KEYS } from '../constants';

function _key(): string {
  return `${STORAGE_KEYS.SYNC_ENABLED}_${getCurrentUserId()}`;
}

/** True if cloud sync is explicitly enabled for this user. Always false for anonymous. */
export function isSyncEnabled(): boolean {
  if (isAnonymousMode()) return false;
  return localStorage.getItem(_key()) === 'true';
}

/** Enable or disable cloud sync for this user. No-op for anonymous. */
export function setSyncEnabled(enabled: boolean): void {
  if (isAnonymousMode()) return;
  localStorage.setItem(_key(), enabled ? 'true' : 'false');
}
