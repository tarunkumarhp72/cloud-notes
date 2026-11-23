# Task Evidence: T-035 Sync Conflict Resolution

## 1. Implementation Summary
Implemented deterministic sync conflict resolution preventing silent data loss:
- **`packages/core/src/sync/conflicts.ts`**:
  - `detectNoteConflict(local, remote, isLocalDirty)`: Evaluates three-way divergence between local tab state and incoming remote version.
  - Determines winner by newest timestamp while detecting concurrent divergence.
  - Names conflict fork tab as `"[Note Name] - conflict"`.
- **`apps/web/src/sync/conflictHandler.ts`**:
  - `handleSyncConflict(localTab, remoteNote, store)`:
    - Updates primary note tab with winning version.
    - Clears dirty flag if remote won.
    - Automatically creates a new tab with losing version titled `"[Note Name] - conflict"` marked as dirty/unsaved so no user edits are ever silently overwritten.
- **Export and Store Wiring**:
  - Re-exported conflict handling in `@notepad/core` and `@notepad/web`.
  - Global access attached for integration testing.

## 2. Automated Tests
- Unit test suite: `packages/core/src/sync/conflicts.test.ts` (5 tests passing)
  - Clean remote update when local has no uncommitted changes.
  - Local win when local timestamp is newer during conflict.
  - Remote win when remote timestamp is newer during conflict.
  - No conflict when contents are identical despite dirty flag.
  - Default fallback when timestamps are identical.
- Unit test suite: `apps/web/src/sync/conflictHandler.test.ts` (2 tests passing)
  - Updating primary tab and opening conflict tab when remote wins.
  - Clean update without conflict tab when local is not dirty.
- Full monorepo test suite: 170 tests passing across `apps/web`, `packages/core`, and `apps/api`.
- Workspace typecheck clean (`tsc --noEmit`).
- Production web build clean.

## 3. Visual Verification
- Light Theme: `qa/screenshots/T-035/1440x900.png`
- Dark Theme: `qa/screenshots/T-035/1440x900-dark.png`
- Analysis doc: `qa/screenshots/T-035/analysis.md`
