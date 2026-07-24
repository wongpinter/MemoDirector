/**
 * Pull Service
 * Handles one-time data pull from Firebase to local storage for new devices
 * Allows users to restore their PAO data when signing in on a new device
 */

import { PAOItem, PAOVersion } from '../types';
import { loadPAOListFromFirebase, loadVersions as loadVersionsFromFirebase } from './db';
import { save, getActiveVersion, createVersion, importVersions } from './paoStore';
import { getCurrentUserId, isAnonymousMode } from './auth';

const namespacedKey = (base: string) => `${base}_${getCurrentUserId()}`;

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

    // Check if local data already exists for the current user
    const dataKey = namespacedKey('pao_data');
    const versionsKey = namespacedKey('pao_versions');
    const existingLocalData = localStorage.getItem(dataKey);
    const existingVersions = localStorage.getItem(versionsKey);

    // If there's existing data and it's not empty, check if we should proceed
    if ((existingLocalData && JSON.parse(existingLocalData)?.length > 0) ||
      (existingVersions && existingVersions !== '[]' && existingVersions !== null)) {
      return {
        success: false,
        itemsCount: 0,
        versionsCount: 0,
        error: 'Local data already exists. Use sync to merge data instead.',
        message: 'To pull fresh data from server, clear local storage first.'
      };
    }

    // Verify that the user actually has data on the server
    let serverHasData = false;
    try {
      const { versions: serverVersions } = await loadVersionsFromFirebase();
      if (serverVersions.length > 0) {
        serverHasData = true;
      } else {
        // Check if legacy data exists
        const serverLegacyData = await loadPAOListFromFirebase();
        if (serverLegacyData.length > 0) {
          serverHasData = true;
        }
      }
    } catch (error) {
      console.error('Error checking server data:', error);
      return {
        success: false,
        itemsCount: 0,
        versionsCount: 0,
        error: 'Failed to verify server data. Please check your connection.'
      };
    }

    if (!serverHasData) {
      return {
        success: false,
        itemsCount: 0,
        versionsCount: 0,
        error: 'No data found on server for this user.'
      };
    }

    console.log('🔄 Starting pull from Firebase...');

    // 1. Pull versions from Firebase
    let versions: PAOVersion[] = [];
    let pulledItems: PAOItem[] = [];

    try {
      const { versions: loadedVersions } = await loadVersionsFromFirebase();
      versions = loadedVersions;
      console.log(`✅ Pulled ${versions.length} versions from Firebase`);
    } catch (error) {
      console.log('ℹ️ No versions found in Firebase, attempting to pull legacy data');
    }

    // 2. If versions exist, import them and use active version
    if (versions.length > 0) {
      importVersions(versions);
      const activeVersion = getActiveVersion();
      if (activeVersion) {
        pulledItems = activeVersion.items;
        console.log(`✅ Using active version: ${activeVersion.name}`);
      }
    } else {
      // 3. Fallback: pull legacy PAO list from Firebase
      try {
        pulledItems = await loadPAOListFromFirebase();
        console.log(`✅ Pulled ${pulledItems.length} items from Firebase`);

        // Create a default version from the pulled data only if no versions exist
        if (pulledItems.length > 0) {
          // Check if any versions already exist to avoid creating multiple defaults
          const localVersionsJson = localStorage.getItem(versionsKey);
          if (!localVersionsJson || localVersionsJson === '[]') {
            createVersion('Default', 'Pulled from server');
            // save pulled items into the new default version
            save(pulledItems);
            console.log('✅ Created default version from pulled data');
          } else {
            console.log('ℹ️ Versions already exist, not creating default version');
          }
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
      save(pulledItems);
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
      const { versions } = await loadVersionsFromFirebase();
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
        const items = await loadPAOListFromFirebase();
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
    const uid = getCurrentUserId();
    const keys = [
      namespacedKey('pao_data'),
      namespacedKey('pao_versions'),
      namespacedKey('pao_active_version'),
      namespacedKey('pao_sync_queue'),
      namespacedKey('pao_last_sync'),
    ];

    keys.forEach((key) => localStorage.removeItem(key));

    // Clean up legacy keys for anonymous sessions
    if (uid === 'anonymous') {
      ['pao_data', 'pao_versions', 'pao_active_version', 'pao_sync_queue', 'pao_last_sync'].forEach((key) => {
        localStorage.removeItem(key);
      });
    }
    console.log('✅ Local data cleared');
  } catch (error) {
    console.error('❌ Failed to clear local data:', error);
    throw error;
  }
}
