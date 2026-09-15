# MemoDirector

> **Live**: [https://memodirector.web.app](https://memodirector.web.app)

MemoDirector is a local-first single-page application for building, managing, and drilling a Person-Action-Object (PAO) memory system using the Major System phonetic encoding rules. It ingests user PAO card inputs and AI casting prompts, and emits formatted Anki flashcard decks (.txt TSV) for spaced repetition practice.

The application operates entirely client-side, using browser LocalStorage for immediate persistence and metadata versioning. It supports optional, asynchronous multi-device synchronization and media uploads via a Supabase backend integration, falling back gracefully to offline mode when unconfigured.

## Features

- **100-Card PAO Matrix** — Build and visualize your Person-Action-Object deck across all Major System numbers (00–99)
- **AI Casting Director** — Generate phonetic-compliant suggestions via Gemini, OpenAI, OpenRouter, or local Ollama
- **Talent Scout** — Reverse-lookup any name to discover compatible Major System slots
- **Director's Cut Scenes** — Auto-generate vivid, multi-sensory memory scenes linking character, action, and object
- **Anki Export** — One-click export to tab-separated decks with embedded CSS styling
- **Version Management** — Maintain multiple themed decks with independent active states
- **Offline-First** — Full functionality without network; optional Supabase cloud sync
- **Local-First Privacy** — API keys encrypted in browser storage, never transmitted to servers

## Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | React 19 + Vite 6 |
| Styling | Tailwind CSS 3 (Light Studio design system) |
| Typography | Fraunces + Instrument Sans + Space Mono |
| State | React Hooks + LocalStorage |
| Cloud Sync | Supabase (optional) |
| AI Providers | Gemini, OpenAI, OpenRouter, Ollama |
| Testing | Vitest |
| Deployment | Firebase Hosting |

## Requirements

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher (or equivalent yarn/pnpm package manager)

## Quick Start

1. Install local dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template to create a local config file:
   ```bash
   cp .env.example .env
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

The application will build the development assets and start listening at:
```text
http://localhost:3000
```

## Environment Configuration

The application uses environment variables for optional cloud synchronization and developer-only fallback API keys. All keys configured here are loaded at runtime by the client; users can override these fallback keys directly within the application's Settings interface (stored encrypted in the browser's LocalStorage).

### Optional Integrations and Feature Toggles

| Variable | Default | Description |
|:---|---:|:---|
| `VITE_SUPABASE_URL` | | URL endpoint for your Supabase database instance. |
| `VITE_SUPABASE_ANON_KEY` | | Anonymous public API key for the Supabase instance. |
| `VITE_GEMINI_API_KEY` | | Developer fallback Google Gemini API key. |
| `VITE_GEMINI_MODEL` | `gemini-2.0-flash-exp` | Fallback Gemini model variant. |
| `VITE_OPENAI_API_KEY` | | Developer fallback OpenAI API key. |
| `VITE_OPENAI_MODEL` | `gpt-4o-mini` | Fallback OpenAI model variant. |
| `VITE_OPENROUTER_API_KEY` | | Developer fallback OpenRouter API key. |
| `VITE_OPENROUTER_MODEL` | `anthropic/claude-3.5-sonnet` | Fallback OpenRouter model variant. |
| `VITE_OLLAMA_BASE_URL` | `http://localhost:11434` | Endpoint URL for a local Ollama model instance. |
| `VITE_OLLAMA_MODEL` | `llama3.2` | Fallback local Ollama model variant. |

Do not commit `.env` configuration files to version control. In production deployment platforms, inject these keys directly into the build environment secrets manager.

## Development

### Available Scripts

```bash
# Start the local HMR dev server
npm run dev

# Compile and minify assets for production
npm run build

# Preview the local production build
npm run preview

# Run TypeScript type checking
npm run typecheck

# Run unit tests
npm test
```

### Project Structure

```
├── components/          # React organisms and templates
│   ├── ui/              # Atomic design system components
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── FormField.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Notice.tsx
│   │   ├── Select.tsx
│   │   ├── TabGroup.tsx
│   │   └── Textarea.tsx
│   ├── PAOGrid.tsx      # 100-card studio matrix
│   ├── PAOEditor.tsx    # Card editing modal
│   ├── ReverseLookup.tsx # Talent scout search
│   └── ...
├── services/            # Business logic and external integrations
│   ├── paoStore.ts      # Local-first persistence
│   ├── syncQueue.ts     # Cloud sync orchestration
│   ├── llmService.ts    # Multi-provider AI factory
│   └── ...
├── hooks/               # React custom hooks
├── utils/               # Pure utility functions
├── tests/               # Vitest test suite
└── docs/                # Documentation and guides
```

### Design System

MemoDirector uses the **Light Studio** palette:

| Token | Value | Usage |
|:---|:---|:---|
| `canvas` | `#dcdcdd` | Page background |
| `surface` | `#ffffff` | Card backgrounds |
| `charcoal` | `#2f3235` | Primary text |
| `steel` | `#4c5c68` | Secondary text |
| `accent` | `#116c82` | Actions, links, active states |
| `border` | `#c5c3c6` | Hairline dividers |

All colors pass APCA Lc ≥75 for accessibility.

## Deployment

### Firebase Hosting (Current)

```bash
# Build production assets
npm run build

# Deploy to Firebase
npx firebase deploy --project memodirector
```

### GitHub Actions (Optional)

Configure automatic deployment on push:

```bash
npx firebase init hosting:github
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npx vitest run --coverage
```

Test coverage includes:
- Major System phonetic encoding (`calculateMajorNumber`)
- Conflict detection algorithms (`detectConflicts`)
- Input validation and sanitization
- JSON parsing utilities

## License

This project is licensed under the MIT License.

## Acknowledgments

- Major System phonetic encoding rules
- PAO (Person-Action-Object) memory methodology
- Anki spaced repetition system
