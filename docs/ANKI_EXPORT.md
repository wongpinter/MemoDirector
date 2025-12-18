# Anki Export Documentation

The Anki Export feature allows you to take your PAO data and transform it into study cards for the Anki flashcard system.

## 🚀 Key Features

*   ✅ **High Reliability**: Uses a simplified tab-separated text export that Anki supports natively. No external libraries or CDNs are required.
*   📚 **Version Support**: Export any PAO version you've created, not just the currently active one.
*   📝 **Dynamic Filenames**: Exported files are named based on the version (e.g.,  `pao_deck_movie_heroes.txt`), making it easy to manage multiple decks.
*   👁️ **Live Preview**: See a flip-card preview of exactly what will be exported before you download the file.

## 📥 How to Export

1.  Navigate to the **Anki Export** page in the app.
2.  Choose the **Version** you wish to export from the dropdown menu.
3.  Click **Export for Anki**.
4.  A `.txt` file will be downloaded to your device.

## 📤 How to Import into Anki

1.  Open Anki on your desktop.
2.  Go to **File** -> **Import**.
3.  Select the `.txt` file you just downloaded.
4.  Anki will automatically detect the settings:
    -   **Separator**: Tab
    -   **HTML**: Enabled (allows for bold text and styling)
5.  Click **Import**.

## 🔧 Technical Details

The exported file includes special directives at the top so Anki knows exactly how to handle the data:
*   `#separator:tab`
*   `#html:true`
*   `#deck:MemoDirector` (Default deck name)

## 📋 Best Practices

*   **Completion**: Only items marked as "Completed" in your PAO list will be exported as cards.
*   **Themed Decks**: Use the versioning system to create separate themed decks (e.g., "Historical Figures") and import them into separate Anki sub-decks for targeted practice.

---
*Status: Production Ready*
*Last Updated: December 2025*
