import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { PAOItem, PAOVersion } from '../types';
import { TOTAL_NUMBERS, STORAGE_KEYS } from '../constants';
import { getCurrentUserId, isAnonymousMode, isSyncEnabled } from './auth';

// ------------------------------------------------------------------
// FIREBASE CONFIG
// Note: Vite uses import.meta.env for environment variables
// We use a try/catch block to allow the app to run in demo mode 
// without crashing if keys are missing.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseAvailable = false;

/**
 * Check if Firebase is ready for sync
 * Requires: Firebase available, user authenticated, AND sync enabled by user
 */
export const isFirebaseReadyForSync = (): boolean => {
  return Boolean(isFirebaseAvailable && db && !isAnonymousMode() && isSyncEnabled());
};

// Initialize Firebase safely
try {
  if (!getApps().length && import.meta.env.VITE_FIREBASE_API_KEY) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseAvailable = true;
    console.log("✅ Firebase initialized successfully.");
  } else if (import.meta.env.VITE_FIREBASE_API_KEY) {
    // Already initialized
    const app = getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseAvailable = true;
  } else {
    console.log("ℹ️ Firebase config not found. Using LocalStorage mode.");
  }
} catch (e) {
  console.error("❌ Firebase init failed:", e);
  console.log("ℹ️ Falling back to LocalStorage mode.");
}

const LOCAL_STORAGE_KEY = STORAGE_KEYS.PAO_DATA;

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
  // 1. Try Firebase (with user-specific path)
  try {
    const firebaseItems = await loadPAOListFromFirebase();
    if (firebaseItems.length > 0) {
      return firebaseItems;
    }
  } catch (e) {
    // Swallow and fallback to local for standard load path
  }

  // 2. Fallback to LocalStorage
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData) {
    return JSON.parse(localData);
  }

  // 3. Return empty
  return generateEmptyList();
};

export const loadPAOListFromFirebase = async (): Promise<PAOItem[]> => {
  if (!isFirebaseReadyForSync()) {
    throw new Error("Firebase not available or user not authenticated");
  }

  const userId = getCurrentUserId();
  const docRef = doc(db!, "users", userId, "pao", "list");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().items as PAOItem[];
  }

  return [];
};

export const savePAOList = async (items: PAOItem[]) => {
  // Only sync to Firebase (LocalStorage is handled by syncQueue)
  if (!isFirebaseReadyForSync()) {
    console.log("ℹ️ Firebase not available or anonymous mode, skipping cloud sync");
    throw new Error("Firebase not available for save");
  }

  try {
    const userId = getCurrentUserId();
    const docRef = doc(db!, "users", userId, "pao", "list");
    await setDoc(docRef, {
      items,
      lastUpdated: Date.now() // Use timestamp instead of Date object
    });
    console.log("✅ Saved to Firebase");
  } catch (e) {
    console.error("❌ Error saving to Firebase", e);
    throw e; // Re-throw to let caller handle the error
  }
};

/**
 * Uploads a base64 string to Firebase Storage and returns the public download URL.
 * Returns null if Firebase is not configured.
 */
export const uploadMedia = async (
  number: number,
  type: 'image' | 'video',
  base64Data: string,
  mimeType: string
): Promise<string | null> => {
  if (!storage || isAnonymousMode()) {
    console.warn("Firebase Storage not available or anonymous mode. Cannot upload media.");
    return null;
  }

  try {
    const userId = getCurrentUserId();
    const extension = type === 'image' ? 'png' : 'mp4';
    const path = `users/${userId}/pao/${number}_${type}_${Date.now()}.${extension}`;
    const storageRef = ref(storage, path);

    // Strip metadata prefix if present (e.g. "data:image/png;base64,")
    const cleanBase64 = base64Data.replace(/^data:.*,/, '');

    await uploadString(storageRef, cleanBase64, 'base64', { contentType: mimeType });
    const url = await getDownloadURL(storageRef);
    return url;
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
 * Load all versions from Firebase
 * Returns an object with versions array and optional error
 */
export const loadVersions = async (): Promise<LoadVersionsResult> => {
  if (!isFirebaseAvailable || !db || isAnonymousMode()) {
    return { versions: [] };
  }

  try {
    const userId = getCurrentUserId();
    const versionsRef = collection(db, "users", userId, "pao_versions");
    const snapshot = await getDocs(versionsRef);

    const versions: PAOVersion[] = [];
    snapshot.forEach(doc => {
      versions.push(doc.data() as PAOVersion);
    });

    return { versions };
  } catch (e) {
    console.error("Error loading versions from Firebase", e);
    return {
      versions: [],
      error: e instanceof Error ? e.message : 'Failed to load versions from Firebase'
    };
  }
};

/**
 * Save a version to Firebase
 */
export const saveVersion = async (version: PAOVersion): Promise<void> => {
  if (!isFirebaseAvailable || !db || isAnonymousMode()) {
    console.log("ℹ️ Firebase not available or anonymous mode, skipping version sync");
    return;
  }

  try {
    const userId = getCurrentUserId();
    const versionRef = doc(db, "users", userId, "pao_versions", version.id);
    await setDoc(versionRef, version);
    console.log(`✅ Saved version ${version.name} to Firebase`);
  } catch (e) {
    console.error("❌ Error saving version to Firebase", e);
    throw e;
  }
};

/**
 * Delete a version from Firebase
 */
export const deleteVersionFromFirebase = async (versionId: string): Promise<void> => {
  if (!isFirebaseAvailable || !db || isAnonymousMode()) {
    return;
  }

  try {
    const userId = getCurrentUserId();
    const versionRef = doc(db, "users", userId, "pao_versions", versionId);
    await deleteDoc(versionRef);
    console.log(`✅ Deleted version from Firebase`);
  } catch (e) {
    console.error("❌ Error deleting version from Firebase", e);
    throw e;
  }
};

/**
 * Sync all versions to Firebase
 */
export const syncVersionsToFirebase = async (versions: PAOVersion[]): Promise<void> => {
  if (!isFirebaseAvailable || !db) {
    return;
  }

  try {
    const promises = versions.map(version => saveVersion(version));
    await Promise.all(promises);
    console.log(`✅ Synced ${versions.length} versions to Firebase`);
  } catch (e) {
    console.error("❌ Error syncing versions to Firebase", e);
    throw e;
  }
};
