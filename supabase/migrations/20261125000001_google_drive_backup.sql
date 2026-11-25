-- Google Drive Automatic Backup & Restore Schema
-- Enforces: UUID keys, UTC timestamptz, cascade deletes, RLS on with no public policies

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
