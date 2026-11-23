# Task Evidence: T-045 Account Deletion and Cryptographic Data Purge

## 1. Implementation Summary
Implemented complete user account deletion and cryptographic data wipe workflow across API and frontend:
- **`apps/api/src/routes/account.ts`**:
  - `DELETE /account` and `POST /account/delete`:
    - Authenticates the user via Bearer token (`getAuthUserId`).
    - Executes Postgres cascade deletion (`DELETE FROM users WHERE id = $1`), which automatically and atomically wipes all child `vaults`, `encrypted_notes`, and `sync_log` records due to foreign key cascade constraints.
    - Also purges mock in-memory stores in development/test mode.
    - Clears the HTTP-only rotating refresh token cookie (`deleteCookie(c, "refresh_token", ...)`).
    - Returns `{ success: true, message: "Account and all associated encrypted notes purged permanently." }`.
- **`apps/api/src/index.ts`**:
  - Mounted `accountRouter` on `/account` and `/api/account`.
- **`packages/core/src/storage/db.ts`**:
  - Added `clearAllLocalData()` to wipe local IndexedDB stores (`notes`, `vault`, `outbox`).
- **`apps/web/src/stores/tabsStore.ts` & `apps/web/src/stores/vaultStore.ts`**:
  - Added `resetTabs()` to restore the editor state to a single blank note.
  - Added `resetVault()` to lock and clear memory crypto keys, salts, and initialization state.
- **`apps/web/src/components/settings/DeleteAccountModal.tsx` & `.module.css`**:
  - Accessible Fluent confirmation modal requiring typing "DELETE" to activate deletion.
  - Calls `DELETE /account`, calls `clearAllLocalData()`, clears `localStorage`, resets tabs and vault stores, and closes modal.
- **`apps/web/src/components/settings/SettingsPage.tsx`**:
  - Added "Account & Privacy" card with Delete Account trigger button.

## 2. Automated Tests & Build Verification
- Unit test suite: `apps/api/src/routes/account.test.ts` (2 tests passing)
  - Rejects unauthenticated request with 401.
  - Deletes user records, purges notes, and clears refresh cookie for authenticated user.
- Unit test suite: `apps/web/src/components/settings/DeleteAccountModal.test.tsx` (3 tests passing)
  - Renders title and warning.
  - Enforces typing "DELETE" before enabling button.
  - Executes deletion, invokes callbacks, and clears local data.
- Full `apps/api` test suite: 27 unit tests passing.
- Full `apps/web` test suite: 154 unit tests passing.
- Full monorepo test suite: 214 unit tests passing across `apps/api`, `packages/core`, and `apps/web`.
- Workspace typecheck clean (`tsc --noEmit`).
- Production build compiled cleanly (`pnpm --filter @notepad/web build`).

## 3. Visual Verification
- 1440x900 (Settings Delete Modal - Light): `qa/screenshots/T-045/1440x900.png`
- 1440x900 (Settings Delete Modal - Dark): `qa/screenshots/T-045/1440x900-dark.png`
- Analysis doc: `qa/screenshots/T-045/analysis.md`
