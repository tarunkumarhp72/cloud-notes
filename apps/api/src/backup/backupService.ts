import { sql } from "../db";
import { decryptToken, encryptToken } from "./tokenCrypto";
import { sealBackupBundle } from "./backupCrypto";
import { driveClient } from "./driveClient";

export interface BackupResult {
  success: boolean;
  fileId: string;
  fileName: string;
  notesCount: number;
  sizeBytes: number;
}

export function calculateNextBackupDate(frequency: "daily" | "weekly" | "monthly" | "disabled", fromDate = new Date()): Date | null {
  if (frequency === "disabled") return null;

  const next = new Date(fromDate);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function performBackup(
  userId: string,
  backupType: "manual" | "daily" | "weekly" | "monthly"
): Promise<BackupResult> {
  if (!sql) {
    throw new Error("Database connection unavailable");
  }

  // 1. Fetch connection details
  const connRows = await sql`
    SELECT google_account_email, encrypted_access_token, encrypted_refresh_token, token_expires_at, status
    FROM google_drive_connections
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (!connRows || connRows.length === 0 || connRows[0].status !== "connected") {
    throw new Error("Google Drive is not connected for this user");
  }

  const conn = connRows[0];
  let accessToken = decryptToken(conn.encrypted_access_token);
  const refreshToken = decryptToken(conn.encrypted_refresh_token);
  const expiresAt = new Date(conn.token_expires_at).getTime();

  // If token expires in < 5 minutes, refresh it automatically
  if (Date.now() + 5 * 60 * 1000 >= expiresAt) {
    try {
      const refreshed = await driveClient.refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
      const newEncryptedAccess = encryptToken(refreshed.accessToken);

      await sql`
        UPDATE google_drive_connections
        SET encrypted_access_token = ${newEncryptedAccess},
            token_expires_at = ${newExpiresAt},
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } catch (err) {
      await sql`
        UPDATE google_drive_connections SET status = 'revoked', updated_at = NOW() WHERE user_id = ${userId}
      `;
      throw new Error(`Google OAuth permission revoked or expired: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Fetch active notes
  const notes = await sql`
    SELECT id, encrypted_envelope, version, client_updated_at, created_at
    FROM encrypted_notes
    WHERE user_id = ${userId} AND deleted = FALSE
    ORDER BY updated_at DESC
  `;

  // 3. Construct structured backup payload
  const timestamp = new Date().toISOString();
  const backupPayload = {
    app: "Notepad Cloud",
    version: "1.0",
    backupType,
    createdAt: timestamp,
    userId,
    notesCount: notes.length,
    notes: notes.map((n: any) => ({
      id: n.id,
      encryptedEnvelope: n.encrypted_envelope,
      version: Number(n.version),
      clientUpdatedAt: n.client_updated_at,
      createdAt: n.created_at,
    })),
  };

  // 4. Compress (GZIP) and Encrypt (AES-256-GCM)
  const sealed = sealBackupBundle(backupPayload);

  // 5. Ensure directory hierarchy on Drive
  const subfolderMap = {
    manual: "Manual",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  } as const;
  const subfolder = subfolderMap[backupType];
  const { subfolderId } = await driveClient.ensureFolderHierarchy(accessToken, subfolder);

  const formattedDate = timestamp.replace(/[:.]/g, "-");
  const fileName = `notepad_backup_${backupType}_${formattedDate}.enc.gz`;

  // 6. Upload encrypted archive
  let driveFile;
  try {
    driveFile = await driveClient.uploadBackupFile(accessToken, subfolderId, fileName, sealed);
  } catch (uploadErr) {
    const errorMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    await sql`
      INSERT INTO backup_history (user_id, folder_path, backup_type, status, notes_count, file_size_bytes, error_message)
      VALUES (${userId}, ${`Notes App Backups/${subfolder}`}, ${backupType}, 'failed', ${notes.length}, ${sealed.length}, ${errorMsg})
    `;
    throw uploadErr;
  }

  // 7. Enforce retention (keep last 3 files in this subfolder)
  try {
    await driveClient.enforceRetention(accessToken, subfolderId, 3);
  } catch {
    // Non-critical retention failure
  }

  // 8. Record success in backup history
  await sql`
    INSERT INTO backup_history (
      user_id, drive_file_id, folder_path, backup_type, status, notes_count, file_size_bytes
    )
    VALUES (
      ${userId}, ${driveFile.id}, ${`Notes App Backups/${subfolder}`}, ${backupType}, 'success', ${notes.length}, ${sealed.length}
    )
  `;

  // 9. Update backup settings schedule
  const settingsRows = await sql`
    SELECT frequency FROM backup_settings WHERE user_id = ${userId} LIMIT 1
  `;
  const frequency = (settingsRows[0]?.frequency || "daily") as "daily" | "weekly" | "monthly" | "disabled";
  const nextBackupAt = calculateNextBackupDate(frequency);

  await sql`
    INSERT INTO backup_settings (user_id, last_backup_at, next_backup_at, updated_at)
    VALUES (${userId}, NOW(), ${nextBackupAt}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      last_backup_at = NOW(),
      next_backup_at = ${nextBackupAt},
      updated_at = NOW()
  `;

  return {
    success: true,
    fileId: driveFile.id,
    fileName: driveFile.name,
    notesCount: notes.length,
    sizeBytes: sealed.length,
  };
}
