# Pull Mechanism - Quick Reference

## Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| `services/pullService.ts` | Core pull logic | 180 |
| `components/DataPull.tsx` | UI component | 180 |
| `hooks/usePullData.ts` | Custom hook | 70 |
| `services/versionManager.ts` | Updated with `createDefaultVersion()` | - |
| `contexts/ToastContext.tsx` | Updated `showToast()` | - |

## Quick Start

### 1. Add Component to UI
```typescript
import { DataPull } from './components/DataPull';

<DataPull onPullComplete={() => window.location.reload()} />
```

### 2. Use Hook
```typescript
import { usePullData } from './hooks/usePullData';

const { pull, isLoading, pullResult } = usePullData();
```

### 3. Use Service Directly
```typescript
import { pullPAODataFromServer, checkServerData } from './services/pullService';

const result = await pullPAODataFromServer();
const info = await checkServerData();
```

## API Reference

### pullService.ts

#### `pullPAODataFromServer()`
Pulls PAO data from Firebase to local storage.

```typescript
const result = await pullPAODataFromServer();
// Returns: {
//   success: boolean,
//   itemsCount: number,
//   versionsCount: number,
//   error?: string,
//   message?: string
// }
```

#### `checkServerData()`
Checks if user has data on server.

```typescript
const info = await checkServerData();
// Returns: {
//   hasData: boolean,
//   itemsCount: number,
//   versionsCount: number,
//   error?: string
// }
```

#### `clearLocalData()`
Clears all local storage data.

```typescript
clearLocalData();
```

### usePullData Hook

```typescript
const {
  isLoading,      // Pull operation in progress
  isChecking,     // Server check in progress
  pullResult,     // Result of last pull
  serverData,     // Server data info
  checkServer,    // () => Promise<ServerDataInfo>
  pull,           // () => Promise<PullResult>
  clearLocal      // () => boolean
} = usePullData();
```

### DataPull Component

```typescript
<DataPull 
  onPullComplete={() => {
    // Called when pull completes successfully
  }}
/>
```

## Common Patterns

### Pattern 1: Simple Pull Button
```typescript
import { usePullData } from './hooks/usePullData';

function PullButton() {
  const { pull, isLoading } = usePullData();
  
  return (
    <button onClick={() => pull()} disabled={isLoading}>
      {isLoading ? 'Pulling...' : 'Pull Data'}
    </button>
  );
}
```

### Pattern 2: Check Before Pull
```typescript
import { usePullData } from './hooks/usePullData';
import { useEffect } from 'react';

function PullWithCheck() {
  const { checkServer, pull, serverData } = usePullData();
  
  useEffect(() => {
    checkServer();
  }, []);
  
  if (!serverData?.hasData) {
    return <p>No data on server</p>;
  }
  
  return <button onClick={() => pull()}>Pull Data</button>;
}
```

### Pattern 3: Full Component
```typescript
import { DataPull } from './components/DataPull';

function Settings() {
  return (
    <div>
      <h2>Data Management</h2>
      <DataPull onPullComplete={() => {
        window.location.reload();
      }} />
    </div>
  );
}
```

## Integration Locations

### Option A: User Profile
```typescript
// In components/UserProfile.tsx
<div className="mt-6 pt-6 border-t border-slate-700">
  <h3>Data Management</h3>
  <DataPull onPullComplete={() => window.location.reload()} />
</div>
```

### Option B: Auth Modal
```typescript
// In components/AuthModal.tsx
{showPull && (
  <DataPull onPullComplete={() => {
    onSuccess?.();
  }} />
)}
```

### Option C: Settings Page
```typescript
// New component
export function DataSettings() {
  return <DataPull onPullComplete={() => window.location.reload()} />;
}
```

## Error Handling

```typescript
const result = await pullPAODataFromServer();

if (!result.success) {
  console.error(result.error);
  // Handle error
} else {
  console.log(`Pulled ${result.itemsCount} items`);
  // Handle success
}
```

## State Management

### Check if Pull is Available
```typescript
const info = await checkServerData();
const canPull = info.hasData && !hasLocalData;
```

### Track Pull Progress
```typescript
const { isLoading, pullResult } = usePullData();

if (isLoading) {
  // Show loading state
}

if (pullResult?.success) {
  // Show success
}

if (pullResult?.error) {
  // Show error
}
```

## UI States

### Loading
```typescript
{isLoading && <Loader2 className="animate-spin" />}
```

### Success
```typescript
{pullResult?.success && (
  <div className="text-emerald-200">
    ✅ Pulled {pullResult.itemsCount} items
  </div>
)}
```

### Error
```typescript
{pullResult?.error && (
  <div className="text-red-200">
    ❌ {pullResult.error}
  </div>
)}
```

## Testing

### Test Pull Success
1. Create data on device A
2. Sign in on device B
3. Click pull
4. Verify data appears

### Test Pull Failure
1. Sign in without server data
2. Click pull
3. Verify error message

### Test Clear Local
1. Have local data
2. Click "Clear Local"
3. Confirm
4. Verify data cleared

## Debugging

### Enable Logging
```typescript
// In pullService.ts, logs are already included:
console.log('🔄 Starting pull from Firebase...');
console.log('✅ Pulled X versions from Firebase');
console.log('✅ Saved X items to local storage');
```

### Check Browser Console
- Look for pull operation logs
- Check for error messages
- Verify Firebase calls

### Check LocalStorage
```javascript
// In browser console
localStorage.getItem('pao_data')
localStorage.getItem('pao_versions')
localStorage.getItem('pao_active_version')
```

## Performance Tips

1. **Lazy Load** - Only pull when needed
2. **Check First** - Use `checkServerData()` before pull
3. **Batch Operations** - Pull all data at once
4. **Cache Results** - Store pull result to avoid repeated calls

## Security Notes

1. Only authenticated users can pull
2. User data is isolated by UID
3. No sensitive data in logs
4. HTTPS required for Firebase

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Pull button disabled | Check auth, server data, local data |
| Pull fails | Check connection, Firebase config |
| Data not appearing | Reload page, check console |
| Clear not working | Check localStorage permissions |

## Related Documentation

- `PULL_MECHANISM.md` - Full technical documentation
- `PULL_INTEGRATION_GUIDE.md` - Integration instructions
- `PULL_FEATURE_SUMMARY.md` - Feature overview

## Version Info

- Created: November 2025
- Status: Production Ready
- Dependencies: Firebase, React, Tailwind CSS
- Breaking Changes: None
