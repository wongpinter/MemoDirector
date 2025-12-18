# Development Guide

This guide provides an overview of the MemoDirector architecture, project structure, and technical roadmap.

## 🏗️ Architecture

MemoDirector is a React-based application designed with a **Local-first** philosophy.

### System Design

*   **UI Layer**: React components (Vite + Tailwind CSS).
*   **Business Logic**: Custom hooks (`usePAOData`,  `useAISuggestions`) and services (`syncQueue`,  `pullService`).
*   **State Management**: React Contexts for global state (Auth, Toast, Theme).
*   **Data Layer**:
    -   **Primary**: Browser `localStorage` for instant responsiveness and offline support.
    -   **Remote**: Supabase (PostgreSQL) for cross-device sync and backup.

## 📁 Project Structure

```
src/
├── components/       # UI Components (common, layout, pao, stats)
├── hooks/            # Custom hooks for logic and state
├── contexts/         # Provider components for global state
├── services/         # API clients and service logic (Supabase, Gemini)
├── utils/            # Shared helper functions (validation, sanitization)
├── types/            # TypeScript interfaces and declarations
└── constants/        # Centralized configuration and magic numbers
```

## 🔧 Refactoring Strategy

We have transitioned from a cloud-only model to a robust local-first model. Key improvements include:
*   **Debounced Sync**: Reducing write operations by grouping changes.
*   **Type Safety**: Eliminating `@ts-ignore` and using strong TypeScript interfaces.
*   **Modularization**: Extracting reusable UI elements and logic into standalone components and hooks.

## 🚀 Roadmap (Future Improvements)

### High Priority

*   **Conflict Resolution**: Implementing granular merging logic for multi-device sync.
*   **Media Compression**: Automatically optimizing images/videos before cloud upload.
*   **A11y**: Improving keyboard navigation and screen reader support.

### Medium Priority

*   **PWA**: Adding service workers for full app installation.
*   **Undo/Redo**: Implementing a command history for PAO edits.
*   **Search/Filter**: Enhancing the grid with fuzzy search capabilities.

---
*Status: Active Development*
*Last Updated: December 2025*
