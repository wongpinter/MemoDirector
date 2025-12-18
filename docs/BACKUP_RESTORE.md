# Backup & Restore Feature

## Overview

The Backup & Restore feature allows you to export your PAO (Person-Action-Object) data to CSV format and restore it later. This is useful for:

* Creating offline backups of your memory palace data
* Transferring data between devices
* Sharing PAO systems with others
* Recovering from data loss
* Editing data in spreadsheet applications

## Location

The Backup & Restore interface is located in the **Production Stats** tab (Settings icon in the header).

## Features

### Export Backup

**What it does:**
* Exports all 100 PAO items (00-99) to a CSV file
* Includes all data: person, action, object, scene descriptions, media URLs, notes, completion status, and timestamps
* Automatically generates a timestamped filename (e.g.,  `pao-backup-2025-11-29T14-30-00.csv`)

**How to use:**
1. Click the "Export Backup" button
2. The CSV file will download automatically to your default downloads folder
3. You can open this file in Excel, Google Sheets, or any text editor

### Restore Backup

**What it does:**
* Imports PAO data from a CSV file
* Provides three merge strategies to handle conflicts
* Shows a preview before applying changes

**How to use:**
1. Click the "Restore Backup" button
2. Select a CSV file from your computer
3. Review the preview showing:
   - Number of items in current data
   - Number of items in backup file
   - Number of conflicting items (same numbers)
4. Choose a merge strategy (see below)
5. Click "Confirm Restore" to apply changes

## Merge Strategies

When restoring a backup, you can choose how to handle items that exist in both your current data and the backup file:

### 1. Merge - Keep Imported (Recommended)

* **Best for:** Restoring from a newer backup or updating your data
* **Behavior:** 
  + Adds new items from the backup
  + Updates existing items with data from the backup
  + Keeps all items from both sources
* **Example:** If you have item #42 locally and in the backup, the backup version will be used

### 2. Merge - Keep Existing

* **Best for:** Adding new items without overwriting your current work
* **Behavior:**
  + Adds new items from the backup
  + Keeps your current version for items that exist in both
  + Preserves all your local changes
* **Example:** If you have item #42 locally and in the backup, your local version will be kept

### 3. Replace All (Destructive)

* **Best for:** Complete restoration from backup
* **Behavior:**
  + Deletes all current data
  + Replaces with backup data only
  + **Warning:** This cannot be undone!
* **Example:** Your entire PAO system will be replaced with the backup

## CSV Format

The CSV file uses the following structure:

```csv
Number,Person,Action,Object,Scene,ImageUrl,VideoUrl,Notes,Completed,LastModified
0,Albert Einstein,Writing equations,Chalk,Einstein writing E=mc² on a blackboard,https://...,https://...,Phonetic: S/Z sound,true,1732896000000
1,Tom Hanks,Running,Feather,Tom Hanks running through a park with a feather floating,,,Phonetic: T/D sound,true,1732896100000
```

### Fields:

* **Number** (0-99): The number in the Major System
* **Person**: Character name
* **Action**: What they're doing
* **Object**: Associated object
* **Scene**: Detailed scene description
* **ImageUrl**: URL to generated/uploaded image
* **VideoUrl**: URL to generated/uploaded video
* **Notes**: Additional notes or phonetic explanations
* **Completed**: true/false - whether the PAO is complete
* **LastModified**: Unix timestamp of last modification

## Tips

1. **Regular Backups**: Export your data regularly, especially after completing significant work
2. **Version Control**: Keep multiple backup files with timestamps to track your progress
3. **Cloud Storage**: Store backups in cloud storage (Google Drive, Dropbox) for extra safety
4. **Editing in Spreadsheets**: You can edit the CSV in Excel/Sheets, but be careful with:
   - Number format (keep as 0-99)
   - Boolean values (use "true" or "false")
   - Commas in text (they're automatically escaped)
5. **Testing**: Try the restore feature with a small backup first to understand the merge strategies

## Troubleshooting

### "Import failed: Invalid CSV format"

* Ensure the file has the correct headers
* Check that the Number column contains valid integers (0-99)
* Verify the file is actually a CSV (not Excel .xlsx)

### "No valid items found in CSV"

* The CSV might be empty or corrupted
* Check that there's at least one data row after the header
* Ensure numbers are in the valid range (0-99)

### Lost data after restore

* If you accidentally used "Replace All", you'll need to restore from a previous backup
* Always keep multiple backup versions
* Consider testing with "Merge - Keep Existing" first

## Technical Details

* **File Format**: UTF-8 encoded CSV
* **Field Separator**: Comma (, )
* **Text Qualifier**: Double quotes (") for fields containing commas or newlines
* **Escape Character**: Double quotes are escaped as ""
* **Line Ending**: Standard newline (\n)

## Integration with Sync

The backup/restore feature works alongside the remote persistence sync:

* **Export**: Creates a point-in-time snapshot of your local data
* **Restore**: Updates local storage, which then syncs to remote persistence automatically
* **Conflicts**: Restore operations update the `lastModified` timestamp, helping with conflict resolution

## Future Enhancements

Potential improvements for future versions:
* Automatic scheduled backups
* Backup to cloud storage directly
* Import/export specific number ranges
* Backup history and comparison
* Undo restore operation
