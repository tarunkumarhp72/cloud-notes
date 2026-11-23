# Task Evidence: T-030 Recovery Key Generation and Display Modal

## 1. Implementation Summary
Implemented emergency recovery key generation, wrapping, display, and vault restoration matching Windows 11 Fluent Design:
- **`apps/web/src/components/vault/vaultRecovery.ts`**:
  - `generateRawRecoveryKey()`: Generates 256 bits (32 bytes) of cryptographic randomness.
  - `formatRecoveryKey()`: Formats into 16 hyphenated 4-character hex chunks (64 hex characters).
  - `normalizeRecoveryKey()`: Cleans and validates input string.
  - `deriveRecoveryAesKey()`: Derives 256-bit AES-GCM key from recovery secret using SHA-256.
  - `wrapVaultKeyWithRecovery()`: Encrypts vault master key with recovery key and serializes to JSON `recoveryVerifier`.
  - `unwrapVaultKeyWithRecovery()`: Decrypts and restores raw vault master key.
- **`apps/web/src/stores/vaultStore.ts`**:
  - Updated `setupVault` to wrap the master key with a generated recovery key and save it to `recoveryVerifier` in IndexedDB.
  - Added `recoverVault(recoveryKey)` to unwrap and verify the master key against `authCheck`.
- **`apps/web/src/components/vault/RecoveryKeyModal.tsx`**:
  - `display` mode: displays formatted recovery key, copy button, warning banner, and confirmation checkbox.
  - `recover` mode: inputs recovery key on forgot passphrase, invokes `recoverVault`, handles validation and error reporting.
- **`apps/web/src/components/vault/VaultUnlockModal.tsx`**:
  - Triggers recovery key presentation upon initial setup.
  - "Forgot passphrase?" button links to `RecoveryKeyModal` in recover mode.
- **`apps/web/src/App.tsx`**:
  - Integrated modal state handlers and re-exported components.

## 2. Automated Tests
- Unit test suite: `apps/web/src/components/vault/vaultRecovery.test.ts` (5 tests passing)
- Unit test suite: `apps/web/src/components/vault/RecoveryKeyModal.test.tsx` (6 tests passing)
- All 111 web unit tests and 14 core unit tests passing.
- Full workspace TypeScript strict check passing (`tsc --noEmit`).
- Production build succeeded cleanly.

## 3. Visual Verification
- Light Theme: `qa/screenshots/T-030/1440x900.png`
- Dark Theme: `qa/screenshots/T-030/1440x900-dark.png`
- Recovery Dialog: `qa/screenshots/T-030/recover-dialog.png`
- Analysis doc: `qa/screenshots/T-030/analysis.md`
