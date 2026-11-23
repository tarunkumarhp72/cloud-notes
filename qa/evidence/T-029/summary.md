# Task Evidence: T-029 Vault Passphrase and Unlock UI

## 1. Implementation Summary
Implemented the zero-knowledge vault setup and unlock UI matching Windows 11 Fluent Design standards:
- **`packages/core/src/storage/vaultStore.ts`**: Persistent vault metadata management in IndexedDB storing salt, encrypted authCheck challenge token, and timestamp.
- **`apps/web/src/stores/vaultStore.ts`**: Zustand vault store managing runtime vault state (`isInitialized`, `isLocked`, in-memory `vaultKey` `CryptoKey`), Argon2id key derivation, and AES-256-GCM encryption/decryption challenge validation.
- **`apps/web/src/components/vault/VaultUnlockModal.tsx`**: Fluent modal for setting up a master passphrase (with confirmation and visibility toggle) and unlocking the vault with passphrase validation.
- **`apps/web/src/components/header/AccountMenu.tsx`**: Added "Vault & Encryption" entry with lock indicator to allow quick unlocking or opening vault settings.
- **`apps/web/src/App.tsx`**: Integrated vault status initialization and unlock modal trigger.

## 2. Automated Tests
- Unit test suite: `apps/web/src/components/vault/VaultUnlockModal.test.tsx` (4 tests passing)
  - Hidden state when `isOpen=false`
  - Passphrase setup validation (<6 chars, mismatch, success)
  - Vault unlock with invalid passphrase rejection
  - Forgot passphrase trigger
- All 100 web unit tests and 14 core unit tests passing.
- Full workspace TypeScript strict check passing (`tsc --noEmit`).
- Production build succeeded cleanly.

## 3. Visual Verification
- Light Theme: `qa/screenshots/T-029/1440x900.png`
- Dark Theme: `qa/screenshots/T-029/1440x900-dark.png`
- Analysis doc: `qa/screenshots/T-029/analysis.md`
