# PAO Versioning Documentation

The PAO Versioning system allows users to create and manage multiple versions of their Person-Action-Object system. This enables experimentation with different themes (e.g., Movie Characters vs. Historical Figures) without losing previous work.

## 🚀 Key Features

*   📚 **Multiple Versions**: Create unlimited PAO versions, each with its own set of 00-99 items.
*   🔄 **Instant Switching**: Switch between versions in the header dropdown. The app reloads with the new data immediately.
*   📋 **Cloning**: Duplicate an existing version to start a new variation based on your current work.
*   📊 **Stats Integration**: Compare completion progress and fidelity across all versions side-by-side in the Stats page.
*   📤 **Anki Export**: Choose exactly which version you want to export to your Anki decks.

## 🎮 UI Reference

### Version Selector

Located in the header (📚 icon).
*   **Active Indicator**: The currently active version is marked with a checkmark or highlighted in green.
*   **Quick Actions**: Edit, duplicate, or delete versions directly from the dropdown.

### Create Version Modal

*   **Name**: Required identifier.
*   **Copy from current**: Toggle to start with a clone of your active version instead of a fresh empty list.

## 🔧 Technical Overview

### Data Structure

Each version is self-contained:

```typescript
interface PAOVersion {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: PAOItem[]; // Complete 00-99 list
}
```

### Storage and Sync

*   **LocalStorage**: All version metadata and items are cached locally for instant access.
*   **Remote Persistence**: Versions are synced to the cloud (Supabase) every 30 seconds.
*   **Conflict Resolution**: Uses timestamp-based comparison to ensure the latest changes are preserved across devices.

## 📋 Best Practices

1.  **Iterative Refinement**: Keep a "Master" version and create experimental versions to test new character assignments.
2.  **Naming**: Use descriptive names like "Strict PAO v2" or "Fictional Characters" for easier identification.
3.  **Active Version**: Only the active version is editable in the Grid; other versions are view-only when inspected in the Stats or Export pages.

---
*Status: Production Ready*
*Last Updated: December 2025*
