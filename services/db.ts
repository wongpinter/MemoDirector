
import { PAOItem, PAOVersion } from '../types';
import { TOTAL_NUMBERS, STORAGE_KEYS } from '../constants';
import { getCurrentUserId, isAnonymousMode } from './auth';
import { isSyncEnabled } from './preferences';
import { supabase } from './supabase';
import { safeJsonParse, categorizeSupabaseError, ErrorCategory } from '../utils';

// ------------------------------------------------------------------
// SUPABASE CONFIG
// ------------------------------------------------------------------

const LOCAL_STORAGE_KEY = STORAGE_KEYS.PAO_DATA;

/**
 * Check if Supabase is ready for sync
 * Requires: User authenticated AND sync enabled by user
 */
export const isRemoteReadyForSync = (): boolean => {
  return Boolean(supabase && !isAnonymousMode() && isSyncEnabled());
};

// Generate blank 00-99 list
const generateEmptyList = (): PAOItem[] => {
  return Array.from({ length: TOTAL_NUMBERS }, (_, i) => ({
    number: i,
    person: '',
    action: '',
    object: '',
    scene: '',
    completed: false
  }));
};

export const loadPAOList = async (): Promise<PAOItem[]> => {
  // 1. Try Supabase (if authenticated and sync enabled)
  if (isRemoteReadyForSync()) {
    try {
      const remoteItems = await loadPAOListFromRemote();
      if (remoteItems.length > 0) {
        return remoteItems;
      }
    } catch (e) {
      console.warn("Retrying load from Remote failed, falling back to local:", e);
      // Swallow and fallback to local
    }
  }

  // 2. Fallback to LocalStorage
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData) {
    return safeJsonParse<PAOItem[]>(localData, generateEmptyList());
  }

  // 3. Return empty
  return generateEmptyList();
};

export const loadPAOListFromRemote = async (): Promise<PAOItem[]> => {
  if (!isRemoteReadyForSync() || !supabase) {
    throw new Error("Remote sync not available or user not authenticated");
  }

  const userId = getCurrentUserId();

  // We assume a table 'user_pao_lists' with columns: user_id, items (jsonb)
  const { data, error } = await supabase
    .from('user_pao_lists')
    .select('items')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    const categorized = categorizeSupabaseError(error);
    console.error(`Error loading PAO list from Supabase [${categorized.category}]:`, categorized.message);
    
    if (categorized.category === ErrorCategory.AUTH) {
      console.error('Authentication error - user may need to sign in again');
    } else if (categorized.category === ErrorCategory.NETWORK) {
      console.error('Network error - will retry when connection is restored');
    }
    
    throw error;
  }

  if (data) {
    return data.items as PAOItem[];
  }

  return [];
};

export const savePAOList = async (items: PAOItem[]) => {
  // Only sync to Remote if enabled
  if (!isRemoteReadyForSync() || !supabase) {
    console.log("ℹ️ Remote sync not enabled or anonymous mode, skipping cloud sync");
    throw new Error("Remote not available for save");
  }

  try {
    const userId = getCurrentUserId();

    // Upsert into 'user_pao_lists'
    const { error } = await supabase
      .from('user_pao_lists')
      .upsert({
        user_id: userId,
        items: items,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    console.log("✅ Saved to Supabase");
  } catch (e) {
    console.error("❌ Error saving to Supabase", e);
    throw e;
  }
};

/**
 * Uploads a base64 string to Supabase Storage and returns the public download URL.
 */
export const uploadMedia = async (
  number: number,
  type: 'image' | 'video',
  base64Data: string,
  mimeType: string
): Promise<string | null> => {
  if (isAnonymousMode() || !supabase) {
    console.warn('Supabase not configured. Cannot upload media.');
    return null;
  }

  try {
    const userId = getCurrentUserId();
    const extension = type === 'image' ? 'png' : 'mp4';
    const filename = `${number}_${type}_${Date.now()}.${extension}`;
    const path = `${userId}/${filename}`; // Store in folder by user_id

    // Convert base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    const { data, error } = await supabase.storage
      .from('user-media') // Ensure this bucket exists
      .upload(path, blob, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-media')
      .getPublicUrl(path);

    return publicUrl;
  } catch (e) {
    console.error(`Error uploading ${type}:`, e);
    throw e;
  }
}

// ============================================
// VERSION MANAGEMENT
// ============================================

export interface LoadVersionsResult {
  versions: PAOVersion[];
  error?: string;
}

/**
 * Load all versions from Supabase
 */
export const loadVersions = async (): Promise<LoadVersionsResult> => {
  if (!isRemoteReadyForSync() || !supabase) {
    return { versions: [] };
  }

  try {
    const userId = getCurrentUserId();
    const { data, error } = await supabase
      .from('pao_versions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Map DB fields to PAOVersion (assuming direct match or minimal mapping)
    // Supabase returns snake_case usually if columns are snake_case, but we can structure table to match or map here.
    // Assuming table columns: id, name, description, created_at, last_modified, is_active, items
    // and storing items as jsonb.
    // Postgres returns keys as is.

    const versions: PAOVersion[] = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at).getTime(), // Convert ISO string to timestamp if needed, or keep as number if stored as bigint/number
      lastModified: new Date(row.last_modified).getTime(),
      isActive: row.is_active,
      items: row.items
    }));

    return { versions };
  } catch (e) {
    console.error("Error loading versions from Supabase", e);
    return {
      versions: [],
      error: e instanceof Error ? e.message : 'Failed to load versions from Supabase'
    };
  }
};

/**
 * Save a version to Supabase
 */
export const saveVersion = async (version: PAOVersion): Promise<void> => {
  if (!isRemoteReadyForSync() || !supabase) {
    console.log("ℹ️ Remote sync not enabled, skipping version save");
    return;
  }

  try {
    const userId = getCurrentUserId();

    // Map to DB structure
    const dbRow = {
      id: version.id,
      user_id: userId,
      name: version.name,
      description: version.description,
      created_at: new Date(version.createdAt).toISOString(),
      last_modified: new Date(version.lastModified).toISOString(),
      is_active: version.isActive,
      items: version.items
    };

    const { error } = await supabase
      .from('pao_versions')
      .upsert(dbRow);

    if (error) throw error;

    console.log(`✅ Saved version ${version.name} to Supabase`);
  } catch (e) {
    console.error("❌ Error saving version to Supabase", e);
    throw e;
  }
};

/**
 * Delete a version from Supabase
 */
export const deleteVersionFromFirebase = async (versionId: string): Promise<void> => {
  // Kept name 'deleteVersionFromFirebase' for compatibility if needed, but should probably rename. 
  // However, to minimize refactor impact on other files calling this, I can keep the export name aligned 
  // or I should check usages. "deleteVersionFromFirebase" is very specific.
  // I will rename it to `deleteVersionFromRemote` and alias it or update callers.
  // Implementation plan said "Migrate Database Operations".
  // I'll stick to `deleteVersionFromRemote` and update callers if I can, or alias.
  // Let's implement `deleteVersionFromRemote`.
  await deleteVersionFromRemote(versionId);
};

export const deleteVersionFromRemote = async (versionId: string): Promise<void> => {
  if (!isRemoteReadyForSync() || !supabase) return;

  try {
    const userId = getCurrentUserId();
    const { error } = await supabase
      .from('pao_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', userId);

    if (error) throw error;
    console.log(`✅ Deleted version from Supabase`);
  } catch (e) {
    console.error("❌ Error deleting version from Supabase", e);
    throw e;
  }
}


/**
 * Sync all versions to Supabase
 */
export const syncVersionsToFirebase = async (versions: PAOVersion[]): Promise<void> => {
  // Alias for compatibility
  return syncVersionsToRemote(versions);
}

export const syncVersionsToRemote = async (versions: PAOVersion[]): Promise<void> => {
  if (!isRemoteReadyForSync()) {
    return;
  }

  try {
    const promises = versions.map(version => saveVersion(version));
    await Promise.all(promises);
    console.log(`✅ Synced ${versions.length} versions to Supabase`);
  } catch (e) {
    console.error("❌ Error syncing versions to Supabase", e);
    throw e;
  }
};

// Backwards compatibility exports if strictly necessary, but better to update calls.
export const isFirebaseReadyForSync = isRemoteReadyForSync;
export const loadPAOListFromFirebase = loadPAOListFromRemote;
