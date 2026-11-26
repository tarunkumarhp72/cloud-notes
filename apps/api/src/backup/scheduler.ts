import { sql } from "../db.js";
import { performBackup, calculateNextBackupDate } from "./backupService.js";
import { activeBackupTasks, registerActiveTask, broadcastTaskProgress } from "./activeTasks.js";

export interface ScheduledTaskInfo {
  timer: NodeJS.Timeout;
  frequency: "daily" | "weekly" | "monthly";
  targetTime: Date;
}

/**
 * Strict 1-Task-Per-User In-Memory Task Registry.
 * Guarantees that at most ONE scheduled backup timer exists per user at any time.
 */
export const userTaskRegistry = new Map<string, ScheduledTaskInfo>();

let sweepIntervalTimer: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Registers or dynamically replaces a scheduled backup task for a user.
 * Automatically cancels any existing task before creating the new one.
 */
export function scheduleUserBackup(
  userId: string,
  frequency: "daily" | "weekly" | "monthly",
  anchorDate?: Date
): Date | null {
  // 1. Cancel and remove any existing task for this user
  cancelUserScheduledBackup(userId);

  // 2. Calculate next target date preserving the user's initial time-of-day
  const nextTarget = calculateNextBackupDate(frequency, anchorDate || new Date());
  if (!nextTarget) return null;

  const msUntilTarget = Math.max(1000, nextTarget.getTime() - Date.now());

  // 3. Create timer for exact execution
  // Note: Cap single setTimeout delay at 24 hours to prevent Node 32-bit int overflow on long intervals
  const maxDelay = 24 * 60 * 60 * 1000;
  const timeoutDuration = Math.min(msUntilTarget, maxDelay);

  const timer = setTimeout(async () => {
    // If target has arrived, execute backup; otherwise reschedule
    if (Date.now() >= nextTarget.getTime() - 2000) {
      try {
        await executeScheduledBackupForUser(userId, frequency);
      } catch (err) {
        console.error(`[DYNAMIC SCHEDULER] Error executing scheduled backup for user ${userId}:`, err);
      } finally {
        // Reschedule for next frequency interval
        scheduleUserBackup(userId, frequency, nextTarget);
      }
    } else {
      // Re-arm timer until target is reached
      scheduleUserBackup(userId, frequency, anchorDate);
    }
  }, timeoutDuration);

  userTaskRegistry.set(userId, {
    timer,
    frequency,
    targetTime: nextTarget,
  });

  return nextTarget;
}

/**
 * Cancels and cleans up the active scheduled backup task for a user.
 * Idempotent: safe to call even if no task is currently registered.
 */
export function cancelUserScheduledBackup(userId: string): boolean {
  const existing = userTaskRegistry.get(userId);
  if (existing) {
    clearTimeout(existing.timer);
    userTaskRegistry.delete(userId);
    return true;
  }
  return false;
}

/**
 * Retrieves the currently registered scheduled task info for a user.
 */
export function getUserScheduledTask(userId: string): { frequency: string; targetTime: Date } | null {
  const task = userTaskRegistry.get(userId);
  if (!task) return null;
  return {
    frequency: task.frequency,
    targetTime: task.targetTime,
  };
}

/**
 * Returns total count of active in-memory user scheduler tasks.
 */
export function getActiveTaskCount(): number {
  return userTaskRegistry.size;
}

/**
 * Executes backup for a specific scheduled user with task registration and progress broadcasting.
 */
export async function executeScheduledBackupForUser(
  userId: string,
  frequency: "daily" | "weekly" | "monthly"
): Promise<void> {
  // Prevent duplicate execution if backup is already running for this user
  if (activeBackupTasks.has(userId)) {
    console.warn(`[DYNAMIC SCHEDULER] User ${userId} already has an active backup in progress, skipping scheduled trigger.`);
    return;
  }

  const activeTask = registerActiveTask(userId, frequency);
  try {
    const result = await performBackup(
      userId,
      frequency,
      (event) => broadcastTaskProgress(userId, event),
      activeTask.abortController.signal
    );
    console.log(`[DYNAMIC SCHEDULER] Scheduled ${frequency} backup succeeded for user ${userId}: file ${result.fileName}`);
  } catch (err) {
    console.error(`[DYNAMIC SCHEDULER] Scheduled ${frequency} backup failed for user ${userId}:`, err);
    throw err;
  } finally {
    if (activeBackupTasks.get(userId) === activeTask) {
      activeBackupTasks.delete(userId);
    }
  }
}

/**
 * Periodic database sweep across all users whose next_backup_at is due.
 * Uses PostgreSQL 'FOR UPDATE SKIP LOCKED' to prevent multi-worker/multi-instance duplicate execution.
 */
export async function runScheduledBackups(): Promise<{ processed: number; errors: number }> {
  if (!sql) return { processed: 0, errors: 0 };
  if (isProcessing) return { processed: 0, errors: 0 };

  isProcessing = true;
  let processed = 0;
  let errors = 0;

  try {
    // SELECT with row-level lock SKIP LOCKED guarantees mutual exclusion across concurrent worker instances
    const dueUsers = await sql`
      SELECT s.user_id, s.frequency, s.next_backup_at
      FROM backup_settings s
      JOIN google_drive_connections c ON s.user_id = c.user_id
      WHERE s.auto_backup_enabled = TRUE
        AND c.status = 'connected'
        AND s.frequency != 'disabled'
        AND (s.next_backup_at IS NULL OR s.next_backup_at <= NOW())
      FOR UPDATE OF s SKIP LOCKED
      LIMIT 10
    `;

    for (const user of dueUsers) {
      try {
        await executeScheduledBackupForUser(user.user_id, user.frequency as "daily" | "weekly" | "monthly");
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
 * Restores scheduled tasks on backend boot from database configurations.
 */
export async function restoreScheduledTasksFromDb(): Promise<number> {
  if (!sql) return 0;
  let restored = 0;

  try {
    const activeConfigs = await sql`
      SELECT s.user_id, s.frequency, s.next_backup_at
      FROM backup_settings s
      JOIN google_drive_connections c ON s.user_id = c.user_id
      WHERE s.auto_backup_enabled = TRUE
        AND c.status = 'connected'
        AND s.frequency != 'disabled'
    `;

    for (const conf of activeConfigs) {
      const nextTime = conf.next_backup_at ? new Date(conf.next_backup_at) : undefined;
      scheduleUserBackup(conf.user_id, conf.frequency as "daily" | "weekly" | "monthly", nextTime);
      restored++;
    }

    console.log(`[DYNAMIC SCHEDULER] Restored ${restored} active scheduled backup tasks from database.`);
  } catch (err) {
    console.error("[DYNAMIC SCHEDULER] Failed to restore scheduled tasks from database:", err);
  }

  return restored;
}

/**
 * Initializes autonomous background backup timer and restores database schedules.
 */
export function startBackupScheduler(intervalMs = 60 * 1000): void {
  if (sweepIntervalTimer) return;

  // Restore existing schedules from database shortly after boot
  setTimeout(() => {
    restoreScheduledTasksFromDb().catch(() => {});
    runScheduledBackups().catch(() => {});
  }, 3000);

  // Periodic 1-minute sweep for overdue tasks and multi-instance catch-up
  sweepIntervalTimer = setInterval(() => {
    runScheduledBackups().catch(() => {});
  }, intervalMs);

  console.log(`[BACKUP SCHEDULER] Autonomous Google Drive backup scheduler running (sweep interval: ${intervalMs / 1000}s)`);
}

/**
 * Halts autonomous background timers and clears all user tasks.
 */
export function stopBackupScheduler(): void {
  if (sweepIntervalTimer) {
    clearInterval(sweepIntervalTimer);
    sweepIntervalTimer = null;
  }

  // Clear all individual user timers
  for (const task of userTaskRegistry.values()) {
    clearTimeout(task.timer);
  }
  userTaskRegistry.clear();
}
