# Sync System Testing Guide

## Manual Testing Checklist

Use this checklist to verify the sync system works correctly.

### ✅ Test 1: Basic Save to LocalStorage

**Steps:**
1. Open the app
2. Click any PAO card (e.g., #00)
3. Fill in Person: "Test Person"
4. Fill in Action: "Testing"
5. Fill in Object: "Test Object"
6. Click "Save PAO"

**Expected Results:**
- ✅ Editor closes immediately (< 100ms)
- ✅ Card shows "Test Person" instantly
- ✅ Status indicator shows "Pending Sync" (amber clock)
- ✅ Open DevTools → Application → Local Storage
- ✅ Verify `pao_data` contains the new item
- ✅ Verify `pao_sync_queue` exists

**Pass/Fail:** ___________

---

### ✅ Test 2: Periodic Sync to Firebase

**Prerequisites:** Firebase configured in `.env`

**Steps:**
1. Complete Test 1
2. Wait 30 seconds
3. Watch the status indicator

**Expected Results:**
- ✅ Status changes to "Syncing to Cloud..." (blue spinner)
- ✅ Status changes to "Synced" (green check) after 1-2 seconds
- ✅ Status changes to "Idle" with timestamp after 2 seconds
- ✅ Open DevTools → Application → Local Storage
- ✅ Verify `pao_sync_queue` is removed
- ✅ Verify `pao_last_sync` has a timestamp
- ✅ Open Firebase Console → Firestore
- ✅ Verify data exists at `users/default_user/pao/list`

**Pass/Fail:** ___________

---

### ✅ Test 3: Manual Sync

**Steps:**
1. Create a new PAO item (any number)
2. Verify status shows "Pending Sync"
3. Click the manual sync button (🔄) in header
4. Watch the status indicator

**Expected Results:**
- ✅ Sync button has amber background before click
- ✅ Status immediately changes to "Syncing to Cloud..."
- ✅ Sync button shows spinning animation
- ✅ Status changes to "Synced" after 1-2 seconds
- ✅ Sync button returns to normal (gray)
- ✅ Firebase Console shows updated data

**Pass/Fail:** ___________

---

### ✅ Test 4: Talent Scout Quick Add

**Steps:**
1. Click "Search" tab (Talent Scout)
2. Type "Tony Stark" in the input
3. Wait for results to appear
4. Click "Cast" button on one of the results
5. Watch the status indicator

**Expected Results:**
- ✅ Success message appears immediately
- ✅ Input field clears
- ✅ Status shows "Pending Sync"
- ✅ Switch to "Grid" tab
- ✅ Verify "Tony Stark" appears on the assigned card
- ✅ LocalStorage updated immediately
- ✅ Sync happens within 30 seconds

**Pass/Fail:** ___________

---

### ✅ Test 5: Offline Mode

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Create a new PAO item
4. Click "Save PAO"
5. Check status indicator
6. Set throttling back to "Online"
7. Wait 30 seconds

**Expected Results:**
- ✅ Save works normally while offline
- ✅ Editor closes immediately
- ✅ Status shows "Pending Sync"
- ✅ LocalStorage updated
- ✅ When back online, sync happens automatically
- ✅ Status changes to "Synced"
- ✅ Firebase receives the data

**Pass/Fail:** ___________

---

### ✅ Test 6: Multiple Rapid Saves

**Steps:**
1. Create 5 PAO items rapidly (one after another)
2. Don't wait for sync between saves
3. Watch the status indicator
4. Wait 30 seconds after last save

**Expected Results:**
- ✅ All 5 saves complete instantly
- ✅ Status shows "Pending Sync" throughout
- ✅ All 5 items visible in grid immediately
- ✅ LocalStorage contains all 5 items
- ✅ After 30 seconds, single sync uploads all changes
- ✅ Firebase contains all 5 items

**Pass/Fail:** ___________

---

### ✅ Test 7: Firebase Disabled

**Steps:**
1. Rename `.env` to `.env.backup` (disable Firebase)
2. Reload the app
3. Create a new PAO item
4. Check console for errors

**Expected Results:**
- ✅ App loads without errors
- ✅ Console shows "Firebase config not found. Using LocalStorage mode."
- ✅ Save works normally
- ✅ Status shows "Pending Sync"
- ✅ No Firebase errors in console
- ✅ LocalStorage updated correctly
- ✅ Periodic sync attempts don't crash the app

**Pass/Fail:** ___________

**Cleanup:** Rename `.env.backup` back to `.env`

---

### ✅ Test 8: Load from LocalStorage

**Steps:**
1. Create 3 PAO items
2. Wait for sync to complete
3. Close the browser tab
4. Open the app in a new tab
5. Watch the loading process

**Expected Results:**
- ✅ App loads instantly (no Firebase wait)
- ✅ All 3 items appear immediately
- ✅ Console shows "Loaded from LocalStorage"
- ✅ Status shows last sync time
- ✅ No loading spinner for data

**Pass/Fail:** ___________

---

### ✅ Test 9: Load from Firebase (Fresh Install)

**Steps:**
1. Open DevTools → Application → Local Storage
2. Click "Clear All" to delete all local data
3. Reload the app
4. Watch the loading process

**Expected Results:**
- ✅ App shows "Opening Studio..." loading message
- ✅ Data loads from Firebase
- ✅ All previously saved items appear
- ✅ LocalStorage is populated with Firebase data
- ✅ Console shows "Loaded from LocalStorage" (after initial Firebase load)

**Pass/Fail:** ___________

---

### ✅ Test 10: Sync Error Handling

**Steps:**
1. Create a PAO item
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Wait 30 seconds (or click manual sync)
5. Watch status indicator
6. Set throttling back to "Online"
7. Wait 30 seconds

**Expected Results:**
- ✅ Sync attempt fails silently (no crash)
- ✅ Status shows "Sync Error" (red cloud)
- ✅ Data still safe in LocalStorage
- ✅ When back online, next sync succeeds
- ✅ Status changes to "Synced"
- ✅ Firebase receives the data

**Pass/Fail:** ___________

---

## Automated Testing (Future)

### Unit Tests Needed

```typescript
// services/syncQueue.test.ts
describe('syncQueue', () => {
  test('saveToLocalStorage saves data immediately', () => {
    // Test implementation
  });
  
  test('hasPendingSync returns true when queue exists', () => {
    // Test implementation
  });
  
  test('syncToFirebase clears queue on success', () => {
    // Test implementation
  });
  
  test('loadPAOData prefers LocalStorage over Firebase', () => {
    // Test implementation
  });
});
```

### Integration Tests Needed

```typescript
// hooks/usePAOData.test.ts
describe('usePAOData', () => {
  test('updateItem saves to LocalStorage immediately', () => {
    // Test implementation
  });
  
  test('periodic sync triggers after 30 seconds', () => {
    // Test implementation
  });
  
  test('manualSync forces immediate sync', () => {
    // Test implementation
  });
});
```

### E2E Tests Needed

```typescript
// e2e/sync.spec.ts
describe('Sync System E2E', () => {
  test('user can create PAO and see it sync', () => {
    // Playwright/Cypress test
  });
  
  test('user can work offline and sync when online', () => {
    // Playwright/Cypress test
  });
});
```

## Performance Benchmarks

### Target Metrics

| Operation | Target | Acceptable | Poor |
|-----------|--------|------------|------|
| Save to LocalStorage | < 1ms | < 10ms | > 10ms |
| Load from LocalStorage | < 5ms | < 50ms | > 50ms |
| Sync to Firebase | < 500ms | < 2s | > 2s |
| UI Response (Save button) | < 100ms | < 300ms | > 300ms |

### How to Measure

```javascript
// Open browser console
console.time('save');
// Click Save PAO button
console.timeEnd('save');
// Should show: save: 0.5ms (or similar)
```

## Browser Compatibility

Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Known Issues

### Issue 1: LocalStorage Quota Exceeded
**Symptom:** Error when saving after many items
**Workaround:** Export to Anki and clear old data
**Fix:** Implement data compression (future)

### Issue 2: Sync Conflicts (Multiple Devices)
**Symptom:** Data from Device A overwrites Device B
**Workaround:** Manual sync before switching devices
**Fix:** Implement conflict resolution (future)

### Issue 3: Stale Firebase Data
**Symptom:** Old data appears after clearing LocalStorage
**Workaround:** Manual sync from the device with latest data
**Fix:** Add timestamp comparison (future)

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Basic Save | ⬜ | |
| 2. Periodic Sync | ⬜ | |
| 3. Manual Sync | ⬜ | |
| 4. Talent Scout | ⬜ | |
| 5. Offline Mode | ⬜ | |
| 6. Rapid Saves | ⬜ | |
| 7. Firebase Disabled | ⬜ | |
| 8. Load LocalStorage | ⬜ | |
| 9. Load Firebase | ⬜ | |
| 10. Error Handling | ⬜ | |

**Overall Status:** ⬜ Pass / ⬜ Fail

**Tested By:** ___________

**Date:** ___________

**Browser:** ___________

**Notes:**
```
[Add any additional observations or issues here]
```

## Reporting Issues

If you find a bug during testing:

1. Note which test failed
2. Copy browser console logs
3. Note browser and OS version
4. Describe expected vs actual behavior
5. Include steps to reproduce
6. Open GitHub issue with details

## Success Criteria

The sync system is considered working if:

- ✅ All 10 tests pass
- ✅ No console errors during normal use
- ✅ Data never lost (even with Firebase down)
- ✅ Saves feel instant (< 100ms UI response)
- ✅ Syncs complete within 30 seconds
- ✅ Works offline completely
- ✅ Manual sync always works when online

## Next Steps After Testing

1. ✅ Fix any failing tests
2. ✅ Document any workarounds needed
3. ✅ Add automated tests for critical paths
4. ✅ Performance optimization if needed
5. ✅ User acceptance testing
6. ✅ Deploy to production
