import { sql } from "../db";
import { decryptToken, encryptToken } from "./tokenCrypto";
import { sealBackupBundle } from "./backupCrypto";
import { driveClient } from "./driveClient";
import type { BackupProgressEvent } from "./activeTasks";

export type { BackupProgressEvent };

export interface BackupResult {
  success: boolean;
  fileId: string;
  fileName: string;
  notesCount: number;
  sizeBytes: number;
}

export function calculateNextBackupDate(
  frequency: "daily" | "weekly" | "monthly" | "disabled",
  baseDate = new Date(),
  targetDayOfMonth?: number
): Date | null {
  if (frequency === "disabled") return null;

  const next = new Date(baseDate);
  const hours = baseDate.getHours();
  const minutes = baseDate.getMinutes();
  const seconds = baseDate.getSeconds();

  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    const originalDay = targetDayOfMonth ?? baseDate.getDate();
    const curYear = next.getFullYear();
    const curMonth = next.getMonth();
    const nextMonth = curMonth + 1;
    // Handle short months appropriately (e.g. Jan 31 -> Feb 28/29)
    const daysInNextMonth = new Date(curYear, nextMonth + 1, 0).getDate();
    const clampedDay = Math.min(originalDay, daysInNextMonth);
    next.setFullYear(curYear, nextMonth, clampedDay);
  }

  next.setHours(hours, minutes, seconds, 0);
  return next;
}

export async function performBackup(
  userId: string,
  backupType: "manual" | "daily" | "weekly" | "monthly",
  onProgress?: (event: BackupProgressEvent) => void,
  abortSignal?: AbortSignal
): Promise<BackupResult> {
  if (!sql) {
    throw new Error("Database connection unavailable");
  }

  const checkAborted = () => {
    if (abortSignal?.aborted) {
      throw new Error("Backup aborted by user");
    }
  };

  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Checking Google Drive connection...",
    totalNotes: 0,
    processedNotes: 0,
    percent: 5,
  });

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
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("invalid_grant") || errMsg.includes("400")) {
        await sql`
          UPDATE google_drive_connections SET status = 'revoked', updated_at = NOW() WHERE user_id = ${userId}
        `;
      }
      throw new Error(`Google OAuth permission revoked or expired: ${errMsg}`);
    }
  }

  // 2. Fetch active notes
  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Fetching active notes...",
    totalNotes: 0,
    processedNotes: 0,
    percent: 15,
  });

  const notes = await sql`
    SELECT id, encrypted_envelope, version, client_updated_at, created_at
    FROM encrypted_notes
    WHERE user_id = ${userId} AND deleted = FALSE
    ORDER BY updated_at DESC
  `;

  const totalNotes = notes.length;
  checkAborted();

  onProgress?.({
    status: "in_progress",
    phase: totalNotes > 0 ? `Preparing backup (${totalNotes} notes found)...` : "Preparing backup...",
    totalNotes,
    processedNotes: 0,
    percent: 25,
  });

  // 3. Construct structured backup payload with note-by-note progress
  const timestamp = new Date().toISOString();
  const processedNotesList: any[] = [];

  if (totalNotes === 0) {
    onProgress?.({
      status: "in_progress",
      phase: "Preparing backup (0 notes)...",
      totalNotes: 0,
      processedNotes: 0,
      percent: 50,
    });
  } else {
    for (let i = 0; i < totalNotes; i++) {
      checkAborted();
      const n = notes[i];
      processedNotesList.push({
        id: n.id,
        encryptedEnvelope: n.encrypted_envelope,
        version: Number(n.version),
        clientUpdatedAt: n.client_updated_at,
        createdAt: n.created_at,
      });

      const currentPercent = 25 + Math.round(((i + 1) / totalNotes) * 35);
      onProgress?.({
        status: "in_progress",
        phase: `Preparing backup (${currentPercent}%)`,
        totalNotes,
        processedNotes: i + 1,
        percent: currentPercent,
      });
    }
  }

  const backupPayload = {
    app: "Notepad Cloud",
    version: "1.0",
    backupType,
    createdAt: timestamp,
    userId,
    notesCount: totalNotes,
    notes: processedNotesList,
  };

  // 4. Compress (GZIP) and Encrypt (AES-256-GCM)
  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Sealing encrypted backup container...",
    totalNotes,
    processedNotes: totalNotes,
    percent: 65,
  });

  const sealed = sealBackupBundle(backupPayload);

  // 5. Ensure directory hierarchy on Drive
  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Connecting to Google Drive...",
    totalNotes,
    processedNotes: totalNotes,
    percent: 75,
  });

  const folderName = "Notepad Cloud Backups";
  const folderId = await driveClient.findOrCreateFolder(accessToken, folderName);

  const formattedDate = timestamp.replace(/[:.]/g, "-");
  const fileName = `notepad_cloud_backup_${formattedDate}.enc.gz`;

  // 6. Upload encrypted archive
  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Uploading encrypted bundle to Google Drive...",
    totalNotes,
    processedNotes: totalNotes,
    percent: 85,
  });

  let driveFile;
  try {
    driveFile = await driveClient.uploadBackupFile(accessToken, folderId, fileName, sealed);
  } catch (uploadErr) {
    const errorMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    await sql`
      INSERT INTO backup_history (user_id, folder_path, backup_type, status, notes_count, file_size_bytes, error_message)
      VALUES (${userId}, ${folderName}, ${backupType}, 'failed', ${notes.length}, ${sealed.length}, ${errorMsg})
    `;
    onProgress?.({
      status: "failed",
      phase: "Upload failed",
      totalNotes,
      processedNotes: totalNotes,
      percent: 85,
      errorMessage: errorMsg,
    });
    throw uploadErr;
  }

  checkAborted();
  onProgress?.({
    status: "in_progress",
    phase: "Finalizing backup and updating schedule...",
    totalNotes,
    processedNotes: totalNotes,
    percent: 95,
  });

  // 7. Enforce single-file retention (remove all previous backups, keep only the latest 1)
  try {
    await driveClient.enforceRetention(accessToken, folderId, 1);
  } catch {
    // Non-critical retention failure
  }

  // 8. Record latest backup in backup history (keep only 1 active entry per user)
  await sql`DELETE FROM backup_history WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO backup_history (
      user_id, drive_file_id, folder_path, backup_type, status, notes_count, file_size_bytes
    )
    VALUES (
      ${userId}, ${driveFile.id}, ${folderName}, ${backupType}, 'success', ${notes.length}, ${sealed.length}
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

  onProgress?.({
    status: "success",
    phase: "Backup completed successfully",
    totalNotes,
    processedNotes: totalNotes,
    percent: 100,
    fileName: driveFile.name,
    fileSizeBytes: sealed.length,
  });

  return {
    success: true,
    fileId: driveFile.id,
    fileName: driveFile.name,
    notesCount: notes.length,
    sizeBytes: sealed.length,
  };
}
