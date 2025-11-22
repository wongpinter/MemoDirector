# MemoDirector 🎬

MemoDirector is a "Movie Studio for your Mind." It is a specialized application designed to help memory athletes and learners build, manage, and visualize a **PAO (Person-Action-Object)** memory system using the Major System.

It leverages **Google Gemini AI** to automatically suggest characters, actions, and objects based on phonetic rules, and uses **Firebase** for cloud synchronization (with a LocalStorage fallback).

## 🚀 Features

*   **Major System Grid:** Visual 00-99 grid management.
*   **AI Casting Director:** Uses Google Gemini to suggest PAO sets that fit strict phonetic rules.
*   **Director's Cut:** AI generation of vivid, multi-sensory scenes to aid memory retention.
*   **Talent Scout (Reverse Lookup):** Type a character name (e.g., "Tony Stark") to see if they fit better as #10 (Initials T-S) or #12 (Phonetic T-N).
*   **Anki Export:** Export your deck to `.apkg` format for spaced repetition practice.
*   **Cloud Sync:** Optional Firebase integration to sync data across devices.

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

Create a `.env` file in the root of your project.

#### A. Google Gemini API (Required for AI Suggestions)

1.  Go to [Google AI Studio](https://aistudiocdn.com/google-api-key).
2.  Create a new API Key.
3.  Add it to your `.env` file:

```env
API_KEY=your_google_ai_studio_key_here
```

#### B. Firebase Firestore (Optional - For Cloud Sync)

If you skip this, the app will default to **LocalStorage**, which works perfectly for a single device.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  Navigate to **Build > Firestore Database** and click **Create Database**.
4.  Start in **Test Mode** (or configure rules to allow read/write).
5.  Go to **Project Settings > General**.
6.  Scroll down to "Your apps" and click the **</> (Web)** icon to register a web app.
7.  Copy the configuration values into your `.env` file:

```env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

> **Note:** The application code (`services/db.ts`) automatically detects if these keys are present. If not, it falls back to LocalStorage without errors.

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
    *   `geminiService.ts`: Handles prompts and communication with Google GenAI SDK.
    *   `db.ts`: Handles data persistence (Firebase / LocalStorage logic).
*   `src/constants.ts`: Major System phonetic rules and calculation logic.
*   `src/types.ts`: TypeScript interfaces.

## 🧠 How the AI Logic Works

The app uses specific prompts in `geminiService.ts` to enforce Major System rules:

1.  **Strict Mode:** Forces the AI to find a Person, Action, *and* Object that all phonetically match the target number (e.g., for #15 (T-L), it might suggest "Ted Lasso", "Toiling", "Tool").
2.  **Standard Mode:** Finds a Person fitting the phonetic rule, but allows the Action and Object to be thematically iconic to that person (e.g., "Thor" (14) -> "Throwing" -> "Hammer").

## 📜 License

MIT
