# Pull Mechanism Documentation

## Overview

The pull mechanism allows users to restore their PAO data from the server to a new device. Unlike sync (which is bidirectional and continuous), pull is a one-time operation that fetches data from Firebase to local storage.

## Use Cases

1. **New Device Setup**: User signs in on a new device and wants to restore their PAO data
2. **Fresh Start**: User wants to clear local data and pull a fresh copy from the server
3. **Data Recovery**: User lost local data and needs to restore from server backup

## Architecture

### Services

#### `pullService.ts`
Main service for pull operations with three key functions:

- **`pullPAODataFromServer()`**: Pulls PAO data and versions from Firebase
  - Checks if user is authenticated
  - Prevents pulling if local data already exists
  - Pulls versions first, falls back to legacy data
  - Saves pulled data to local storage
  - Returns `PullResult` with status and counts

- **`checkServerData()`**: Checks if user has data on the server
  - Returns item count and version count
  - Useful for UI to determine if pull is available
  - Non-destructive operation

- **`clearLocalData()`**: Clears all local storage data
  - Removes PAO data, versions, sync queue, and last sync time
  - Allows user to pull fresh data from server

### Components

#### `DataPull.tsx`
UI component for the pull mechanism with features:

- Displays server data availability
- Shows pull status and results
- Provides clear local data option with confirmation
- Integrates with toast notifications
- Responsive design matching app theme

### Hooks

#### `usePullData.ts`
Custom hook for managing pull operations:

```typescript
const {
  isLoading,        // Pull operation in progress
  isChecking,       // Server check in progress
  pullResult,       // Result of last pull operation
  serverData,       // Server data availability info
  checkServer,      // Function to check server data
  pull,             // Function to pull data
  clearLocal        // Function to clear local data
} = usePullData();
```

## Data Flow

### Pull Operation

```
User clicks "Pull Data"
    ↓
Check authentication
    ↓
Check if local data exists (prevent overwrite)
    ↓
Load versions from Firebase
    ↓
If no versions, load legacy PAO list
    ↓
Save to local storage
    ↓
Update UI with result
```

### Data Priority

1. **Versions**: If user has versions on server, pull all versions and activate the active one
2. **Legacy Data**: If no versions, pull legacy PAO list and create default version
3. **Empty**: If no data found, return empty result

## Integration

### In App Component

```typescript
import { DataPull } from './components/DataPull';

// Add to UI (typically in settings or onboarding)
<DataPull onPullComplete={() => {
  // Reload app or refresh data
  window.location.reload();
}} />
```

### Using Hook Directly

```typescript
import { usePullData } from './hooks/usePullData';

function MyComponent() {
  const { pull, isLoading, pullResult, serverData, checkServer } = usePullData();
  
  useEffect(() => {
    checkServer();
  }, []);
  
  const handlePull = async () => {
    const result = await pull();
    if (result.success) {
      // Handle success
    }
  };
  
  return (
    <button onClick={handlePull} disabled={isLoading}>
      {isLoading ? 'Pulling...' : 'Pull Data'}
    </button>
  );
}
```

## Safety Features

1. **Authentication Check**: Only authenticated users can pull data
2. **Local Data Protection**: Won't pull if local data already exists
3. **Confirmation Dialog**: Requires confirmation before clearing local data
4. **Error Handling**: Graceful error messages for network issues
5. **Timestamp-based Merge**: Uses `lastModified` timestamps for conflict resolution

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "User must be authenticated" | User not signed in | Sign in first |
| "Local data already exists" | Device already has data | Clear local data first |
| "Failed to pull data from server" | Network issue | Check connection and retry |
| "No data found on server" | User has no server data | Create data first |

## Comparison: Pull vs Sync

| Feature | Pull | Sync |
|---------|------|------|
| Direction | Server → Local | Bidirectional |
| Frequency | One-time | Continuous |
| Conflict Resolution | Server wins | Timestamp-based |
| Use Case | New device setup | Ongoing updates |
| Data Protection | Prevents overwrite | Merges data |

## Best Practices

1. **After Sign In**: Offer pull option if local data is empty
2. **Clear Before Pull**: Suggest clearing local data if user wants fresh copy
3. **Feedback**: Show progress and results to user
4. **Reload After Pull**: Reload app to ensure UI reflects pulled data
5. **Versioning**: Ensure versions are properly set up before pulling

## Future Enhancements

1. **Selective Pull**: Allow pulling specific versions
2. **Merge Option**: Option to merge instead of replace
3. **Scheduled Pull**: Automatic pull on first sign in
4. **Conflict Resolution UI**: Visual conflict resolution for advanced users
5. **Pull History**: Track pull operations for audit trail

## Testing

### Manual Testing

1. Create data on one device
2. Sign in on new device
3. Verify pull option appears
4. Click pull and verify data is restored
5. Verify versions are preserved
6. Test clear local data functionality

### Edge Cases

- Pull with no server data
- Pull with corrupted local data
- Pull with network disconnection
- Pull with multiple versions
- Pull with legacy data format
