# MemoDirector 🎬

MemoDirector is a "Movie Studio for your Mind." It is a specialized application designed to help memory athletes and learners build, manage, and visualize a **PAO (Person-Action-Object)** memory system using the Major System.

It leverages **Google Gemini AI** to automatically suggest characters, actions, and objects based on phonetic rules, and uses **remote persistence** for cloud synchronization (with a LocalStorage fallback).

## 🚀 Features

*   **Major System Grid:** Visual 00-99 grid management.
*   **AI Casting Director:** Uses Google Gemini to suggest PAO sets that fit strict phonetic rules.
*   **Director's Cut:** AI generation of vivid, multi-sensory scenes to aid memory retention.
*   **Talent Scout (Reverse Lookup):** Type a character name (e.g., "Tony Stark") to see if they fit better as #10 (Initials T-S) or #12 (Phonetic T-N).
*   **Anki Export:** Export your deck to `.apkg` format for spaced repetition practice.
*   **Backup & Restore:** Export your PAO data to CSV format and restore from backups with smart merge strategies.
*   **LocalStorage-First Sync:** ⚡ Instant saves to your device with automatic cloud backup every 30 seconds.
*   **Offline Support:** Works completely offline - sync happens automatically when you're back online.
*   **Manual Sync Control:** Force immediate cloud backup with the sync button in the header.

## 🛠️ Installation & Setup

### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/your-username/memodirector.git
cd memodirector
npm install
```

### 2. Environment Configuration

The application relies on environment variables for the AI features and Database connectivity.

Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

#### A. Google Gemini API (Required for AI Suggestions)

1.  Go to [Google AI Studio](https://aistudio.google.com/apikey).
2.  Create a new API Key.
3.  Add it to your `.env` file:

```env
VITE_GEMINI_API_KEY=your_google_ai_studio_key_here
```

#### B. Cloud Sync (Optional - For Cloud Backup)

If you skip this, the app will default to **LocalStorage**, which works perfectly for a single device.

1.  Create a project at [Supabase](https://supabase.com).
2.  Obtain the **Project URL** and **Anon Key**.
3.  Copy the configuration values into your `.env` file:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> **Note:** All environment variables now use the `VITE_` prefix as per Vite conventions. The application code ( `services/db.ts` ) automatically detects if these keys are present. If not, it falls back to LocalStorage without errors.

### 3. Running the App

Start the development server:

```bash
npm start
# or
npm run dev
```

## 📂 Project Structure

*   `src/components`: UI Components (Grid, Editor, Stats, etc.).
*   `src/services`: External integrations.
    -   `geminiService.ts`: Handles prompts and communication with Google GenAI SDK.
    -   `db.ts`: Handles data persistence (Remote Persistence / LocalStorage logic).
*   `src/constants.ts`: Major System phonetic rules and calculation logic.
*   `src/types.ts`: TypeScript interfaces.

## 🧠 How the AI Logic Works

The app uses specific prompts in `geminiService.ts` to enforce Major System rules:

1.  **Strict Mode:** Forces the AI to find a Person, Action, *and* Object that all phonetically match the target number (e.g., for #15 (T-L), it might suggest "Ted Lasso", "Toiling", "Tool").
2.  **Standard Mode:** Finds a Person fitting the phonetic rule, but allows the Action and Object to be thematically iconic to that person (e.g., "Thor" (14) -> "Throwing" -> "Hammer").

## 🌐 Live Demo

**Live URL:** https://memodirector.web.app

The app is automatically deployed to cloud hosting when changes are pushed to the `main` branch.

## 📚 Documentation

For detailed documentation, development guides, and project status reports, see the [docs](docs/) directory:

* [Quick Start Guide](docs/QUICK_START.md)
* [Backup & Restore Guide](docs/BACKUP_RESTORE.md) - **NEW!** Export and restore your PAO data
* [Sync Strategy](docs/SYNC_STRATEGY.md) - Learn about LocalStorage-first sync
* [Sync Migration Guide](docs/SYNC_MIGRATION.md) - What changed and how to use it
* [Deployment Guide](docs/DEPLOYMENT.md)
* [Refactoring Guide](docs/REFACTORING_GUIDE.md)
* [Testing Report](docs/TESTING_REPORT.md)
* [And more...](docs/README.md)

## 📜 License

MIT
