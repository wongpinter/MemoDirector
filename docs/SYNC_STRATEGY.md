# LocalStorage-First Sync Strategy

## Overview

The app now uses a **LocalStorage-first** approach with **periodic Firebase sync** to ensure:
- ✅ **Instant saves** - No waiting for network requests
- ✅ **Offline support** - Works without internet connection
- ✅ **Data safety** - Changes saved immediately to device
- ✅ **Cloud backup** - Automatic sync to Firebase every 30 seconds
- ✅ **Manual control** - Sync button for immediate cloud backup

## How It Works

### 1. **Create/Edit PAO** (Form or Talent Scout)
```
User saves PAO
    ↓
Immediately saved to LocalStorage (< 1ms)
    ↓
Added to sync queue
    ↓
Status: "Pending Sync" (amber indicator)
```

### 2. **Periodic Sync** (Every 30 seconds)
```
Check if pending changes exist
    ↓
If yes: Sync to Firebase
    ↓
Status: "Syncing..." → "Synced" (green checkmark)
    ↓
Clear sync queue
```

### 3. **Manual Sync** (User clicks sync button)
```
User clicks sync button
    ↓
Immediately sync to Firebase
    ↓
Status: "Syncing..." → "Synced"
```

## Sync Status Indicators

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| **Idle** | Cloud | Gray | All synced, no pending changes |
| **Pending** | Clock | Amber | Changes saved locally, waiting for cloud sync |
| **Syncing** | Spinner | Blue | Currently syncing to Firebase |
| **Synced** | Check | Green | Successfully synced to cloud |
| **Error** | CloudOff | Red | Sync failed (data still safe in LocalStorage) |

## User Experience

### Creating PAO (Form)
1. User fills in Person, Action, Object
2. Clicks "Save PAO"
3. **Instant feedback** - Modal closes immediately
4. Data saved to LocalStorage (no delay)
5. Sync happens in background

### Creating PAO (Talent Scout)
1. User types character name (e.g., "Tony Stark")
2. Clicks "Cast" button
3. **Instant feedback** - Character assigned immediately
4. Data saved to LocalStorage (no delay)
5. Sync happens in background

### Manual Sync
- Sync button in header (next to status indicator)
- **Amber highlight** when pending changes exist
- Click to force immediate sync
- Useful before closing app or switching devices

## Technical Details

### Files Modified
- `services/syncQueue.ts` - New sync queue service
- `hooks/usePAOData.ts` - Updated to use LocalStorage-first
- `services/db.ts` - Simplified to only handle Firebase
- `App.tsx` - Added sync status UI and manual sync button
- `components/PAOEditor.tsx` - Added instant save indicator

### Key Functions

#### `saveToLocalStorage(items)`
Saves PAO items to LocalStorage immediately and adds to sync queue.

#### `syncToFirebase()`
Syncs queued items to Firebase and clears the queue on success.

#### `startPeriodicSync(callback)`
Starts a 30-second interval that checks for pending changes and syncs.

#### `loadPAOData()`
Loads data with LocalStorage-first strategy:
1. Check LocalStorage (instant)
2. If empty, try Firebase
3. If both empty, return empty array

### Storage Keys
- `pao_data` - Main PAO items array
- `pao_sync_queue` - Pending changes to sync
- `pao_last_sync` - Timestamp of last successful sync

## Benefits

### For Users
- **No loading spinners** when saving
- **Works offline** completely
- **Never lose data** even if Firebase is down
- **Visual feedback** on sync status
- **Control** with manual sync button

### For Developers
- **Simpler error handling** - LocalStorage rarely fails
- **Better UX** - No network delays
- **Resilient** - Works in all network conditions
- **Scalable** - Reduces Firebase write operations

## Edge Cases Handled

### No Internet Connection
- All saves work normally (LocalStorage)
- Sync status shows "Pending"
- Syncs automatically when connection restored

### Firebase Down
- All saves work normally (LocalStorage)
- Sync attempts fail gracefully
- Data remains safe locally
- Retries on next periodic sync

### Multiple Devices
- Each device has its own LocalStorage
- Manual sync before switching devices recommended
- Last write wins (no conflict resolution yet)

## Future Enhancements

1. **Conflict Resolution** - Merge changes from multiple devices
2. **Sync History** - Show last 10 sync events
3. **Selective Sync** - Only sync changed items (delta sync)
4. **Compression** - Compress data before Firebase upload
5. **User Authentication** - Per-user data isolation

## Testing

### Test Scenarios
1. ✅ Create PAO → Check LocalStorage → Wait 30s → Check Firebase
2. ✅ Create PAO offline → Go online → Verify auto-sync
3. ✅ Create PAO → Click manual sync → Verify immediate sync
4. ✅ Disable Firebase → Create PAO → Verify LocalStorage works
5. ✅ Create 10 PAOs rapidly → Verify all saved and synced

### Manual Testing
```bash
# 1. Open DevTools → Application → Local Storage
# 2. Create a PAO item
# 3. Verify 'pao_data' and 'pao_sync_queue' updated
# 4. Wait 30 seconds
# 5. Verify 'pao_sync_queue' cleared
# 6. Check Firebase Console for data
```

## Troubleshooting

### Sync Status Stuck on "Pending"
- Check browser console for errors
- Verify Firebase credentials in `.env`
- Try manual sync button
- Check network connectivity

### Data Not Syncing
- Open DevTools → Console
- Look for Firebase errors
- Verify `VITE_FIREBASE_*` env variables
- Check Firebase project permissions

### LocalStorage Full
- Browser limit: ~5-10MB
- Clear old data: `localStorage.clear()`
- Export to Anki before clearing

## Migration from Old System

The old system saved directly to Firebase on every change. The new system:
- Saves to LocalStorage first (instant)
- Syncs to Firebase periodically (background)
- No data loss during migration
- Existing Firebase data loaded on first run

Users don't need to do anything - migration is automatic!
