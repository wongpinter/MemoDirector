import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { PAOItem } from '../types';
import { TOTAL_NUMBERS, STORAGE_KEYS } from '../constants';

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
  // 1. Try Firebase
  if (isFirebaseAvailable && db) {
    try {
      const docRef = doc(db, "users", "default_user", "pao", "list"); // simplified path for demo
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().items as PAOItem[];
      }
    } catch (e) {
      console.error("Error loading from Firebase", e);
    }
  }

  // 2. Fallback to LocalStorage
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData) {
    return JSON.parse(localData);
  }

  // 3. Return empty
  return generateEmptyList();
};

export const savePAOList = async (items: PAOItem[]) => {
  // Only sync to Firebase (LocalStorage is handled by syncQueue)
  if (isFirebaseAvailable && db) {
    try {
      const docRef = doc(db, "users", "default_user", "pao", "list");
      await setDoc(docRef, { items, lastUpdated: new Date() });
      console.log("✅ Saved to Firebase");
    } catch (e) {
      console.error("❌ Error saving to Firebase", e);
      throw e; // Re-throw to let caller handle the error
    }
  } else {
    console.log("ℹ️ Firebase not available, skipping cloud sync");
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
    if (!storage) {
        console.warn("Firebase Storage not available. Cannot upload media.");
        return null;
    }

    try {
        const extension = type === 'image' ? 'png' : 'mp4';
        const path = `users/default_user/pao/${number}_${type}_${Date.now()}.${extension}`;
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