import { sql } from "../db";
import { performBackup } from "./backupService";

let schedulerTimer: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Executes scheduled backups for all users whose next_backup_at is due.
 */
export async function runScheduledBackups(): Promise<{ processed: number; errors: number }> {
  if (!sql) return { processed: 0, errors: 0 };
  if (isProcessing) return { processed: 0, errors: 0 };

  isProcessing = true;
  let processed = 0;
  let errors = 0;

  try {
    const dueUsers = await sql`
      SELECT s.user_id, s.frequency
      FROM backup_settings s
      JOIN google_drive_connections c ON s.user_id = c.user_id
      WHERE s.auto_backup_enabled = TRUE
        AND c.status = 'connected'
        AND s.frequency != 'disabled'
        AND (s.next_backup_at IS NULL OR s.next_backup_at <= NOW())
      LIMIT 25
    `;

    for (const user of dueUsers) {
      try {
        await performBackup(user.user_id, user.frequency as "daily" | "weekly" | "monthly");
        processed++;
      } catch (err) {
        errors++;
        console.error(`[BACKUP SCHEDULER] Failed backup for user ${user.user_id}:`, err);
      }
    }
  } catch (err) {
    console.error("[BACKUP SCHEDULER] Error querying scheduled backups:", err);
  } finally {
    isProcessing = false;
  }

  return { processed, errors };
}

/**
 * Initializes autonomous background backup timer.
 */
export function startBackupScheduler(intervalMs = 15 * 60 * 1000): void {
  if (schedulerTimer) return;

  // Run on startup shortly after boot, then on interval
  setTimeout(() => {
    runScheduledBackups().catch(() => {});
  }, 10_000);

  schedulerTimer = setInterval(() => {
    runScheduledBackups().catch(() => {});
  }, intervalMs);

  console.log(`[BACKUP SCHEDULER] Autonomous Google Drive backup scheduler running (interval: ${intervalMs / 1000}s)`);
}

/**
 * Halts autonomous background timer (for graceful shutdown and unit tests).
 */
export function stopBackupScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
