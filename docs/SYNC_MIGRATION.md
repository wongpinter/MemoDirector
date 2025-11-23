# Sync System Migration Guide

## What Changed?

Your PAO data is now saved **instantly to your device** and synced to Firebase automatically in the background. This makes the app faster and more reliable!

## Key Improvements

### Before (Old System)
- ❌ Waited for Firebase on every save
- ❌ Slow when network is poor
- ❌ Could lose data if Firebase failed
- ❌ No offline support

### After (New System)
- ✅ **Instant saves** to LocalStorage
- ✅ **Works offline** completely
- ✅ **Auto-sync** every 30 seconds
- ✅ **Manual sync** button for control
- ✅ **Never lose data** even if cloud is down

## What You'll Notice

### 1. Faster Saves
When you save a PAO item, the editor closes **immediately**. No more waiting!

### 2. New Sync Indicator
Look at the top-right of the screen:
- 🟢 **Green check** = Synced to cloud
- 🟡 **Amber clock** = Pending sync (will sync in <30s)
- 🔵 **Blue spinner** = Currently syncing
- 🔴 **Red cloud** = Sync error (data still safe locally)

### 3. Manual Sync Button
Next to the sync indicator, there's a refresh button:
- Click it to **force immediate sync** to Firebase
- Useful before closing the app or switching devices
- Glows **amber** when you have pending changes

## Do I Need to Do Anything?

**No!** The migration is automatic:
1. Your existing Firebase data is loaded on first run
2. All new saves go to LocalStorage first
3. Syncing happens automatically in the background

## Best Practices

### When to Use Manual Sync
- Before closing the browser
- Before switching to another device
- After making many changes quickly
- When you want to ensure cloud backup

### Working Offline
1. Create/edit PAO items as normal
2. Status shows "Pending Sync"
3. When you go online, sync happens automatically
4. Or click manual sync button

### Multiple Devices
1. Make changes on Device A
2. Click manual sync (or wait 30s)
3. Refresh app on Device B
4. Changes appear automatically

## Troubleshooting

### "Pending Sync" Won't Clear
**Solution:** Click the manual sync button

### Changes Not Appearing on Other Device
**Solution:** 
1. Click manual sync on first device
2. Refresh browser on second device

### Sync Error Message
**Don't worry!** Your data is safe in LocalStorage.
**Solution:**
1. Check internet connection
2. Verify Firebase credentials in `.env`
3. Try manual sync again

### Want to Force Re-sync from Firebase?
```javascript
// Open browser console (F12)
localStorage.clear();
location.reload();
```
This will reload all data from Firebase.

## Technical Details

### Where is Data Stored?

#### LocalStorage (Primary)
- Location: Browser's LocalStorage
- Key: `pao_data`
- Speed: Instant (<1ms)
- Persistence: Until you clear browser data

#### Firebase (Backup)
- Location: Cloud Firestore
- Path: `users/default_user/pao/list`
- Speed: 100-500ms (network dependent)
- Persistence: Forever (until deleted)

### Sync Frequency
- **Automatic:** Every 30 seconds (if changes exist)
- **Manual:** Instant (when you click sync button)
- **On Load:** Checks Firebase for updates

## FAQ

### Q: Will I lose data if I clear browser cache?
**A:** LocalStorage data will be lost, but your data is backed up in Firebase. Just reload the app and it will sync from cloud.

### Q: Can I disable auto-sync?
**A:** Not currently, but you can work offline and sync manually when ready.

### Q: How much data can LocalStorage hold?
**A:** About 5-10MB, which is enough for thousands of PAO items.

### Q: What if Firebase and LocalStorage have different data?
**A:** Currently, LocalStorage is the source of truth. Conflict resolution is planned for future updates.

### Q: Can I export my LocalStorage data?
**A:** Yes! Use the Anki Export feature to download your data as `.apkg` file.

## Rollback (If Needed)

If you experience issues, you can temporarily revert to the old system:

1. Open `hooks/usePAOData.ts`
2. Comment out the new sync code
3. Uncomment the old Firebase-direct code
4. Reload the app

(Not recommended - the new system is more reliable!)

## Support

If you encounter any issues:
1. Check browser console (F12) for errors
2. Verify `.env` file has correct Firebase credentials
3. Try manual sync button
4. Clear LocalStorage and reload from Firebase
5. Open an issue on GitHub with console logs

## Summary

The new sync system makes your app:
- ⚡ **Faster** - Instant saves
- 🛡️ **Safer** - Data never lost
- 🌐 **Offline-ready** - Works without internet
- 🎮 **User-friendly** - Clear status indicators

Enjoy the improved experience! 🎉
