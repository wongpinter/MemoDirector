# Pull Mechanism - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DataPull Component (components/DataPull.tsx)        │  │
│  │  - Server data display                               │  │
│  │  - Pull button & progress                            │  │
│  │  - Clear local data option                           │  │
│  │  - Toast notifications                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hook Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  usePullData Hook (hooks/usePullData.ts)             │  │
│  │  - State management                                  │  │
│  │  - Loading states                                    │  │
│  │  - Result tracking                                   │  │
│  │  - Callback functions                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pullService.ts                                      │  │
│  │  - pullPAODataFromServer()                           │  │
│  │  - checkServerData()                                 │  │
│  │  - clearLocalData()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                              ↓
    ┌─────────────┐            ┌──────────────────┐
    │ Firebase    │            │ LocalStorage     │
    │ (Server)    │            │ (Client)         │
    │             │            │                  │
    │ - Versions  │            │ - pao_data       │
    │ - PAO Items │            │ - pao_versions   │
    │ - User Data │            │ - pao_active_v   │
    └─────────────┘            └──────────────────┘
```

## Component Hierarchy

```
App
├── UserProfile (optional location)
│   └── DataPull
│       ├── Server Data Display
│       ├── Pull Button
│       ├── Clear Local Button
│       └── Toast Notifications
│
├── AuthModal (optional location)
│   └── DataPull
│
└── Settings (optional location)
    └── DataPull
```

## Data Flow Diagram

### Pull Operation Flow

```
START
  ↓
Check Authentication
  ├─ NO → Return Error: "Not authenticated"
  └─ YES ↓
Check Local Data
  ├─ EXISTS → Return Error: "Local data exists"
  └─ EMPTY ↓
Load Versions from Firebase
  ├─ SUCCESS ↓
  │   Save Versions to LocalStorage
  │   Get Active Version
  │   Extract Items from Active Version
  │   ↓
  └─ FAIL ↓
    Load Legacy PAO List from Firebase
      ├─ SUCCESS ↓
      │   Create Default Version
      │   Save to LocalStorage
      │   ↓
      └─ FAIL → Return Error: "No data on server"
Save Items to LocalStorage
  ↓
Update Active Version
  ↓
Return Success with Counts
  ↓
END
```

### Check Server Data Flow

```
START
  ↓
Check Authentication
  ├─ NO → Return: hasData=false
  └─ YES ↓
Load Versions from Firebase
  ├─ SUCCESS ↓
  │   Count Versions
  │   Get Active Version Items Count
  │   ↓
  └─ FAIL ↓
    Load Legacy PAO List
      ├─ SUCCESS ↓
      │   Count Items
      │   ↓
      └─ FAIL → Return: hasData=false
Return: hasData=true, counts
  ↓
END
```

## State Management

### Component State (DataPull.tsx)

```typescript
{
  isLoading: boolean,           // Pull operation in progress
  hasLocalData: boolean,        // Local data exists
  serverData: {                 // Server data info
    hasData: boolean,
    itemsCount: number,
    versionsCount: number
  },
  pullResult: {                 // Last pull result
    success: boolean,
    itemsCount: number,
    versionsCount: number,
    error?: string,
    message?: string
  },
  showClearConfirm: boolean     // Clear confirmation dialog
}
```

### Hook State (usePullData.ts)

```typescript
{
  isLoading: boolean,           // Pull in progress
  isChecking: boolean,          // Server check in progress
  pullResult: PullResult | null,
  serverData: ServerDataInfo | null
}
```

## Service Functions

### pullService.ts

```
pullPAODataFromServer()
├─ Check authentication
├─ Check local data
├─ Load versions from Firebase
├─ Fallback to legacy data
├─ Create default version if needed
├─ Save to local storage
└─ Return PullResult

checkServerData()
├─ Check authentication
├─ Load versions from Firebase
├─ Count items and versions
├─ Fallback to legacy data
└─ Return ServerDataInfo

clearLocalData()
├─ Remove pao_data
├─ Remove pao_versions
├─ Remove pao_sync_queue
├─ Remove pao_last_sync
└─ Log success
```

## Integration Points

### With Authentication (services/auth.ts)

```
pullService.ts
  ├─ Uses: isAnonymousMode()
  ├─ Uses: getCurrentUserId()
  └─ Checks: isAuthenticated()
```

### With Database (services/db.ts)

```
pullService.ts
  ├─ Uses: loadPAOList()
  └─ Uses: loadVersions()
```

### With Version Manager (services/versionManager.ts)

```
pullService.ts
  ├─ Uses: saveVersions()
  ├─ Uses: getActiveVersion()
  ├─ Uses: createDefaultVersion()
  └─ Uses: updateVersion()
```

### With Sync Queue (services/syncQueue.ts)

```
pullService.ts
  └─ Uses: saveToLocalStorage()
```

### With Toast Context (contexts/ToastContext.tsx)

```
DataPull.tsx
  └─ Uses: useToast()
```

## Error Handling Strategy

```
Error Type          → Handler                    → User Message
─────────────────────────────────────────────────────────────
Not Authenticated   → Return error              → "Must be authenticated"
Local Data Exists   → Return error              → "Local data exists"
Network Error       → Catch & return error      → "Check connection"
No Server Data      → Return empty result       → "No data on server"
Firebase Error      → Catch & return error      → "Failed to pull"
Invalid Data        → Fallback to legacy        → (Transparent)
```

## Security Model

```
Authentication Layer
├─ Only authenticated users can pull
├─ User ID isolation (UID-based paths)
└─ No sensitive data in logs

Data Protection Layer
├─ Won't overwrite existing local data
├─ Requires confirmation for destructive actions
└─ Timestamp-based conflict resolution

Storage Layer
├─ LocalStorage for client-side data
├─ Firebase for server-side data
└─ HTTPS for all communications
```

## Performance Optimization

```
Lazy Loading
├─ Data only pulled when requested
└─ No background operations

Efficient Storage
├─ Uses existing localStorage structure
├─ No duplicate data
└─ Minimal memory footprint

Batch Operations
├─ Pull all versions at once
├─ Single localStorage write
└─ Minimal network calls
```

## Scalability Considerations

```
Current Implementation
├─ Supports up to 100 PAO items
├─ Supports unlimited versions
├─ Supports multiple users (isolated by UID)
└─ Handles network failures gracefully

Future Enhancements
├─ Selective version pull
├─ Incremental sync
├─ Compression for large datasets
└─ Offline queue for failed pulls
```

## Testing Architecture

```
Unit Tests
├─ pullService functions
├─ usePullData hook
└─ DataPull component

Integration Tests
├─ Pull with Firebase
├─ Pull with LocalStorage
└─ Pull with versions

E2E Tests
├─ New device setup
├─ Data restoration
├─ Error scenarios
└─ UI interactions
```

## Deployment Architecture

```
Development
├─ Local Firebase emulator
├─ LocalStorage in browser
└─ Console logging

Staging
├─ Firebase staging project
├─ Real data (test user)
└─ Error tracking

Production
├─ Firebase production project
├─ Real user data
├─ Error monitoring
└─ Performance tracking
```

## Monitoring & Logging

```
Logs Generated
├─ 🔄 Starting pull from Firebase...
├─ ✅ Pulled X versions from Firebase
├─ ✅ Using active version: X
├─ ✅ Pulled X items from Firebase
├─ ✅ Created default version from pulled data
├─ ✅ Saved X items to local storage
├─ ✅ Pull operation completed
└─ ❌ Error messages for failures

Metrics to Track
├─ Pull success rate
├─ Average pull time
├─ Data size pulled
├─ Error frequency
└─ User adoption
```

## Related Systems

```
Pull Mechanism
├─ Sync System (services/syncQueue.ts)
│  └─ Continuous bidirectional sync
├─ Version System (services/versionManager.ts)
│  └─ Multiple version management
├─ Auth System (services/auth.ts)
│  └─ User authentication
└─ Database System (services/db.ts)
   └─ Firebase operations
```

## Future Architecture Enhancements

```
Proposed Enhancements
├─ Selective Pull
│  └─ Pull specific versions only
├─ Merge Option
│  └─ Merge instead of replace
├─ Scheduled Pull
│  └─ Automatic pull on first sign in
├─ Pull History
│  └─ Track pull operations
└─ Conflict Resolution UI
   └─ Visual conflict resolution
```
