# Pull Mechanism Documentation

The pull mechanism allows users to restore their PAO data from the server to a new device. Unlike sync (which is continuous and bidirectional), pull is a one-time operation designed for new device setup and data recovery.

## 🎯 Use Cases

1.  **New Device Setup**: User signs in on a new device and pulls their data.
2.  **Fresh Start**: User clears local data and pulls a fresh copy from the server.
3.  **Data Recovery**: User lost local data and needs to restore from a cloud backup.

## 🔧 Component Overview

### Core Files

*   **`services/pullService.ts`**: Service logic for interacting with remote persistence and `localStorage`.
*   **`components/DataPull.tsx`**: The main UI component for managing pulls and local data clearing.
*   **`hooks/usePullData.ts`**: A custom hook that exposes loading states and pull actions.

## 🔄 How It Works

1.  **Check Authentication**: Only authenticated users can pull data.
2.  **Verify Local State**: By default, the system prevents pulling if local data already exists to avoid accidental overwrites.
3.  **Fetch from Cloud**:
    -   First, it attempts to load all **Versions**.
    -   If no versions exist, it falls back to the **Legacy PAO List**.
4.  **Save to Device**: Data is saved to `localStorage`, and the active version is updated.

## 🎮 UI Reference

The `DataPull` component provides:
*   **Server Availability**: Shows if data is available on the server and how many items/versions exist.
*   **One-Click Pull**: Restores data with a single click.
*   **Clear Local Data**: Allows users to wipe their local device data (requires confirmation).

## 🚀 Integration Guide

To add the pull mechanism to a new location (e.g., User Profile or Settings):

```typescript
import { DataPull } from './components/DataPull';

<DataPull onPullComplete={() => window.location.reload()} />
```

## 🛡️ Safety Features

*   **Auth Required**: Prevents unauthorized access to server data.
*   **Overwrite Prevention**: Won't pull if `pao_data` is already present locally.
*   **Destructive Action Warnings**: "Clear Local Data" requires manual confirmation.
*   **Error Resilience**: Failed pulls are caught and reported via toast notifications without crashing the app.

## 📋 Troubleshooting

| Issue | Potential Cause | Solution |
|-------|-----------------|----------|
| Pull button disabled | Not authenticated or no server data. | Sign in or ensure cloud data exists. |
| Pull button disabled | Local data already exists. | Clear local data first. |
| Pull fails | Network connectivity or config issue. | Check internet and `.env` credentials. |
| Data not appearing | UI needs a refresh. | Reload the page after a successful pull. |

---
*Status: Production Ready*
*Last Updated: December 2025*
