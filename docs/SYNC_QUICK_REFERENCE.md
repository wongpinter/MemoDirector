# Sync System - Quick Reference Card

## 🎯 What You Need to Know

### The Basics
- ✅ **Saves are instant** - No waiting for the cloud
- ✅ **Works offline** - Create PAOs anywhere
- ✅ **Auto-syncs** - Cloud backup every 30 seconds
- ✅ **Manual control** - Sync button when you need it

## 📍 Where to Look

### Sync Status (Top Right)
```
☁️ 2:30 PM     = All synced
🕐 Pending     = Waiting to sync
⟳ Syncing...   = Uploading now
✓ Synced       = Just uploaded
☁️✗ Error      = Sync failed (data safe)
```

### Manual Sync Button
- **Gray** = Normal
- **Amber** = You have pending changes
- **Spinning** = Currently syncing

## 🎬 Common Actions

### Creating a PAO
1. Click any card
2. Fill in Person, Action, Object
3. Click "Save PAO"
4. ✅ **Done!** (Saved instantly)

### Using Talent Scout
1. Type character name
2. Click "Cast"
3. ✅ **Done!** (Saved instantly)

### Manual Sync
1. Look for amber sync button
2. Click it
3. Wait 1-2 seconds
4. ✅ **Done!** (Synced to cloud)

## 🌐 Working Offline

### What Works
- ✅ Create PAO items
- ✅ Edit PAO items
- ✅ Delete PAO items
- ✅ Use Talent Scout
- ✅ View all data

### What Doesn't Work
- ❌ AI suggestions (needs internet)
- ❌ Cloud sync (obviously)
- ❌ Image/video generation

### When Back Online
- Sync happens automatically
- Or click manual sync button
- All changes upload to cloud

## ⚠️ Important Tips

### Before Closing Browser
- Check sync status
- If "Pending", click manual sync
- Wait for "Synced" confirmation
- Now safe to close

### Before Switching Devices
1. Click manual sync on Device A
2. Wait for "Synced"
3. Open app on Device B
4. Refresh if needed

### If You See "Error"
- Don't panic! Data is safe locally
- Check internet connection
- Try manual sync again
- Or wait for next auto-sync (30s)

## 🔧 Troubleshooting

### Problem: Sync stuck on "Pending"
**Fix:** Click manual sync button

### Problem: Changes not on other device
**Fix:** Manual sync on first device, refresh second device

### Problem: Sync button does nothing
**Fix:** Check browser console (F12), verify Firebase config

### Problem: "Error" won't go away
**Fix:** Check internet, verify `.env` file, restart browser

## 📱 Mobile Tips

- Status shows icon only (no text)
- Tap sync button to force sync
- Works offline perfectly
- Syncs when connection restored

## ⌨️ Keyboard Shortcuts

- **Tab** to focus sync button
- **Enter** or **Space** to sync
- **Esc** to close editor (saves automatically)

## 🎓 Learn More

- **Full Guide:** `docs/SYNC_MIGRATION.md`
- **Visual Guide:** `docs/SYNC_UI_GUIDE.md`
- **Technical Details:** `docs/SYNC_STRATEGY.md`

## 💡 Pro Tips

1. **Sync before closing** - Click manual sync before closing browser
2. **Watch the indicator** - Amber = pending, Green = synced
3. **Work offline freely** - Everything saves locally
4. **Manual sync is instant** - Don't wait 30 seconds
5. **Data is always safe** - LocalStorage never fails

## ❓ Quick FAQ

**Q: Do I need internet?**
A: No! Works completely offline.

**Q: Will I lose data?**
A: No! Saves to device instantly.

**Q: How often does it sync?**
A: Every 30 seconds automatically.

**Q: Can I force sync?**
A: Yes! Click the sync button.

**Q: What if sync fails?**
A: Data is safe locally, will retry.

**Q: How do I know it's synced?**
A: Green checkmark appears.

**Q: Can I disable auto-sync?**
A: Not currently, but you can work offline.

**Q: What about multiple devices?**
A: Manual sync before switching.

## 🎉 That's It!

The sync system is designed to be **invisible when it works** and **obvious when it needs attention**.

Just create your PAOs and let the app handle the rest! 🚀

---

**Need Help?** Check the full documentation in `docs/` folder.
