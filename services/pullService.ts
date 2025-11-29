/**
 * Pull Service
 * Handles one-time data pull from Firebase to local storage for new devices
 * Allows users to restore their PAO data when signing in on a new device
 */

import { PAOItem, PAOVersion } from '../types';
import { loadPAOList, loadVersions as loadVersionsFromFirebase } from './db';
import { saveVersions, getActiveVersion, createDefaultVersion } from './versionManager';
import { saveToLocalStorage } from './syncQueue';
import { isAnonymousMode } from './auth';

export interface PullResult {
  success: boolean;
  itemsCount: number;
  versionsCount: number;
  error?: string;
  message?: string;
}

/**
 * Pull PAO data from Firebase to local storage
 * This is a one-time operation for new devices
 * Returns the pulled items
 */
export async function pullPAODataFromServer(): Promise<PullResult> {
  try {
    // Check if user is authenticated
    if (isAnonymousMode()) {
      return {
        success: false,
        itemsCount: 0,
        versionsCount: 0,
        error: 'User must be authenticated to pull data from server'
      };
    }

    // Check if local data already exists
    const existingLocalData = localStorage.getItem('pao_data');
    if (existingLocalData) {
      try {
        const parsed = JSON.parse(existingLocalData);
        if (parsed && parsed.length > 0) {
          return {
            success: false,
            itemsCount: 0,
            versionsCount: 0,
            error: 'Local data already exists. Use sync to merge data instead.',
            message: 'To pull fresh data from server, clear local storage first.'
          };
        }
      } catch (e) {
        // Invalid JSON, proceed with pull
      }
    }

    console.log('🔄 Starting pull from Firebase...');

    // 1. Pull versions from Firebase
    let versions: PAOVersion[] = [];
    let pulledItems: PAOItem[] = [];

    try {
      versions = await loadVersionsFromFirebase();
      console.log(`✅ Pulled ${versions.length} versions from Firebase`);
    } catch (error) {
      console.log('ℹ️ No versions found in Firebase, attempting to pull legacy data');
    }

    // 2. If versions exist, save them and use active version
    if (versions.length > 0) {
      saveVersions(versions);
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        pulledItems = activeVersion.items;
        console.log(`✅ Using active version: ${activeVersion.name}`);
      }
    } else {
      // 3. Fallback: pull legacy PAO list from Firebase
      try {
        pulledItems = await loadPAOList();
        console.log(`✅ Pulled ${pulledItems.length} items from Firebase`);

        // Create a default version from the pulled data
        if (pulledItems.length > 0) {
          createDefaultVersion(pulledItems);
          console.log('✅ Created default version from pulled data');
        }
      } catch (error) {
        console.error('❌ Failed to pull data from Firebase:', error);
        return {
          success: false,
          itemsCount: 0,
          versionsCount: 0,
          error: 'Failed to pull data from server. Please check your connection.'
        };
      }
    }

    // 4. Save pulled data to local storage
    if (pulledItems.length > 0) {
      saveToLocalStorage(pulledItems);
      console.log(`✅ Saved ${pulledItems.length} items to local storage`);
    }

    return {
      success: true,
      itemsCount: pulledItems.length,
      versionsCount: versions.length,
      message: `Successfully pulled ${pulledItems.length} PAO items and ${versions.length} versions from server`
    };
  } catch (error) {
    console.error('❌ Pull operation failed:', error);
    return {
      success: false,
      itemsCount: 0,
      versionsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error during pull operation'
    };
  }
}

/**
 * Check if user has data on the server
 * Useful for determining if pull is available
 */
export async function checkServerData(): Promise<{
  hasData: boolean;
  itemsCount: number;
  versionsCount: number;
  error?: string;
}> {
  try {
    if (isAnonymousMode()) {
      return {
        hasData: false,
        itemsCount: 0,
        versionsCount: 0,
        error: 'User must be authenticated'
      };
    }

    let itemsCount = 0;
    let versionsCount = 0;

    // Check versions
    try {
      const versions = await loadVersionsFromFirebase();
      versionsCount = versions.length;
      if (versions.length > 0) {
        const activeVersion = versions.find(v => v.isActive);
        if (activeVersion) {
          itemsCount = activeVersion.items.length;
        }
      }
    } catch (e) {
      // No versions, try legacy data
    }

    // If no versions, check legacy data
    if (itemsCount === 0) {
      try {
        const items = await loadPAOList();
        itemsCount = items.length;
      } catch (e) {
        // No data
      }
    }

    return {
      hasData: itemsCount > 0 || versionsCount > 0,
      itemsCount,
      versionsCount
    };
  } catch (error) {
    return {
      hasData: false,
      itemsCount: 0,
      versionsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear local data (useful before pulling fresh data)
 */
export function clearLocalData(): void {
  try {
    localStorage.removeItem('pao_data');
    localStorage.removeItem('pao_versions');
    localStorage.removeItem('pao_sync_queue');
    localStorage.removeItem('pao_last_sync');
    console.log('✅ Local data cleared');
  } catch (error) {
    console.error('❌ Failed to clear local data:', error);
    throw error;
  }
}
