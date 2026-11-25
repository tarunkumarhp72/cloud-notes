import { Hono, type Context } from "hono";
import { z } from "zod";
import { getAuthUserId } from "./sync";
import { sql } from "../db";
import { config } from "../config";
import { encryptToken } from "../backup/tokenCrypto";
import { performBackup } from "../backup/backupService";
import { performRestore } from "../backup/restoreService";
import {
  activeBackupTasks,
  registerActiveTask,
  broadcastTaskProgress,
  cancelActiveTask,
  type BackupProgressEvent,
} from "../backup/activeTasks";
import { scheduleUserBackup, cancelUserScheduledBackup } from "../backup/scheduler";

export const backupRouter = new Hono();

// Auth guard helper
async function requireUser(c: Context): Promise<string | Response> {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized: valid session token required" }, 401);
  }
  return userId;
}

/**
 * GET /api/backup/status
 * Returns Google Drive connection status and backup schedule settings.
 */
backupRouter.get("/status", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  let connected = false;
  let googleEmail: string | null = null;
  let autoBackupEnabled = false;
  let frequency: "daily" | "weekly" | "monthly" | "disabled" = "daily";
  let lastBackupAt: string | null = null;
  let nextBackupAt: string | null = null;

  if (sql) {
    try {
      const connRows = await sql`
        SELECT google_account_email, status FROM google_drive_connections WHERE user_id = ${userId} LIMIT 1
      `;
      if (connRows.length > 0 && connRows[0].status === "connected") {
        connected = true;
        googleEmail = connRows[0].google_account_email;
      }

      const settingsRows = await sql`
        SELECT auto_backup_enabled, frequency, last_backup_at, next_backup_at
        FROM backup_settings WHERE user_id = ${userId} LIMIT 1
      `;
      if (settingsRows.length > 0) {
        autoBackupEnabled = Boolean(settingsRows[0].auto_backup_enabled);
        frequency = settingsRows[0].frequency || "daily";
        lastBackupAt = settingsRows[0].last_backup_at;
        nextBackupAt = settingsRows[0].next_backup_at;
      }
    } catch (err) {
      return c.json({ error: "Database error retrieving backup status" }, 500);
    }
  }

  return c.json({
    connected,
    googleEmail,
    autoBackupEnabled,
    frequency,
    lastBackupAt,
    nextBackupAt,
  });
});

/**
 * GET /api/backup/auth/url
 * Generates Google OAuth authorization URL requesting drive.file least-privilege scope.
 */
backupRouter.get("/auth/url", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  const redirectUri = c.req.query("redirect_uri") || `${config.frontendUrl}/auth/drive-callback`;
  const state = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomUUID() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return c.json({ url, state });
});

/**
 * POST /api/backup/auth/callback
 * Exchanges authorization code for tokens, encrypts at rest, and saves connection.
 */
const CallbackSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

backupRouter.post("/auth/callback", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  let body;
  try {
    body = CallbackSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid request payload" }, 400);
  }

  try {
    // 1. Exchange code with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: body.code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: body.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return c.json({ error: `Google token exchange failed: ${errText}` }, 400);
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokens.refresh_token) {
      return c.json(
        { error: "Google did not provide a refresh token. Please reconnect with full consent." },
        400
      );
    }

    // 2. Fetch Google account email
    let googleEmail = "connected-account@gmail.com";
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = (await userInfoRes.json()) as { email?: string };
        if (userInfo.email) googleEmail = userInfo.email;
      }
    } catch {
      // Non-fatal fallback
    }

    // 3. Encrypt tokens at rest
    const encryptedAccess = encryptToken(tokens.access_token);
    const encryptedRefresh = encryptToken(tokens.refresh_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    if (sql) {
      await sql`
        INSERT INTO google_drive_connections (
          user_id, google_account_email, encrypted_access_token, encrypted_refresh_token, token_expires_at, status, updated_at
        )
        VALUES (
          ${userId}, ${googleEmail}, ${encryptedAccess}, ${encryptedRefresh}, ${expiresAt}, 'connected', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          google_account_email = EXCLUDED.google_account_email,
          encrypted_access_token = EXCLUDED.encrypted_access_token,
          encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
          token_expires_at = EXCLUDED.token_expires_at,
          status = 'connected',
          updated_at = NOW()
      `;

      // Initialize backup settings if not already created
      await sql`
        INSERT INTO backup_settings (user_id, auto_backup_enabled, frequency, updated_at)
        VALUES (${userId}, FALSE, 'daily', NOW())
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    return c.json({ success: true, googleEmail });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to connect Google Drive" }, 500);
  }
});

/**
 * POST /api/backup/disconnect
 * Disconnects Google Drive connection, stops any active backup, and cancels scheduled backups.
 */
backupRouter.post("/disconnect", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  // 1. Immediately abort active backup if running
  cancelActiveTask(userId);

  // 2. Immediately cancel and deregister any scheduled task
  cancelUserScheduledBackup(userId);

  if (sql) {
    try {
      await sql`DELETE FROM google_drive_connections WHERE user_id = ${userId}`;
      await sql`
        UPDATE backup_settings SET auto_backup_enabled = FALSE, next_backup_at = NULL, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } catch (err) {
      return c.json({ error: "Failed to disconnect Google Drive" }, 500);
    }
  }

  return c.json({ success: true, message: "Google Drive disconnected successfully" });
});

/**
 * POST /api/backup/settings
 * Updates backup frequency and auto-backup toggle with dynamic task replacement.
 */
const SettingsSchema = z.object({
  autoBackupEnabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly", "disabled"]),
});

backupRouter.post("/settings", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  let body;
  try {
    body = SettingsSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid settings format" }, 400);
  }

  let nextBackup: Date | null = null;

  if (body.autoBackupEnabled && body.frequency !== "disabled") {
    // Dynamically register or replace existing scheduled task (strictly 1 task per user)
    nextBackup = scheduleUserBackup(userId, body.frequency as "daily" | "weekly" | "monthly");
  } else {
    // User disabled auto backup -> cancel any active scheduled task
    cancelUserScheduledBackup(userId);
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO backup_settings (user_id, auto_backup_enabled, frequency, next_backup_at, updated_at)
        VALUES (${userId}, ${body.autoBackupEnabled}, ${body.frequency}, ${nextBackup}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          auto_backup_enabled = EXCLUDED.auto_backup_enabled,
          frequency = EXCLUDED.frequency,
          next_backup_at = ${nextBackup},
          updated_at = NOW()
      `;
    } catch {
      return c.json({ error: "Failed to save backup settings" }, 500);
    }
  }

  return c.json({
    success: true,
    settings: {
      autoBackupEnabled: body.autoBackupEnabled,
      frequency: body.frequency,
      nextBackupAt: nextBackup?.toISOString() || null,
    },
  });
});

/**
 * POST /api/backup/now
 * Triggers an immediate manual backup to Google Drive with real-time progress broadcasting.
 */
backupRouter.post("/now", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  if (activeBackupTasks.has(userId)) {
    return c.json({ error: "A backup is already in progress for this account" }, 409);
  }

  const wait = c.req.query("wait") === "true";
  const activeTask = registerActiveTask(userId, "manual");

  const backupPromise = performBackup(
    userId,
    "manual",
    (event) => broadcastTaskProgress(userId, event),
    activeTask.abortController.signal
  )
    .then((result) => {
      broadcastTaskProgress(userId, {
        status: "success",
        phase: "Backup completed successfully",
        totalNotes: result.notesCount,
        processedNotes: result.notesCount,
        percent: 100,
        backupId: result.fileId,
        fileName: result.fileName,
        fileSizeBytes: result.sizeBytes,
      });
      return result;
    })
    .catch((err) => {
      if (!activeTask.abortController.signal.aborted) {
        broadcastTaskProgress(userId, {
          status: "failed",
          phase: "Backup failed",
          totalNotes: activeTask.currentProgress.totalNotes,
          processedNotes: activeTask.currentProgress.processedNotes,
          percent: activeTask.currentProgress.percent,
          errorMessage: err instanceof Error ? err.message : "Backup execution failed",
        });
      }
      throw err;
    });

  if (wait) {
    try {
      const result = await backupPromise;
      return c.json({ success: true, backup: result });
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Backup execution failed" },
        500
      );
    }
  }

  return c.json({
    success: true,
    message: "Backup initiated",
    progress: activeTask.currentProgress,
  });
});

/**
 * GET /api/backup/progress
 * Streams real-time backup progress via Server-Sent Events (SSE) or returns JSON status snapshot.
 */
backupRouter.get("/progress", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  const accept = c.req.header("accept") || "";
  const isSSE = accept.includes("text/event-stream");
  const task = activeBackupTasks.get(userId);

  if (!isSSE) {
    return c.json({
      active: !!task,
      progress: task
        ? task.currentProgress
        : {
            status: "idle",
            phase: "No backup in progress",
            totalNotes: 0,
            processedNotes: 0,
            percent: 0,
          },
    });
  }

  let listener: ((event: BackupProgressEvent) => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Emit current progress immediately
      const initial = task
        ? task.currentProgress
        : {
            status: "idle",
            phase: "No backup in progress",
            totalNotes: 0,
            processedNotes: 0,
            percent: 0,
          };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

      if (task) {
        listener = (event: BackupProgressEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            if (
              event.status === "success" ||
              event.status === "failed" ||
              event.status === "cancelled"
            ) {
              setTimeout(() => {
                try {
                  controller.close();
                } catch {
                  // Already closed
                }
              }, 500);
            }
          } catch {
            // Stream closed
          }
        };
        task.listeners.add(listener);
      } else {
        // If no active task, close stream after initial snapshot
        controller.close();
      }
    },
    cancel() {
      if (listener && task) {
        task.listeners.delete(listener);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

/**
 * POST /api/backup/cancel
 * Safely cancels currently running backup for the authenticated user.
 */
backupRouter.post("/cancel", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  const cancelled = cancelActiveTask(userId);
  if (!cancelled) {
    return c.json({ success: false, message: "No active backup in progress" }, 404);
  }

  return c.json({ success: true, message: "Active backup cancelled safely" });
});

/**
 * GET /api/backup/history
 * Lists historical backups for the user.
 */
backupRouter.get("/history", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  let history: any[] = [];
  if (sql) {
    try {
      history = await sql`
        SELECT id, drive_file_id, folder_path, backup_type, status, notes_count, file_size_bytes, error_message, created_at
        FROM backup_history
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } catch {
      return c.json({ error: "Failed to retrieve backup history" }, 500);
    }
  }

  return c.json({ history });
});

/**
 * POST /api/backup/restore
 * Restores notes from a specific Google Drive backup file.
 */
const RestoreSchema = z.object({
  driveFileId: z.string().min(1),
});

backupRouter.post("/restore", async (c) => {
  const auth = await requireUser(c);
  if (typeof auth !== "string") return auth;
  const userId = auth;

  let body;
  try {
    body = RestoreSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "driveFileId is required" }, 400);
  }

  try {
    const result = await performRestore(userId, body.driveFileId);
    return c.json({ success: true, restore: result });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Restore failed" },
      500
    );
  }
});
