# PAO Versioning Feature

## Overview

The PAO Versioning feature allows users to create and manage multiple versions of their PAO (Person-Action-Object) system. This enables experimentation with different themes, characters, and approaches without losing previous work.

## Key Features

### 1. Multiple Versions
- Create unlimited PAO versions
- Each version maintains its own complete set of 00-99 PAO items
- Switch between versions instantly

### 2. Version Management
- **Create New Version**: Start fresh or copy from active version
- **Switch Active Version**: Change which version you're currently working on
- **Edit Version**: Rename and update descriptions
- **Duplicate Version**: Clone an existing version to create variations
- **Delete Version**: Remove versions you no longer need (minimum 1 version required)

### 3. Use Cases

#### Theme-Based Versions
Create different themed PAO systems:
- Movie characters
- Historical figures
- Athletes
- Musicians
- Fictional characters

#### Rule-Based Versions
Experiment with different PAO rules:
- Strict person/action/object categories
- Relaxed interpretations
- Language-specific versions
- Cultural variations

#### Progressive Refinement
- Keep your original PAO as a backup
- Create new versions to test improvements
- Compare different approaches
- Gradually refine without losing progress

## User Interface

### Version Selector
Located in the header next to the app title:
- Shows current active version name
- Click to open version dropdown
- Visual indicator (📚) for easy identification

### Version Dropdown
- List of all versions with metadata
- Active version highlighted in green
- Quick actions for each version:
  - ✏️ Edit name and description
  - 📋 Duplicate version
  - 🗑️ Delete version
- "Create New Version" button at bottom

### Create Version Modal
- Version name (required)
- Description (optional)
- Option to copy from active version
- Creates empty version if not copying

## Technical Implementation

### Data Structure

```typescript
interface PAOVersion {
  id: string;                 // Unique identifier
  name: string;               // User-friendly name
  description?: string;       // Optional description
  createdAt: number;          // Creation timestamp
  lastModified: number;       // Last modification timestamp
  isActive: boolean;          // Currently active version
  items: PAOItem[];          // Complete PAO data (00-99)
}
```

### Storage Strategy

#### LocalStorage-First
- All versions stored in LocalStorage for instant access
- Active version ID tracked separately
- No network latency for version switching

#### Firebase Sync
- Periodic sync of all versions to Firebase
- Conflict resolution based on timestamps
- Offline-capable with automatic sync when online

### Migration

Existing PAO data is automatically migrated to a "Default" version on first use. This ensures backward compatibility and preserves all existing work.

## Usage Guide

### Creating Your First Additional Version

1. Click the version selector (📚) in the header
2. Click "Create New Version"
3. Enter a name (e.g., "Movie Characters")
4. Optionally add a description
5. Choose whether to copy from current version
6. Click "Create"

### Switching Versions

1. Click the version selector
2. Click on any non-active version
3. The app reloads with the selected version's data

### Editing a Version

1. Open the version dropdown
2. Click the edit icon (✏️) next to the version
3. Modify name and/or description
4. Click "Save"

### Duplicating a Version

1. Open the version dropdown
2. Click the duplicate icon (📋)
3. Enter a name for the copy
4. The duplicated version is created with all data copied

### Deleting a Version

1. Open the version dropdown
2. Click the delete icon (🗑️)
3. Confirm deletion
4. If deleting the active version, the first remaining version becomes active

## Best Practices

### Naming Conventions
- Use descriptive names: "Movie Heroes", "Historical Figures"
- Include theme or purpose: "Strict Rules v1", "Relaxed Interpretation"
- Add version numbers for iterations: "Main v2", "Experimental v3"

### Organization
- Keep a "Main" or "Default" version as your primary system
- Create experimental versions for testing new ideas
- Use descriptions to document the purpose or rules of each version

### Backup Strategy
- Versions are automatically synced to Firebase
- Use the Backup/Restore feature for additional safety
- Export important versions to CSV periodically

## Keyboard Shortcuts

Currently, version management is mouse/touch-driven. Future updates may include:
- `Ctrl/Cmd + V`: Open version selector
- `Ctrl/Cmd + N`: Create new version
- Number keys: Quick switch between first 9 versions

## Troubleshooting

### Version Not Switching
- Check that you clicked on a different version (not the active one)
- Refresh the page if the UI doesn't update
- Check browser console for errors

### Lost Data After Switching
- Data is not lost, it's in the other version
- Switch back to the previous version to access that data
- Each version maintains its own complete dataset

### Sync Issues
- Versions sync automatically every 30 seconds
- Use the manual sync button if needed
- Check Firebase configuration if sync fails

## Future Enhancements

Potential future features:
- Version comparison view
- Merge versions
- Import/export individual versions
- Version history and rollback
- Collaborative version sharing
- Version templates
- Bulk operations across versions

## API Reference

### Version Manager Service

```typescript
// Load all versions
loadVersions(): PAOVersion[]

// Create new version
createVersion(name: string, description?: string, copyFromActive?: boolean): PAOVersion

// Update version metadata
updateVersion(versionId: string, updates: Partial<PAOVersion>): PAOVersion | null

// Delete version
deleteVersion(versionId: string): boolean

// Switch active version
switchActiveVersion(versionId: string): boolean

// Duplicate version
duplicateVersion(versionId: string, newName: string): PAOVersion | null

// Get active version
getActiveVersion(): PAOVersion | null

// Migrate existing data
migrateToVersioning(existingItems: PAOItem[]): void
```

## Integration with Stats Page

The Statistics page has been updated to fully support versioning:

### Version Selector
- Dropdown menu to view stats for any version
- Shows which version is currently active
- Switch between versions to compare progress

### Version Comparison Table
When you have multiple versions, the Stats page displays a comparison table showing:
- Version name and description
- Completion count (X/100)
- Progress percentage with visual bar
- Number of items with scenes
- Last modified date
- Active version highlighted

### Interactive Matrix
- Click on any number in the matrix to edit (only for active version)
- View-only mode when viewing non-active versions
- Visual indicators show completion status per version

### Features
- All statistics (completion %, decade breakdown, milestones) update based on selected version
- Compare progress across different PAO systems
- Identify which versions need more work
- Track completion trends over time

## Related Features

- **Backup/Restore**: Export all versions or specific versions
- **Sync System**: Automatic cloud backup of all versions
- **Stats**: View completion stats per version with comparison table
- **Anki Export**: Export specific version to Anki

## Support

For issues or questions about PAO versioning:
1. Check this documentation
2. Review the troubleshooting section
3. Check browser console for error messages
4. Verify Firebase connection for sync issues
