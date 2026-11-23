# Task Evidence: T-034 Background Sync Worker and Status-Bar Sync States

## 1. Implementation Summary
Implemented background sync engine with exponential backoff, jitter, and status-bar sync indicators:
- **`apps/web/src/sync/syncEngine.ts`**:
  - `SyncEngine`: Manages background outbox synchronization with backend `/api/sync/push`.
  - Automatic push scheduled 2 seconds after local auto-save events.
  - `calculateBackoffWithJitter(attempt, baseMs, maxMs)`: Exponential backoff with up to 30% random jitter to prevent server thundering herds.
  - Status management: `"idle" | "saving" | "saved" | "offline" | "sync_failed"`.
  - Network connectivity listeners for `online` / `offline` events.
  - Failure recovery: automatically increments retry attempts in outbox and schedules retries with backoff.
- **`apps/web/src/components/statusbar/SyncIndicator.tsx`**:
  - Clean Fluent status indicator rendering "Saving" (spinner), "Saved" (checkmark), "Offline" (cloud offline), and "Sync failed" (clickable retry button).
- **`apps/web/src/components/statusbar/StatusBar.tsx`**:
  - Integrated `SyncIndicator` into the status bar.
- **`apps/web/src/App.tsx`**:
  - Connected `SyncEngine` lifecycle, auto-save hook, and status bar.

## 2. Automated Tests
- Unit test suite: `apps/web/src/sync/syncEngine.test.ts` (5 tests passing)
  - Backoff calculation and jitter bounds.
  - Status subscription and notification transitions.
  - 2-second debounce auto-push scheduling.
  - Successful push execution and outbox cleanup.
  - Error handling with attempt increments and backoff retry.
- Unit test suite: `apps/web/src/components/statusbar/StatusBar.test.tsx` (4 tests passing)
  - Added test verifying "Saving", "Saved", "Offline", and "Sync failed" status indicator rendering.
- Full monorepo test suite: 163 tests passing across `apps/web`, `packages/core`, and `apps/api`.
- Workspace typecheck clean (`tsc --noEmit`).
- Production web build clean.

## 3. Visual Verification
- Light Theme: `qa/screenshots/T-034/1440x900.png`
- Dark Theme: `qa/screenshots/T-034/1440x900-dark.png`
- Analysis doc: `qa/screenshots/T-034/analysis.md`
