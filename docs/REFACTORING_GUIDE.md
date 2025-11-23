# MemoDirector - Refactoring Guide

## 🏗️ Architecture Improvements

### Current Architecture
```
┌─────────────────────────────────────────┐
│           React Frontend                │
│  ┌─────────────────────────────────┐   │
│  │   Components (UI Layer)         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Services (Business Logic)     │   │
│  │   - geminiService.ts (⚠️ API)   │   │
│  │   - db.ts (Firebase)            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Types & Constants             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         │ Direct API calls (⚠️ Insecure)
         ▼
┌─────────────────────────────────────────┐
│      External Services                  │
│  - Google Gemini API                    │
│  - Firebase Firestore                   │
│  - Firebase Storage                     │
└─────────────────────────────────────────┘
```

### Proposed Architecture
```
┌─────────────────────────────────────────┐
│           React Frontend                │
│  ┌─────────────────────────────────┐   │
│  │   Components (Presentation)     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Hooks (Business Logic)        │   │
│  │   - useAuth                     │   │
│  │   - usePAOData                  │   │
│  │   - useAISuggestions            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Contexts (State Management)   │   │
│  │   - AuthContext                 │   │
│  │   - ToastContext                │   │
│  │   - ThemeContext                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Utils & Helpers               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         │ Secure API calls
         ▼
┌─────────────────────────────────────────┐
│      Backend API (Serverless)           │
│  ┌─────────────────────────────────┐   │
│  │   /api/ai/suggestions           │   │
│  │   /api/ai/scene                 │   │
│  │   /api/ai/image                 │   │
│  │   /api/ai/video                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Middleware                    │   │
│  │   - Rate Limiting               │   │
│  │   - Authentication              │   │
│  │   - Input Validation            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      External Services                  │
│  - Google Gemini API (✅ Secured)       │
│  - Firebase Firestore                   │
│  - Firebase Storage                     │
└─────────────────────────────────────────┘
```

---

## 🔧 Detailed Refactoring Plans

### 1. Project Structure Reorganization

**Current:**
```
src/
├── App.tsx
├── index.tsx
├── types.ts
├── constants.ts
├── components/
│   ├── PAOGrid.tsx
│   ├── PAOEditor.tsx
│   ├── Stats.tsx
│   ├── AnkiExport.tsx
│   ├── ReverseLookup.tsx
│   └── MajorSystemTrainer.tsx
└── services/
    ├── db.ts
    └── geminiService.ts
```

**Proposed:**
```
src/
├── main.tsx                          # Entry point
├── App.tsx                           # Root component
│
├── components/
│   ├── common/                       # Shared components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── LoadingSpinner/
│   │   └── index.ts
│   │
│   ├── layout/                       # Layout components
│   │   ├── Header/
│   │   ├── Navigation/
│   │   └── index.ts
│   │
│   ├── pao/                          # PAO-specific
│   │   ├── PAOGrid/
│   │   │   ├── PAOGrid.tsx
│   │   │   ├── PAOCard.tsx
│   │   │   ├── PAOGrid.test.tsx
│   │   │   └── index.ts
│   │   ├── PAOEditor/
│   │   │   ├── PAOEditor.tsx
│   │   │   ├── CastingSection.tsx
│   │   │   ├── DirectorCutSection.tsx
│   │   │   ├── MediaSection.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── stats/                        # Statistics
│   │   ├── Stats.tsx
│   │   ├── StatCard.tsx
│   │   ├── DecadeChart.tsx
│   │   └── index.ts
│   │
│   ├── export/                       # Export functionality
│   │   ├── AnkiExport/
│   │   ├── CardPreview/
│   │   ├── ImportInstructions/
│   │   └── index.ts
│   │
│   ├── lookup/                       # Reverse lookup
│   │   ├── ReverseLookup.tsx
│   │   └── index.ts
│   │
│   └── trainer/                      # Major System trainer
│       ├── MajorSystemTrainer.tsx
│       └── index.ts
│
├── hooks/                            # Custom hooks
│   ├── useAuth.ts
│   ├── usePAOData.ts
│   ├── useAISuggestions.ts
│   ├── useLocalStorage.ts
│   ├── useDebouncedValue.ts
│   ├── useFirebaseSync.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useFocusTrap.ts
│   ├── useToast.ts
│   └── index.ts
│
├── contexts/                         # React contexts
│   ├── AuthContext.tsx
│   ├── ToastContext.tsx
│   ├── ThemeContext.tsx
│   └── index.ts
│
├── services/                         # External service integrations
│   ├── api/                          # API client
│   │   ├── client.ts                 # Base API client
│   │   ├── ai.ts                     # AI endpoints
│   │   ├── storage.ts                # Storage endpoints
│   │   └── index.ts
│   ├── firebase/                     # Firebase services
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   └── index.ts
│
├── utils/                            # Utility functions
│   ├── validation.ts
│   ├── sanitization.ts
│   ├── imageCompression.ts
│   ├── csvParser.ts
│   ├── fuzzySearch.ts
│   ├── errorTracking.ts
│   └── index.ts
│
├── types/                            # TypeScript types
│   ├── pao.ts
│   ├── api.ts
│   ├── user.ts
│   ├── window.d.ts
│   └── index.ts
│
├── constants/                        # Constants
│   ├── majorSystem.ts
│   ├── ui.ts
│   ├── storage.ts
│   ├── api.ts
│   └── index.ts
│
├── config/                           # Configuration
│   ├── firebase.ts
│   ├── env.ts
│   └── index.ts
│
└── styles/                           # Global styles
    ├── globals.css
    └── tailwind.css
```

---

## 🔐 Security Refactoring

### Step 1: Create Backend API Structure

**Option A: Vercel Serverless Functions**
```
api/
├── ai/
│   ├── suggestions.ts
│   ├── scene.ts
│   ├── image.ts
│   └── video.ts
├── middleware/
│   ├── auth.ts
│   ├── rateLimit.ts
│   └── validation.ts
└── utils/
    ├── gemini.ts
    └── errors.ts
```

**Example: api/ai/suggestions.ts**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { rateLimit } from '../middleware/rateLimit';
import { validateAuth } from '../middleware/auth';
import { validateInput } from '../middleware/validation';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY! 
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apply middleware
  try {
    await rateLimit(req, res);
    await validateAuth(req, res);
    await validateInput(req, res);
  } catch (error) {
    return; // Middleware already sent response
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { number, theme, specificPerson, strictMode } = req.body;

  try {
    // Your existing AI logic here
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: /* ... */,
      config: /* ... */
    });

    return res.status(200).json({
      success: true,
      suggestions: /* parsed response */
    });
  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
}
```

**Frontend API Client: services/api/client.ts**
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }

  async getSuggestions(params: SuggestionParams) {
    return this.request<SuggestionResponse>('/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  private async getAuthToken(): Promise<string> {
    // Get from Firebase Auth
    const user = auth.currentUser;
    return user ? await user.getIdToken() : '';
  }
}

export const apiClient = new APIClient();
```

---

### Step 2: Implement Authentication

**contexts/AuthContext.tsx**
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signInWithGoogle,
      signOut,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Update services/firebase/firestore.ts**
```typescript
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PAOItem } from '../../types';

export async function loadPAOList(userId: string): Promise<PAOItem[]> {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const docRef = doc(db, 'users', userId, 'pao', 'list');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().items as PAOItem[];
    }
    
    return generateEmptyList();
  } catch (error) {
    console.error('Error loading PAO list:', error);
    throw error;
  }
}

export async function savePAOList(
  userId: string, 
  items: PAOItem[]
): Promise<void> {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const docRef = doc(db, 'users', userId, 'pao', 'list');
    await setDoc(docRef, { 
      items, 
      lastUpdated: new Date() 
    });
  } catch (error) {
    console.error('Error saving PAO list:', error);
    throw error;
  }
}
```

---

### Step 3: Create Custom Hooks

**hooks/usePAOData.ts**
```typescript
import { useState, useEffect } from 'react';
import { PAOItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { loadPAOList, savePAOList } from '../services/firebase/firestore';
import { useLocalStorage } from './useLocalStorage';
import { useDebouncedValue } from './useDebouncedValue';
import { useToast } from './useToast';

export function usePAOData() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<PAOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  
  // Local storage fallback for offline/anonymous users
  const [localItems, setLocalItems] = useLocalStorage<PAOItem[]>('pao_data', []);
  
  // Debounce items for auto-save
  const debouncedItems = useDebouncedValue(items, 1000);

  // Load data on mount or user change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (user) {
          const data = await loadPAOList(user.uid);
          setItems(data);
        } else {
          setItems(localItems);
        }
      } catch (error) {
        showToast('Failed to load data', 'error');
        setItems(localItems); // Fallback to local
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Auto-save when items change (debounced)
  useEffect(() => {
    if (loading) return; // Don't save during initial load

    async function saveData() {
      setSyncStatus('syncing');
      try {
        if (user) {
          await savePAOList(user.uid, debouncedItems);
        } else {
          setLocalItems(debouncedItems);
        }
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        showToast('Failed to save changes', 'error');
        setSyncStatus('idle');
      }
    }

    saveData();
  }, [debouncedItems]);

  const updateItem = (updatedItem: PAOItem) => {
    setItems(prev => 
      prev.map(item => 
        item.number === updatedItem.number ? updatedItem : item
      )
    );
  };

  const updateItems = (newItems: PAOItem[]) => {
    setItems(newItems);
  };

  return {
    items,
    loading,
    syncStatus,
    updateItem,
    updateItems,
  };
}
```

**hooks/useDebouncedValue.ts**
```typescript
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**hooks/useAISuggestions.ts**
```typescript
import { useState } from 'react';
import { Suggestion } from '../types';
import { apiClient } from '../services/api/client';
import { useToast } from './useToast';

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const generateSuggestions = async (
    number: number,
    theme: string,
    specificPerson?: string,
    strictMode: boolean = false
  ) => {
    setLoading(true);
    try {
      const response = await apiClient.getSuggestions({
        number,
        theme,
        specificPerson,
        strictMode
      });
      setSuggestions(response.suggestions);
    } catch (error) {
      showToast('Failed to generate suggestions', 'error');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    loading,
    generateSuggestions,
    clearSuggestions,
  };
}
```

---

### Step 4: Refactor Components

**App.tsx (Simplified)**
```typescript
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
```

**AppContent.tsx**
```typescript
import { useState } from 'react';
import { Header } from './components/layout/Header';
import { PAOGrid } from './components/pao/PAOGrid';
import { PAOEditor } from './components/pao/PAOEditor';
import { Stats } from './components/stats/Stats';
import { AnkiExport } from './components/export/AnkiExport';
import { ReverseLookup } from './components/lookup/ReverseLookup';
import { MajorSystemTrainer } from './components/trainer/MajorSystemTrainer';
import { usePAOData } from './hooks/usePAOData';
import { useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';

enum Tab {
  GRID = 'GRID',
  STATS = 'STATS',
  EXPORT = 'EXPORT',
  REVERSE = 'REVERSE',
  SYSTEM = 'SYSTEM'
}

export function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, syncStatus, updateItem } = usePAOData();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GRID);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-slate-900 text-slate-50">
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncStatus={syncStatus}
        user={user}
      />

      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === Tab.GRID && (
          <PAOGrid items={items} onSelect={setSelectedNumber} />
        )}
        {activeTab === Tab.REVERSE && (
          <ReverseLookup 
            items={items} 
            onSelect={setSelectedNumber}
          />
        )}
        {activeTab === Tab.SYSTEM && <MajorSystemTrainer />}
        {activeTab === Tab.STATS && <Stats items={items} />}
        {activeTab === Tab.EXPORT && <AnkiExport items={items} />}
      </main>

      {selectedNumber !== null && (
        <PAOEditor
          number={selectedNumber}
          initialData={items.find(i => i.number === selectedNumber)}
          onClose={() => setSelectedNumber(null)}
          onSave={updateItem}
        />
      )}
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests Example

**tests/unit/calculateMajorNumber.test.ts**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateMajorNumber } from '../../src/constants';

describe('calculateMajorNumber', () => {
  it('should calculate initials correctly', () => {
    const results = calculateMajorNumber('Tony Stark');
    expect(results).toContainEqual({
      number: 10,
      method: 'Initials',
      explanation: expect.stringContaining('T(1) + S(0)')
    });
  });

  it('should calculate phonetic correctly', () => {
    const results = calculateMajorNumber('Sun Wukong');
    expect(results).toContainEqual({
      number: 2,
      method: 'Phonetic',
      explanation: expect.stringContaining('S(0) + N(2)')
    });
  });

  it('should handle empty input', () => {
    const results = calculateMajorNumber('');
    expect(results).toEqual([]);
  });

  it('should handle single character', () => {
    const results = calculateMajorNumber('T');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].method).toBe('Phonetic');
  });
});
```

### Component Tests Example

**tests/components/PAOGrid.test.tsx**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PAOGrid } from '../../src/components/pao/PAOGrid';
import { PAOItem } from '../../src/types';

const mockItems: PAOItem[] = [
  {
    number: 0,
    person: 'Zorro',
    action: 'Slicing',
    object: 'Sword',
    completed: true
  },
  {
    number: 1,
    person: '',
    action: '',
    object: '',
    completed: false
  }
];

describe('PAOGrid', () => {
  it('should render all items', () => {
    const onSelect = vi.fn();
    render(<PAOGrid items={mockItems} onSelect={onSelect} />);
    
    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<PAOGrid items={mockItems} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('00'));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('should show completed indicator for completed items', () => {
    const onSelect = vi.fn();
    render(<PAOGrid items={mockItems} onSelect={onSelect} />);
    
    const completedCard = screen.getByText('00').closest('div');
    expect(completedCard).toHaveClass('bg-slate-800/50');
  });
});
```

---

## 📦 Migration Guide

### Phase 1: Preparation (No Breaking Changes)
1. Create new folder structure alongside existing
2. Add new dependencies
3. Set up testing infrastructure
4. Create utility functions and hooks

### Phase 2: Backend Setup
1. Deploy serverless functions
2. Test API endpoints
3. Keep old code as fallback

### Phase 3: Gradual Migration
1. Migrate one component at a time
2. Run both old and new in parallel
3. Feature flag new implementations
4. Monitor for issues

### Phase 4: Cleanup
1. Remove old code
2. Update documentation
3. Final testing
4. Deploy to production

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules updated
- [ ] API rate limiting tested
- [ ] Authentication flow tested
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Monitoring/analytics configured

---

**Last Updated:** 2025-11-23
