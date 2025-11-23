# Sync UI Guide

## Visual Overview

This guide shows you where to find sync-related UI elements and what they mean.

## Header Sync Indicator

Located in the **top-right** of the screen, next to the navigation tabs:

```
┌─────────────────────────────────────────────────────────┐
│  MemoDirector    [Status] [🔄]  [Grid][Search][Stats]  │
└─────────────────────────────────────────────────────────┘
                      ↑       ↑
                   Status   Manual
                  Indicator  Sync
```

### Status Indicator States

#### 1. Idle (All Synced)
```
☁️ 2:30 PM
```
- Gray cloud icon
- Shows last sync time
- No pending changes

#### 2. Pending Sync
```
🕐 Pending Sync
```
- Amber clock icon
- Changes saved locally
- Will sync in <30 seconds

#### 3. Syncing
```
⟳ Syncing to Cloud...
```
- Blue spinning icon
- Currently uploading to Firebase
- Usually takes 1-2 seconds

#### 4. Synced
```
✓ Synced
```
- Green checkmark
- Successfully saved to cloud
- Appears for 2 seconds then returns to Idle

#### 5. Sync Error
```
☁️✗ Sync Error
```
- Red cloud-off icon
- Sync failed (data still safe locally)
- Will retry on next periodic sync

### Manual Sync Button

The **refresh button** (🔄) next to the status indicator:

#### Normal State
- Gray icon
- Hover to see tooltip: "Sync to Firebase"
- Click to force immediate sync

#### Pending State
- **Amber background** (glowing)
- Indicates you have unsaved changes in the cloud
- Click to sync immediately

#### Syncing State
- Spinning animation
- Button disabled during sync
- Re-enables when sync completes

## PAO Editor Footer

At the bottom of the PAO editor modal:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Person, Action, Object fields...]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ● Saves instantly to device • Syncs to cloud auto │
│                                    [Cancel] [Save]  │
└─────────────────────────────────────────────────────┘
```

### Indicator Meaning
- **Green pulsing dot** = Real-time save indicator
- **Text** = Explains the save behavior
- Reassures users that saves are instant

## Interaction Examples

### Example 1: Creating a PAO Item

```
1. User opens PAO Editor
   Status: ☁️ 2:30 PM (Idle)

2. User fills in Person, Action, Object
   Status: ☁️ 2:30 PM (Idle)

3. User clicks "Save PAO"
   → Editor closes instantly
   → Status: 🕐 Pending Sync

4. After 30 seconds (or manual sync)
   → Status: ⟳ Syncing to Cloud...
   → Status: ✓ Synced (2 seconds)
   → Status: ☁️ 2:32 PM (Idle)
```

### Example 2: Using Talent Scout

```
1. User types "Tony Stark"
   Status: ☁️ 2:30 PM (Idle)

2. User clicks "Cast" button
   → Character assigned instantly
   → Status: 🕐 Pending Sync

3. User clicks manual sync button
   → Status: ⟳ Syncing to Cloud...
   → Status: ✓ Synced
   → Status: ☁️ 2:30 PM (Idle)
```

### Example 3: Working Offline

```
1. User goes offline (no internet)
   Status: ☁️ 2:30 PM (Idle)

2. User creates 5 PAO items
   → All save instantly to LocalStorage
   → Status: 🕐 Pending Sync

3. Periodic sync attempts (fails silently)
   → Status: 🕐 Pending Sync (stays)

4. User goes back online
   → Next periodic sync succeeds
   → Status: ⟳ Syncing to Cloud...
   → Status: ✓ Synced
   → Status: ☁️ 2:35 PM (Idle)
```

### Example 4: Manual Sync Before Closing

```
1. User makes several changes
   Status: 🕐 Pending Sync
   Sync button: 🟡 Amber (glowing)

2. User about to close browser
   → Clicks manual sync button

3. Immediate sync
   → Status: ⟳ Syncing to Cloud...
   → Status: ✓ Synced
   → Sync button: Gray (normal)

4. User can safely close browser
   → All data backed up to cloud
```

## Mobile View

On mobile devices (< 640px width):

```
┌──────────────────────────────┐
│  MemoDirector  [🕐] [🔄]    │
│  [Grid][Search][Stats]       │
└──────────────────────────────┘
```

- Status text hidden (icon only)
- Manual sync button always visible
- Tap sync button for immediate backup

## Accessibility

### Keyboard Navigation
- **Tab** to focus sync button
- **Enter** or **Space** to trigger sync

### Screen Readers
- Status indicator announces changes
- Sync button has descriptive label
- Success/error states announced

### Color Blind Support
- Icons used in addition to colors
- Text labels on desktop view
- Clear visual states

## Tips for Users

### When to Watch the Sync Indicator

1. **After bulk edits** - Wait for "Synced" before closing
2. **Before switching devices** - Ensure cloud is up-to-date
3. **When offline** - Check for "Pending" when back online
4. **After errors** - Verify sync recovered

### When to Use Manual Sync

1. **Before closing app** - Ensure cloud backup
2. **After important changes** - Don't wait 30 seconds
3. **Before switching devices** - Sync now, load there
4. **When "Pending" too long** - Force immediate sync

### Understanding Sync Timing

- **LocalStorage save**: < 1ms (instant)
- **Periodic sync**: Every 30 seconds
- **Manual sync**: Immediate (1-2 seconds)
- **Network delay**: Varies (100-500ms typical)

## Troubleshooting UI Issues

### Status Stuck on "Pending"
**What you see:** 🕐 Pending Sync (never changes)

**Solutions:**
1. Click manual sync button
2. Check browser console (F12)
3. Verify internet connection
4. Check Firebase credentials

### Sync Button Not Responding
**What you see:** Button click does nothing

**Solutions:**
1. Check if already syncing (spinning icon)
2. Refresh the page
3. Check browser console for errors
4. Verify Firebase is configured

### Status Shows Error
**What you see:** ☁️✗ Sync Error

**Don't panic!** Your data is safe in LocalStorage.

**Solutions:**
1. Check internet connection
2. Wait for next periodic sync (30s)
3. Try manual sync
4. Check Firebase Console for issues

## Developer Notes

### Customizing Sync Interval

Edit `services/syncQueue.ts`:

```typescript
const SYNC_INTERVAL = 30000; // 30 seconds (default)
// Change to 60000 for 1 minute
// Change to 10000 for 10 seconds
```

### Customizing Status Display Duration

Edit `constants.ts`:

```typescript
SAVE_STATUS_DISPLAY_DURATION: 2000, // 2 seconds (default)
// Change to 3000 for 3 seconds
```

### Adding Custom Sync Triggers

In `App.tsx`, you can trigger sync on custom events:

```typescript
// Example: Sync on window blur (user switching tabs)
useEffect(() => {
  const handleBlur = () => {
    if (hasPendingSync) {
      manualSync();
    }
  };
  
  window.addEventListener('blur', handleBlur);
  return () => window.removeEventListener('blur', handleBlur);
}, [hasPendingSync, manualSync]);
```

## Summary

The sync UI provides:
- ✅ **Clear status** - Always know sync state
- ✅ **Manual control** - Sync when you want
- ✅ **Visual feedback** - Icons and colors
- ✅ **Mobile friendly** - Works on all screens
- ✅ **Accessible** - Keyboard and screen reader support

The goal is to make syncing **invisible** when it works, and **obvious** when it needs attention!
