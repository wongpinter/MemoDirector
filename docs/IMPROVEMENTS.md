# MemoDirector - Improvement & Refactoring Tasks

## 🔴 Critical Priority (Security & Data Integrity)

### TASK-001: Secure API Key Management
**Priority:** CRITICAL  
**Effort:** Medium  
**Impact:** High

**Problem:**
- Gemini API keys are exposed in client-side code
- Anyone can extract and abuse your quota
- No rate limiting or usage tracking

**Solution:**
```
1. Create serverless functions (Vercel/Netlify/Firebase Functions)
2. Move all AI calls to backend
3. Implement API key rotation
4. Add rate limiting per user/session
```

**Files to modify:**
- `services/geminiService.ts` → Create API wrapper
- Create new `/api` or `/functions` directory
- Update environment variable handling

**Acceptance Criteria:**
- [ ] API keys never exposed to client
- [ ] All AI calls go through backend
- [ ] Rate limiting implemented (e.g., 10 requests/minute)
- [ ] Error handling for quota exceeded

---

### TASK-002: Multi-User Support & Authentication
**Priority:** CRITICAL  
**Effort:** High  
**Impact:** High

**Problem:**
- All users share same Firebase path (`users/default_user`)
- No authentication system
- Data conflicts between users

**Solution:**
```
1. Implement Firebase Authentication
2. Generate unique user IDs
3. Update Firestore security rules
4. Add user profile management
```

**Files to modify:**
- `services/db.ts` - Dynamic user paths
- `App.tsx` - Add auth context
- Create `contexts/AuthContext.tsx`
- Create `components/auth/LoginModal.tsx`

**Acceptance Criteria:**
- [ ] Users can sign up/login (email or Google)
- [ ] Each user has isolated data
- [ ] Firestore rules prevent unauthorized access
- [ ] Anonymous mode still works with localStorage

---

### TASK-003: Input Sanitization & Validation
**Priority:** HIGH  
**Effort:** Low  
**Impact:** Medium

**Problem:**
- No input sanitization before AI prompts
- Potential for prompt injection attacks
- No character limits enforced server-side

**Solution:**
```
1. Create validation utility functions
2. Sanitize all user inputs
3. Add max length constraints
4. Escape special characters in prompts
```

**Files to create:**
- `utils/validation.ts`
- `utils/sanitization.ts`

**Files to modify:**
- `services/geminiService.ts`
- `components/PAOEditor.tsx`
- `components/ReverseLookup.tsx`

**Acceptance Criteria:**
- [ ] All inputs validated before processing
- [ ] HTML/script tags stripped
- [ ] Max length enforced (280 chars for scene)
- [ ] Special characters escaped in AI prompts

---

## 🟡 High Priority (Performance & UX)

### TASK-004: Implement Debounced Auto-Save
**Priority:** HIGH  
**Effort:** Low  
**Impact:** High

**Problem:**
- Auto-save triggers on every keystroke
- Excessive Firebase writes (costs money)
- No debouncing implemented

**Solution:**
```typescript
// Create custom hook
const useDebouncedSave = (value, delay = 1000) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      savePAOList(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
};
```

**Files to create:**
- `hooks/useDebouncedSave.ts`

**Files to modify:**
- `App.tsx` - Replace direct save with debounced version

**Acceptance Criteria:**
- [ ] Save only triggers after 1 second of inactivity
- [ ] Visual indicator shows "saving..." state
- [ ] Unsaved changes warning on page close
- [ ] Manual save button for immediate sync

---

### TASK-005: Error Handling & User Feedback
**Priority:** HIGH  
**Effort:** Medium  
**Impact:** High

**Problem:**
- Errors logged to console but user not informed
- No toast/notification system
- Silent failures confuse users

**Solution:**
```
1. Implement toast notification system
2. Add error boundaries
3. Create user-friendly error messages
4. Add retry mechanisms
```

**Files to create:**
- `components/common/Toast.tsx`
- `contexts/ToastContext.tsx`
- `components/ErrorBoundary.tsx`

**Files to modify:**
- All service files to use toast notifications
- `App.tsx` - Wrap with ErrorBoundary

**Acceptance Criteria:**
- [ ] Toast notifications for all user actions
- [ ] Error boundaries catch React errors
- [ ] Retry button for failed operations
- [ ] Offline mode clearly indicated

---

### TASK-006: Optimize Firebase Storage Usage
**Priority:** MEDIUM  
**Effort:** Medium  
**Impact:** Medium

**Problem:**
- Images uploaded as base64 (inefficient)
- No image compression
- No cleanup of old media
- Could hit storage limits quickly

**Solution:**
```
1. Compress images before upload
2. Use WebP format
3. Implement lazy loading
4. Add media cleanup on item deletion
```

**Files to create:**
- `utils/imageCompression.ts`

**Files to modify:**
- `services/db.ts` - Add compression pipeline
- `components/PAOEditor.tsx` - Show compression progress

**Acceptance Criteria:**
- [ ] Images compressed to <200KB
- [ ] WebP format used when supported
- [ ] Old media deleted when replaced
- [ ] Progress indicator during upload

---

### TASK-007: Keyboard Navigation & Accessibility
**Priority:** MEDIUM  
**Effort:** Medium  
**Impact:** High

**Problem:**
- No keyboard shortcuts
- Missing ARIA labels
- Modal doesn't trap focus
- Poor screen reader support

**Solution:**
```
1. Add keyboard shortcuts (e.g., 'n' for new, 'e' for edit)
2. Implement focus trap in modals
3. Add ARIA labels to all interactive elements
4. Test with screen readers
```

**Files to create:**
- `hooks/useKeyboardShortcuts.ts`
- `hooks/useFocusTrap.ts`
- `components/common/KeyboardShortcutsHelp.tsx`

**Files to modify:**
- `components/PAOEditor.tsx` - Focus trap
- `components/PAOGrid.tsx` - Keyboard navigation
- All button components - ARIA labels

**Acceptance Criteria:**
- [ ] All features accessible via keyboard
- [ ] Focus trap works in modals
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard shortcuts help modal (press '?')
- [ ] Screen reader tested

---

## 🟢 Medium Priority (Code Quality & Maintainability)

### TASK-008: Refactor Environment Variables
**Priority:** MEDIUM  
**Effort:** Low  
**Impact:** Low

**Problem:**
- Inconsistent naming (`API_KEY` vs `GEMINI_API_KEY`)
- Not following Vite conventions
- Confusing documentation

**Solution:**
```
1. Rename to Vite convention (VITE_ prefix)
2. Update all references
3. Create .env.example file
4. Update documentation
```

**Files to modify:**
- `vite.config.ts`
- `services/geminiService.ts`
- `services/db.ts`
- `README.md`

**Files to create:**
- `.env.example`

**New naming convention:**
```env
VITE_GEMINI_API_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Acceptance Criteria:**
- [ ] All env vars use VITE_ prefix
- [ ] .env.example created with all required vars
- [ ] README updated with new naming
- [ ] No hardcoded fallback values

---

### TASK-009: Extract Shared Components
**Priority:** MEDIUM  
**Effort:** Medium  
**Impact:** Medium

**Problem:**
- Code duplication in AnkiExport and MajorSystemTrainer
- Similar card preview logic repeated
- No shared component library

**Solution:**
```
Create reusable components:
1. CardPreview component
2. ExportButton component
3. FlashcardStage component
4. ImportInstructions component
```

**New file structure:**
```
components/
├── common/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── LoadingSpinner.tsx
├── flashcard/
│   ├── CardPreview.tsx
│   ├── FlashcardStage.tsx
│   └── FlipButton.tsx
└── export/
    ├── ExportButton.tsx
    ├── ImportInstructions.tsx
    └── AnkiExport.tsx
```

**Acceptance Criteria:**
- [ ] No duplicate card preview logic
- [ ] Shared components documented
- [ ] Storybook or component showcase (optional)
- [ ] Consistent prop interfaces

---

### TASK-010: Improve Type Safety
**Priority:** MEDIUM  
**Effort:** Low  
**Impact:** Medium

**Problem:**
- Multiple `@ts-ignore` comments
- `as unknown as` type assertions
- Missing type declarations for window extensions

**Solution:**
```typescript
// Create proper type declarations
// types/window.d.ts
declare global {
  interface Window {
    AnkiExport?: {
      default?: new (deckName: string) => AnkiDeck;
    };
    saveAs?: (blob: Blob, filename: string) => void;
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
```

**Files to create:**
- `types/window.d.ts`
- `types/anki-export.d.ts`

**Files to modify:**
- Remove all `@ts-ignore` comments
- Replace `as unknown as` with proper types

**Acceptance Criteria:**
- [ ] Zero `@ts-ignore` comments
- [ ] All window extensions properly typed
- [ ] TypeScript strict mode enabled
- [ ] No type errors in build

---

### TASK-011: Centralize Constants & Magic Numbers
**Priority:** LOW  
**Effort:** Low  
**Impact:** Low

**Problem:**
- Magic numbers scattered throughout code
- Some constants duplicated
- Hard to maintain

**Solution:**
```typescript
// constants.ts - Add these
export const UI_CONSTANTS = {
  CHAR_LIMIT: 280,
  DEBOUNCE_DELAY: 1000,
  TOAST_DURATION: 3000,
  TOOLTIP_OFFSET: 250,
  MAX_IMAGE_SIZE: 200 * 1024, // 200KB
  GRID_PREVIEW_LINES: 2,
} as const;

export const STORAGE_KEYS = {
  PAO_DATA: 'mindpalace_pao_data',
  CUSTOM_THEMES: 'mindpalace_custom_themes',
  USER_PREFERENCES: 'mindpalace_preferences',
} as const;

export const API_LIMITS = {
  REQUESTS_PER_MINUTE: 10,
  MAX_PROMPT_LENGTH: 2000,
  MAX_SCENE_LENGTH: 280,
} as const;
```

**Files to modify:**
- `constants.ts` - Add new constant groups
- All components using magic numbers

**Acceptance Criteria:**
- [ ] All magic numbers moved to constants
- [ ] Constants grouped logically
- [ ] Type-safe with `as const`
- [ ] Documented with JSDoc comments

---

### TASK-012: Add Custom Hooks
**Priority:** MEDIUM  
**Effort:** Medium  
**Impact:** Medium

**Problem:**
- Logic mixed with components
- Difficult to test
- Code reuse limited

**Solution:**
```
Create custom hooks:
1. useLocalStorage - Sync state with localStorage
2. useDebouncedValue - Generic debounce hook
3. useFirebaseSync - Handle Firebase operations
4. useKeyboardShortcuts - Keyboard event handling
5. useFocusTrap - Modal focus management
6. useToast - Toast notifications
```

**Files to create:**
```
hooks/
├── useLocalStorage.ts
├── useDebouncedValue.ts
├── useFirebaseSync.ts
├── useKeyboardShortcuts.ts
├── useFocusTrap.ts
├── useToast.ts
└── index.ts
```

**Example implementation:**
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

**Acceptance Criteria:**
- [ ] All hooks properly typed
- [ ] Unit tests for each hook
- [ ] Documentation with usage examples
- [ ] Exported from index.ts

---

## 🔵 Low Priority (Nice to Have)

### TASK-013: Add Undo/Redo Functionality
**Priority:** LOW  
**Effort:** High  
**Impact:** Medium

**Problem:**
- No way to undo accidental changes
- Users fear making mistakes
- No change history

**Solution:**
```
1. Implement command pattern
2. Store action history
3. Add undo/redo buttons
4. Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
```

**Files to create:**
- `hooks/useHistory.ts`
- `utils/commandPattern.ts`

**Acceptance Criteria:**
- [ ] Undo last 20 actions
- [ ] Redo undone actions
- [ ] Keyboard shortcuts work
- [ ] Visual indicator of undo availability

---

### TASK-014: Bulk Import/Export
**Priority:** LOW  
**Effort:** Medium  
**Impact:** Medium

**Problem:**
- No way to import existing PAO systems
- Can't bulk edit
- Manual entry tedious for 100 items

**Solution:**
```
1. CSV import functionality
2. JSON export/import
3. Bulk edit mode
4. Template download
```

**Files to create:**
- `components/import/BulkImport.tsx`
- `utils/csvParser.ts`

**Acceptance Criteria:**
- [ ] Import CSV with validation
- [ ] Export full system as JSON
- [ ] Template CSV downloadable
- [ ] Error handling for malformed data

---

### TASK-015: Search & Filter in Grid
**Priority:** LOW  
**Effort:** Low  
**Impact:** Medium

**Problem:**
- Hard to find specific characters
- No filtering options
- Can't search by theme

**Solution:**
```
1. Add search bar above grid
2. Filter by completion status
3. Filter by theme/category
4. Fuzzy search on person/action/object
```

**Files to modify:**
- `components/PAOGrid.tsx`

**Files to create:**
- `components/grid/SearchBar.tsx`
- `components/grid/FilterPanel.tsx`
- `utils/fuzzySearch.ts`

**Acceptance Criteria:**
- [ ] Real-time search as you type
- [ ] Multiple filter options
- [ ] Clear filters button
- [ ] Show result count

---

### TASK-016: Progressive Web App (PWA)
**Priority:** LOW  
**Effort:** Medium  
**Impact:** High

**Problem:**
- Not installable
- No offline support
- No push notifications

**Solution:**
```
1. Add service worker
2. Create manifest.json
3. Implement offline mode
4. Add install prompt
```

**Files to create:**
- `public/manifest.json`
- `public/sw.js`
- `components/InstallPrompt.tsx`

**Acceptance Criteria:**
- [ ] App installable on mobile/desktop
- [ ] Works offline with cached data
- [ ] Sync when back online
- [ ] Custom install prompt

---

### TASK-017: Analytics & Usage Tracking
**Priority:** LOW  
**Effort:** Low  
**Impact:** Low

**Problem:**
- No insight into user behavior
- Can't measure feature usage
- No error tracking

**Solution:**
```
1. Add Google Analytics or Plausible
2. Track feature usage
3. Error tracking with Sentry
4. Performance monitoring
```

**Files to create:**
- `services/analytics.ts`
- `utils/errorTracking.ts`

**Acceptance Criteria:**
- [ ] Privacy-friendly analytics
- [ ] Track key user actions
- [ ] Error reports sent to Sentry
- [ ] Performance metrics collected

---

### TASK-018: Theme Customization
**Priority:** LOW  
**Effort:** Medium  
**Impact:** Low

**Problem:**
- Hardcoded dark theme
- No customization options
- Some users prefer light mode

**Solution:**
```
1. Add light/dark mode toggle
2. Custom color schemes
3. Font size adjustment
4. Persist preferences
```

**Files to create:**
- `contexts/ThemeContext.tsx`
- `components/settings/ThemeSelector.tsx`

**Acceptance Criteria:**
- [ ] Light/dark mode toggle
- [ ] System preference detection
- [ ] Smooth theme transitions
- [ ] Preferences saved

---

### TASK-019: Testing Suite
**Priority:** MEDIUM  
**Effort:** High  
**Impact:** High

**Problem:**
- No tests
- Refactoring is risky
- Bugs slip through

**Solution:**
```
1. Unit tests for utilities
2. Component tests with React Testing Library
3. Integration tests for critical flows
4. E2E tests with Playwright
```

**Files to create:**
```
tests/
├── unit/
│   ├── calculateMajorNumber.test.ts
│   ├── validation.test.ts
│   └── sanitization.test.ts
├── components/
│   ├── PAOGrid.test.tsx
│   ├── PAOEditor.test.tsx
│   └── ReverseLookup.test.tsx
├── integration/
│   └── paoWorkflow.test.tsx
└── e2e/
    └── fullUserJourney.spec.ts
```

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

**Acceptance Criteria:**
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] CI/CD runs tests automatically
- [ ] Test documentation

---

### TASK-020: Documentation Improvements
**Priority:** LOW  
**Effort:** Low  
**Impact:** Medium

**Problem:**
- No inline documentation
- Missing contribution guide
- No architecture docs

**Solution:**
```
1. Add JSDoc comments
2. Create CONTRIBUTING.md
3. Architecture decision records
4. Component documentation
```

**Files to create:**
- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `docs/COMPONENTS.md`
- `docs/API.md`

**Acceptance Criteria:**
- [ ] All public functions have JSDoc
- [ ] Contributing guide complete
- [ ] Architecture documented
- [ ] Setup guide for new developers

---

## 📊 Implementation Roadmap

### Phase 1: Security & Stability (Week 1-2)
- TASK-001: Secure API Key Management
- TASK-002: Multi-User Support
- TASK-003: Input Sanitization
- TASK-005: Error Handling

### Phase 2: Performance & UX (Week 3-4)
- TASK-004: Debounced Auto-Save
- TASK-006: Optimize Storage
- TASK-007: Accessibility
- TASK-008: Environment Variables

### Phase 3: Code Quality (Week 5-6)
- TASK-009: Extract Shared Components
- TASK-010: Improve Type Safety
- TASK-011: Centralize Constants
- TASK-012: Add Custom Hooks

### Phase 4: Features & Polish (Week 7-8)
- TASK-013: Undo/Redo
- TASK-014: Bulk Import/Export
- TASK-015: Search & Filter
- TASK-019: Testing Suite

### Phase 5: Production Ready (Week 9-10)
- TASK-016: PWA Support
- TASK-017: Analytics
- TASK-018: Theme Customization
- TASK-020: Documentation

---

## 🎯 Quick Wins (Can be done in <2 hours each)

1. **TASK-008**: Environment variable refactor
2. **TASK-011**: Centralize constants
3. **TASK-003**: Basic input validation
4. **TASK-004**: Debounced save
5. **TASK-010**: Fix TypeScript issues

---

## 📝 Notes

- Prioritize security tasks before adding new features
- Test each change thoroughly before moving to next task
- Keep commits small and focused
- Update documentation as you go
- Consider breaking large tasks into smaller subtasks

---

## 🤝 Contributing

When working on these tasks:
1. Create a new branch: `git checkout -b task-XXX-description`
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit PR with reference to task number

---

**Last Updated:** 2025-11-23
**Total Tasks:** 20
**Estimated Total Effort:** 10-12 weeks (1 developer)
