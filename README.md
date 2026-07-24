# MemoDirector

MemoDirector is a static, local-first single-page application designed for building, managing, and drilling a Person-Action-Object (PAO) memory system using the Major System phonetic encoding rules. It ingests user PAO card inputs and AI casting prompts, and emits structured Anki flashcard decks (.apkg) for spaced repetition practice.

The application operates entirely client-side, using browser LocalStorage for immediate persistence and metadata versioning. It supports optional, asynchronous multi-device synchronization and media uploads via a Supabase backend integration, falling back gracefully to offline mode when unconfigured.

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [License](#license)

## Requirements

The application requires the following runtime environment:

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher (or equivalent yarn/pnpm package manager)

## Quick Start

To run the application locally, initialize the environment configuration and start the Vite development server.

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

The project uses Vite and standard npm scripts to manage the development lifecycle.

Use the following commands during local development:

```bash
# Start the local HMR dev server
npm run dev

# Compile and minify assets for production
npm run build

# Preview the local production build
npm run preview
```

Static compiled assets are outputted to the `dist/` directory on build.

## License

This project is licensed under the MIT License.
