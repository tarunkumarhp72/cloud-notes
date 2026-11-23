# Task Evidence: T-031 Note Envelope Encryption Pipeline

## 1. Implementation Summary
Implemented zero-knowledge end-to-end note envelope encryption pipeline in `@notepad/core`:
- **`packages/core/src/crypto/envelope.ts`**:
  - `PlaintextNote`: note payload interface containing `id`, `title`, `content`, `isMarkdown`, `createdAt`, `updatedAt`.
  - `NoteEnvelope`: tamper-evident envelope structure with `version` (1), `algorithm` ("AES-256-GCM"), 12-byte base64 `iv`, base64 `ciphertext`, and 16-byte base64 `authTag`.
  - `createNoteEnvelope(key, note)`: wraps plaintext note into encrypted envelope. Plaintext never leaves device memory unencrypted. Unique random 12-byte IV generated on every encryption call.
  - `openNoteEnvelope(key, envelope)`: verifies authentication tag and decrypts note payload.
  - `packEncryptedNote(key, note, options)`: packages note into `LocalEncryptedNote` for IndexedDB storage or outbox sync.
  - `unpackEncryptedNote(key, record)`: unpacks and decrypts stored note.
- **Exported from `@notepad/core`**: available across monorepo packages.

## 2. Automated Tests
- Unit test suite: `packages/core/src/crypto/envelope.test.ts` (8 tests passing)
  - Envelope structure, unique IV guarantee, and 128-bit authentication tag verification.
  - Seamless decryption round-trip.
  - JSON string envelope deserialization and decryption.
  - Tamper detection: rejects corrupt ciphertext.
  - Tamper detection: rejects modified auth tag.
  - Tamper detection: rejects altered IV.
  - Key validation: rejects decryption with wrong key.
  - Packaging & unpackaging round-trip with IndexedDB record structure ensuring zero plaintext in stored record.
- Full workspace test suite: 22 tests in `@notepad/core`, 111 tests in `apps/web`, 11 tests in `apps/api` (all 144 tests passing).
- Clean monorepo TypeScript strict check (`tsc --noEmit`).
- Clean production web build.
