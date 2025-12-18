# Sync System Documentation

The MemoDirector sync system uses a **Local-first, Cloud-backed** architecture. This ensures that data is always saved instantly to the device and synced to remote persistence in the background.

## 🚀 Key Features

*   ⚡ **Instant Saves**: All PAO creations and edits save to `localStorage` immediately (< 1ms).
*   🌐 **Offline Ready**: Full functionality without an internet connection.
*   🔄 **Automatic Sync**: Pending changes are synced to remote persistence every 30 seconds.
*   🎮 **Manual Control**: A sync button in the header allows users to force an immediate cloud backup.
*   🛡️ **Data Safety**: Data is never lost; if the cloud is down, it stays safe on the device until sync is possible.

## 🎨 UI Reference

### Sync Status Indicators

Located in the top-right header:

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| **Idle** | ☁️ | Gray | All data synced, no pending changes. |
| **Pending** | 🕐 | Amber | Changes saved locally, waiting for auto-sync. |
| **Syncing** | ⟳ | Blue | Currently uploading to remote persistence. |
| **Synced** | ✓ | Green | Successfully synced (displays for 2 seconds). |
| **Error** | ☁️✗ | Red | Sync failed. Data is safe locally and will retry. |

### Manual Sync Button (🔄)

*   **Amber Glow**: Indicates there are pending changes.
*   **Spinning**: Indicates a sync is in progress.
*   **Action**: Click to force an immediate sync to remote persistence.

## 🔧 Technical Overview

### Storage Strategy

1.  **Primary**: Browser `localStorage` (Key: `pao_data`).
2.  **Backup**: Remote Persistence (Supabase).
3.  **Sync Queue**: Tracks pending changes in `localStorage` (Key: `pao_sync_queue`).

### Performance

| Operation | Latency |
|-----------|---------|
| Local Save | < 1ms |
| Local Load | < 5ms |
| Remote Sync| 100-500ms (Network dependent) |

## 📋 Troubleshooting & FAQ

### "Pending Sync" Won't Clear

*   **Solution**: Click the manual sync button. Check your internet connection.

### Changes Not Appearing on Other Devices

*   **Solution**: Ensure you clicked manual sync on the first device before switching. Refresh the app on the second device.

### Will I lose data if I clear my browser cache?

LocalStorage data will be lost, but your data is backed up in remote persistence. Reloading the app will fetch it back from the cloud.

### Common Issues

*   **Multiple Device Conflicts**: The system currently uses "Last Write Wins". Manual sync is recommended before switching devices.
*   **Storage Limits**: Browser `localStorage` is typically 5-10MB, which is plenty for thousands of PAO items.

---
*Status: Production Ready*
*Last Updated: December 2025*
