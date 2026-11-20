# Task Evidence: T-027 Local auto-save to IndexedDB

## Task Overview
- **Task ID:** T-027
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Debounce local note saving to IndexedDB 1 second after typing stops, with a 10-second forced flush.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/sync/localAutoSave.ts`:
  - `AutoSaveCoordinator`:
    - Debounces save operations precisely 1000ms after keystrokes cease.
    - Forces save every 10000ms during continuous uninterrupted typing via max-wait timer.
    - Flushes immediately when `flush()` is invoked.
    - Handles asynchronous concurrent writes safely with dirty re-queueing.
  - `useLocalAutoSave` React hook:
    - Binds the active note to the coordinator.
    - Hooks `visibilitychange` (`document.visibilityState === 'hidden'`), `pagehide`, and `beforeunload` events to trigger immediate synchronous/guaranteed flushes before page teardown.
    - Uses `@notepad/core` IndexedDB `saveNote` store.
- `apps/web/src/sync/autoSave.test.ts`:
  - 4 unit tests verifying 1-second debounce timing with fake timers, continuous typing 10s max-wait forced flush, and immediate flush on tab hide/exit.
- `apps/web/src/App.tsx`:
  - Connected `useLocalAutoSave` to active tab state and `setTabDirty(savedId, false)` upon successful write.
- `apps/web/src/index.ts`:
  - Exported `AutoSaveCoordinator`, `useLocalAutoSave`, `defaultIndexedDbWriter`, and `AutoSavePayload`.

## Test Results
- Unit Tests: PASS (88/88 in @notepad/web, 113/113 across monorepo)
- Typecheck: PASS (`tsc --noEmit` across all 4 monorepo packages)
- Initial Bundle Budget: PASS (86.42 kB gzipped initial bundle, target < 150 kB)
- Security: No static secrets in code, git, or tests.
