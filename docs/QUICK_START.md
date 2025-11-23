# Quick Start - Critical Improvements

This guide helps you implement the most critical improvements in order of priority.

## 🚨 Day 1: Security Fixes (2-4 hours)

### 1. Environment Variables Refactor (30 min)

**Step 1:** Create `.env.example`
```bash
# Copy this to .env and fill in your values
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Step 2:** Update `vite.config.ts`
```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
    },
  };
});
```

**Step 3:** Update all references
```bash
# Find and replace
process.env.API_KEY → import.meta.env.VITE_GEMINI_API_KEY
process.env.FIREBASE_API_KEY → import.meta.env.VITE_FIREBASE_API_KEY
# ... etc
```

### 2. Input Validation (1 hour)

**Create `src/utils/validation.ts`**
```typescript
export const ValidationRules = {
  PERSON_MAX_LENGTH: 100,
  ACTION_MAX_LENGTH: 100,
  OBJECT_MAX_LENGTH: 100,
  SCENE_MAX_LENGTH: 280,
  THEME_MAX_LENGTH: 50,
} as const;

export function validatePAOInput(field: string, value: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${field} is required`;
  }

  const maxLength = ValidationRules[`${field.toUpperCase()}_MAX_LENGTH` as keyof typeof ValidationRules];
  if (maxLength && value.length > maxLength) {
    return `${field} must be less than ${maxLength} characters`;
  }

  // Check for potentially malicious content
  if (/<script|javascript:|onerror=/i.test(value)) {
    return `${field} contains invalid characters`;
  }

  return null;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
```

**Update `components/PAOEditor.tsx`**
```typescript
import { validatePAOInput, sanitizeInput } from '../utils/validation';

// In handleSave function
const handleSave = () => {
  const errors: { person?: string; action?: string; object?: string } = {};
  
  errors.person = validatePAOInput('Person', person);
  errors.action = validatePAOInput('Action', action);
  errors.object = validatePAOInput('Object', object);

  setFieldErrors(errors);

  if (!errors.person && !errors.action && !errors.object) {
    onSave({
      number,
      person: sanitizeInput(person),
      action: sanitizeInput(action),
      object: sanitizeInput(object),
      scene: sanitizeInput(scene),
      imageUrl,
      videoUrl,
      completed: true
    });
    onClose();
  }
};
```

### 3. Basic Error Handling (1 hour)

**Create `src/contexts/ToastContext.tsx`**
```typescript
import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${
              toast.type === 'error' ? 'bg-rose-600' :
              toast.type === 'success' ? 'bg-emerald-600' :
              toast.type === 'warning' ? 'bg-amber-600' :
              'bg-indigo-600'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

**Update `App.tsx`**
```typescript
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      {/* existing content */}
    </ToastProvider>
  );
}
```

---

## ⚡ Day 2: Performance (2-3 hours)

### 1. Debounced Auto-Save (1 hour)

**Create `src/hooks/useDebouncedValue.ts`**
```typescript
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 1000): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Update `App.tsx`**
```typescript
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useToast } from './contexts/ToastContext';

export default function App() {
  const [items, setItems] = useState<PAOItem[]>([]);
  const debouncedItems = useDebouncedValue(items, 1000);
  const { showToast } = useToast();

  // Save when debounced value changes
  useEffect(() => {
    if (debouncedItems.length === 0) return; // Skip initial empty state
    
    const save = async () => {
      setSyncStatus('SYNCING');
      try {
        await savePAOList(debouncedItems);
        setSyncStatus('SAVED');
        setTimeout(() => setSyncStatus('IDLE'), 2000);
      } catch (e) {
        showToast('Failed to save changes', 'error');
        setSyncStatus('IDLE');
      }
    };

    save();
  }, [debouncedItems]);

  // Rest of component...
}
```

### 2. Fix Firebase Initialization (30 min)

**Update `services/db.ts`**
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let db = null;
let storage = null;
let isFirebaseAvailable = false;

// Only initialize if all required config is present
const hasRequiredConfig = firebaseConfig.apiKey && 
                          firebaseConfig.projectId &&
                          firebaseConfig.apiKey !== 'undefined';

if (hasRequiredConfig) {
  try {
    const app = getApps().length === 0 
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseAvailable = true;
    console.log('✅ Firebase initialized');
  } catch (e) {
    console.warn('⚠️ Firebase initialization failed:', e);
  }
} else {
  console.warn('⚠️ Firebase config incomplete. Using localStorage only.');
}

export { db, storage, isFirebaseAvailable };
```

### 3. Add Loading States (30 min)

**Create `src/components/common/LoadingSpinner.tsx`**
```typescript
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-500 mb-2`} />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}
```

---

## 🎨 Day 3: Code Quality (2-3 hours)

### 1. Extract Constants (30 min)

**Update `src/constants.ts`**
```typescript
// Add to existing file
export const UI_CONSTANTS = {
  CHAR_LIMIT: 280,
  DEBOUNCE_DELAY: 1000,
  TOAST_DURATION: 3000,
  TOOLTIP_OFFSET: 250,
  SYNC_SAVED_DISPLAY_TIME: 2000,
} as const;

export const STORAGE_KEYS = {
  PAO_DATA: 'mindpalace_pao_data',
  CUSTOM_THEMES: 'mindpalace_custom_themes',
} as const;

export const VALIDATION_RULES = {
  PERSON_MAX_LENGTH: 100,
  ACTION_MAX_LENGTH: 100,
  OBJECT_MAX_LENGTH: 100,
  SCENE_MAX_LENGTH: 280,
  THEME_MAX_LENGTH: 50,
} as const;
```

**Replace magic numbers throughout codebase**
```typescript
// Before
const CHAR_LIMIT = 280;

// After
import { UI_CONSTANTS } from '../constants';
const { CHAR_LIMIT } = UI_CONSTANTS;
```

### 2. Fix TypeScript Issues (1 hour)

**Create `src/types/window.d.ts`**
```typescript
interface AnkiDeck {
  addCard(front: string, back: string): void;
  save(): Promise<Blob>;
}

interface AnkiExportConstructor {
  new (deckName: string): AnkiDeck;
}

declare global {
  interface Window {
    AnkiExport?: AnkiExportConstructor | { default: AnkiExportConstructor };
    saveAs?: (blob: Blob, filename: string) => void;
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export {};
```

**Update `components/AnkiExport.tsx`**
```typescript
// Remove @ts-ignore
const AnkiExportLib = window.AnkiExport;
if (!AnkiExportLib) {
  throw new Error("AnkiExport library not loaded");
}

const AnkiGen = 'default' in AnkiExportLib ? AnkiExportLib.default : AnkiExportLib;
```

### 3. Add useLocalStorage Hook (30 min)

**Create `src/hooks/useLocalStorage.ts`**
```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
```

---

## 📋 Testing Your Changes

### Manual Testing Checklist

After each day's changes:

**Day 1 - Security:**
- [ ] App loads without console errors
- [ ] Environment variables are not visible in browser DevTools
- [ ] Input validation prevents empty submissions
- [ ] HTML/script tags are stripped from inputs
- [ ] Toast notifications appear for errors

**Day 2 - Performance:**
- [ ] Changes save after 1 second of inactivity (not immediately)
- [ ] Sync status indicator shows "Syncing..." then "Saved"
- [ ] Firebase fallback works when offline
- [ ] Loading spinner appears during data fetch

**Day 3 - Code Quality:**
- [ ] No TypeScript errors in terminal
- [ ] No `@ts-ignore` comments in code
- [ ] Constants are imported from central location
- [ ] localStorage hook persists data correctly

### Quick Test Script

```bash
# Install dependencies
npm install

# Run type check
npm run build

# Start dev server
npm run dev

# In another terminal, check for issues
npm run lint  # if you have ESLint configured
```

---

## 🚀 Deployment

### Before Deploying

1. **Update .gitignore**
```
.env
.env.local
.env.production
```

2. **Set environment variables in hosting platform**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - Firebase: `firebase functions:config:set`

3. **Test production build**
```bash
npm run build
npm run preview
```

4. **Deploy**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Firebase
firebase deploy
```

---

## 📊 Progress Tracking

Use this checklist to track your progress:

### Week 1
- [ ] Day 1: Security fixes complete
- [ ] Day 2: Performance improvements complete
- [ ] Day 3: Code quality improvements complete
- [ ] All manual tests passing
- [ ] Changes deployed to staging

### Week 2
- [ ] Start TASK-002 (Authentication)
- [ ] Start TASK-009 (Component extraction)
- [ ] Write unit tests
- [ ] Update documentation

---

## 🆘 Troubleshooting

### Common Issues

**Issue: "Cannot find module '@google/genai'"**
```bash
npm install @google/genai
```

**Issue: Firebase initialization fails**
- Check all environment variables are set
- Verify Firebase project exists
- Check browser console for specific error

**Issue: TypeScript errors after changes**
```bash
# Clear cache and rebuild
rm -rf node_modules .vite
npm install
npm run build
```

**Issue: Changes not saving**
- Check browser console for errors
- Verify Firebase rules allow writes
- Check network tab for failed requests

---

## 📚 Next Steps

After completing these quick wins:

1. Review `IMPROVEMENTS.md` for full task list
2. Read `REFACTORING_GUIDE.md` for architecture details
3. Set up proper backend API (TASK-001)
4. Implement authentication (TASK-002)
5. Add comprehensive testing

---

**Need Help?**
- Check existing issues in the repository
- Review Firebase/Vite documentation
- Test changes incrementally
- Keep backups before major refactors

Good luck! 🎉
