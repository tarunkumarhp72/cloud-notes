# Task Evidence: T-032 Client Sync Outbox Queue

## 1. Implementation Summary
Implemented client sync outbox queue tracking note mutations, versions, and sync status in `@notepad/core`:
- **`packages/core/src/sync/outbox.ts`**:
  - `enqueueOutboxItem(noteId, action, payload, options)`: Appends or coalesces note mutations into IndexedDB `outbox` store. Multiple edits to the same note are coalesced to avoid sending redundant intermediate revisions.
  - `getOutboxItems(limit)`: Retrieves pending mutations ordered by creation time (FIFO).
  - `getOutboxCount()`: Returns total count of pending mutations in the outbox.
  - `removeOutboxItems(ids)`: Atomically deletes a batch of successfully synced mutation IDs in a single transaction.
  - `removeOutboxItem(id)`: Removes a single outbox item by its mutation ID.
  - `incrementOutboxAttempts(id)`: Increments retry attempts counter on sync failure.
  - `clearOutbox()`: Clears all pending mutations from the outbox.
- Re-exported via `packages/core/src/sync/index.ts` and `packages/core/src/index.ts`.

## 2. Automated Tests
- Unit test suite: `packages/core/src/sync/outbox.test.ts` (6 tests passing)
  - Append mutations in FIFO order.
  - Coalesce rapid edits for the same note into a single entry.
  - Persistence across database disconnects / page reloads.
  - Atomic batch deletion of synced items.
  - Increment attempt counter on retry.
  - Clear outbox.
- Full workspace test suite: 28 tests in `@notepad/core`, 111 tests in `apps/web`, 11 tests in `apps/api` (all 150 tests passing).
- Clean workspace TypeScript check (`tsc --noEmit`).
- Clean production web build.
