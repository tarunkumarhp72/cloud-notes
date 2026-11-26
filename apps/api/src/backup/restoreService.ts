import { sql } from "../db.js";
import { decryptToken, encryptToken } from "./tokenCrypto.js";
import { unsealBackupBundle } from "./backupCrypto.js";
import { driveClient } from "./driveClient.js";

export interface RestoreResult {
  success: boolean;
  restoredCount: number;
  skippedCount: number;
  totalNotes: number;
}

export interface RestoredBackupNote {
  id: string;
  encryptedEnvelope: string;
  version: number;
  clientUpdatedAt: string;
  createdAt?: string;
}

export interface RestoredBackupPayload {
  app: string;
  version: string;
  notes: RestoredBackupNote[];
}

export async function performRestore(userId: string, driveFileId: string): Promise<RestoreResult> {
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

  // Refresh token if nearing expiration
  if (Date.now() + 5 * 60 * 1000 >= expiresAt) {
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
  }

  // 2. Download encrypted backup container from Google Drive
  const sealedBuffer = await driveClient.downloadFile(accessToken, driveFileId);

  // 3. Unseal: authenticate, decrypt AES-256-GCM, and decompress GZIP
  const payload = unsealBackupBundle<RestoredBackupPayload>(sealedBuffer);

  if (!payload || !Array.isArray(payload.notes)) {
    throw new Error("Corrupted or invalid backup payload: 'notes' array missing");
  }

  let restoredCount = 0;
  let skippedCount = 0;

  // 4. Conflict-safe merge into PostgreSQL encrypted_notes
  for (const note of payload.notes) {
    if (!note.id || !note.encryptedEnvelope) {
      skippedCount++;
      continue;
    }

    const existingRows = await sql`
      SELECT id, version, client_updated_at FROM encrypted_notes
      WHERE id = ${note.id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      // Note doesn't exist locally: insert it
      await sql`
        INSERT INTO encrypted_notes (
          id, user_id, encrypted_envelope, version, client_updated_at, deleted, updated_at
        )
        VALUES (
          ${note.id}, ${userId}, ${note.encryptedEnvelope}, ${note.version || 1}, ${note.clientUpdatedAt || new Date().toISOString()}, FALSE, NOW()
        )
      `;
      restoredCount++;
    } else {
      const existing = existingRows[0];
      const existingTime = new Date(existing.client_updated_at).getTime();
      const backupTime = new Date(note.clientUpdatedAt).getTime();

      // Only overwrite if the backup note is genuinely newer or higher version
      if (backupTime > existingTime || (note.version && note.version > existing.version)) {
        await sql`
          UPDATE encrypted_notes
          SET encrypted_envelope = ${note.encryptedEnvelope},
              version = ${note.version || existing.version + 1},
              client_updated_at = ${note.clientUpdatedAt},
              deleted = FALSE,
              updated_at = NOW()
          WHERE id = ${note.id} AND user_id = ${userId}
        `;
        restoredCount++;
      } else {
        // Local copy is newer or identical: do not overwrite
        skippedCount++;
      }
    }
  }

  return {
    success: true,
    restoredCount,
    skippedCount,
    totalNotes: payload.notes.length,
  };
}
