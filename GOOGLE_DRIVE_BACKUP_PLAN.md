# GOOGLE DRIVE AUTOMATIC BACKUP & RESTORE PLAN
**Project:** Notepad Cloud (Monorepo)  
**Standard:** Enterprise Grade • WhatsApp-Style Compressed & End-to-End Encrypted Backups  
**Date:** November 2026

---

## 1. Executive Summary & Architecture Overview

This plan defines the end-to-end implementation of **Automatic Google Drive Backup & Restore** for Notepad Cloud.

### Key Tenets
1. **Compressed Storage (GZIP):** Backup payloads are compressed using GZIP before upload, saving 70%–90% space on Google Drive.
2. **End-to-End Encryption (AES-256-GCM):** Notes are already encrypted with zero-knowledge envelopes in the database; the backup bundle itself is sealed in an authenticated AES-256-GCM binary container (`.enc.gz`). Google Drive stores only unreadable encrypted ciphertext.
3. **Background Server Scheduler:** Automated Daily, Weekly, and Monthly backups execute on the server even when the user's browser is completely closed.
4. **Least-Privilege Security:** Scoped strictly to `https://www.googleapis.com/auth/drive.file`. The app can only see and manage its own files in `Google Drive/Notes App Backups/`.
5. **Conflict-Safe Restore:** Safe restoration algorithm preventing duplicate notes and never silently overwriting newer modifications.

---

## 2. Database Schema Design (PostgreSQL Migration)

Migration file: `supabase/migrations/20261125000001_google_drive_backup.sql`

```sql
-- 1. Google Drive OAuth Connection & Credentials
CREATE TABLE IF NOT EXISTS google_drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_account_email TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'revoked', 'disconnected')),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_drive_user UNIQUE (user_id)
);

-- 2. User Backup Schedule Settings
CREATE TABLE IF NOT EXISTS backup_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'disabled')),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    last_backup_at TIMESTAMPTZ,
    next_backup_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Backup Execution History & Audit Log
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drive_file_id TEXT,
    folder_path TEXT NOT NULL,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'daily', 'weekly', 'monthly')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
    notes_count INTEGER NOT NULL DEFAULT 0,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_history_user_created ON backup_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_settings_scheduled ON backup_settings(auto_backup_enabled, next_backup_at) WHERE auto_backup_enabled = TRUE;

ALTER TABLE google_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
```

---

## 3. Backend Architecture (`apps/api`)

### New Modules (`apps/api/src/backup/`)
- `tokenCrypto.ts`: Encrypts/decrypts OAuth tokens at rest using AES-256-GCM.
- `backupCrypto.ts`: Handles GZIP compression and authenticated AES-256-GCM backup container sealing/unsealing.
- `driveClient.ts`: Direct Google Drive v3 REST API wrapper (folders, multipart upload, file streaming, token refresh).
- `backupService.ts`: Queries `encrypted_notes`, packages into versioned JSON, seals with `backupCrypto`, uploads to Drive, logs in `backup_history`.
- `restoreService.ts`: Downloads from Drive, decrypts, decompresses, validates schema, and merges into `encrypted_notes`.
- `scheduler.ts`: Autonomous background worker that triggers backups for users whose `next_backup_at <= NOW()`.

### API Endpoints (`apps/api/src/routes/backup.ts`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/backup/status` | Get connection status, settings, last/next backup |
| `GET` | `/api/backup/auth/url` | Generate Google Drive OAuth URL with PKCE / state |
| `POST` | `/api/backup/auth/callback` | Exchange code for tokens, encrypt & save |
| `POST` | `/api/backup/disconnect` | Revoke tokens & delete connection records |
| `POST` | `/api/backup/settings` | Update frequency and auto-backup toggle |
| `POST` | `/api/backup/now` | Trigger manual backup immediately |
| `GET` | `/api/backup/history` | List user's backup history entries |
| `POST` | `/api/backup/restore` | Restore notes from specified `driveFileId` |

---

## 4. Frontend Architecture (`apps/web`)

### UI Components (`apps/web/src/components/settings/`)
- `GoogleDriveBackup.tsx`: Integrated directly into [SettingsPage.tsx](file:///d:/my/git-tarunhp72/cloud-notes/apps/web/src/components/settings/SettingsPage.tsx).
  - Displays connection status badge.
  - Connect Google Drive button (with Google branding).
  - Frequency dropdown (Daily, Weekly, Monthly).
  - Auto-backup ON/OFF switch.
  - "Backup Now" trigger with real-time feedback.
  - Backup history table with file sizes, timestamps, and note counts.
  - "Restore" button with modal confirmation and conflict explanation.
- `DriveCallbackHandler.tsx`: Handles redirect after Google consent, exchanges token, and redirects back to Settings.

---

## 5. Security & Verification Strategy
- **Token Protection:** Tokens never exposed to client; encrypted at rest.
- **CSRF Protection:** State parameter validation on OAuth callback.
- **Zero-Knowledge Privacy:** Content remains encrypted end-to-end.
- **Unit & Integration Tests:** 
  - `backupCrypto.test.ts` (Compression & AES-GCM container verification)
  - `driveClient.test.ts` (API mock & retry logic)
  - `backup.test.ts` (End-to-end backup and restore API routes)
  - `scheduler.test.ts` (Schedule calculation)
