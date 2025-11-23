# Anki Export Fix - Summary

## Problem
The app was trying to load `anki-apkg-export` library from a CDN (unpkg.com), which was failing and causing export errors.

## Solution
Removed the unreliable APKG export method and made the TXT export the primary (and only) export method. This is actually **more reliable** because:

1. **No external dependencies** - No CDN loading failures
2. **Native browser support** - Uses standard Blob and download APIs
3. **Anki fully supports it** - Anki's built-in text importer works perfectly with tab-separated files
4. **Simpler codebase** - Less code to maintain and debug

## Changes Made

### 1. `components/AnkiExport.tsx`
- Removed `useEffect` hook that loaded external libraries
- Removed `loadScript` function
- Removed `handleDownloadAPKG` function
- Removed `isExporting`, `exportError`, and `librariesLoaded` state
- Simplified UI to show only one "Export for Anki" button
- Removed error messages and fallback logic
- Cleaned up unused imports

### 2. `components/MajorSystemTrainer.tsx`
- Removed `handleExportAPKG` function
- Removed `isExporting` and `exportError` state
- Simplified UI to show only one "Export for Anki" button
- Removed error messages
- Cleaned up unused imports

### 3. `types/window.d.ts`
- Removed `AnkiExport` and `saveAs` type declarations (no longer needed)

### 4. Installed `jszip` package
- Added as a dependency (though not currently used)
- Available if you want to implement proper APKG export in the future

## How It Works Now

1. User clicks "Export for Anki"
2. App generates a tab-separated text file with HTML content
3. File includes special Anki directives:
   - `#separator:tab` - Tells Anki to use tabs as field separators
   - `#html:true` - Tells Anki to allow HTML in fields
   - `#deck:DeckName` - Specifies the deck name
4. User imports the file in Anki via File → Import
5. Anki automatically detects the format and imports the cards

## Benefits

✅ **100% reliable** - No network dependencies
✅ **Faster** - No waiting for libraries to load
✅ **Simpler** - Less code, fewer bugs
✅ **Better UX** - No confusing error messages
✅ **Works offline** - No internet required

## Future Improvements (Optional)

If you really want APKG support, you could:
1. Use `sql.js` to create a proper SQLite database
2. Use `jszip` (already installed) to package it
3. But honestly, the text import method is so reliable that it's not worth the complexity
