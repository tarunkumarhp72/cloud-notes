export interface BackupProgressEvent {
  status: "in_progress" | "success" | "failed" | "cancelled";
  phase: string;
  totalNotes: number;
  processedNotes: number;
  percent: number;
  errorMessage?: string;
  backupId?: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface ActiveTask {
  userId: string;
  backupType: "manual" | "daily" | "weekly" | "monthly";
  abortController: AbortController;
  currentProgress: BackupProgressEvent;
  listeners: Set<(event: BackupProgressEvent) => void>;
  startedAt: number;
}

/**
 * In-memory map of currently active backup tasks by userId.
 * Guarantees that at most ONE backup execution runs per user at any moment.
 */
export const activeBackupTasks = new Map<string, ActiveTask>();

export function registerActiveTask(
  userId: string,
  backupType: "manual" | "daily" | "weekly" | "monthly"
): ActiveTask {
  const existing = activeBackupTasks.get(userId);
  if (existing) {
    throw new Error("A backup is already in progress for this account");
  }

  const abortController = new AbortController();
  const initialProgress: BackupProgressEvent = {
    status: "in_progress",
    phase: "Preparing backup...",
    totalNotes: 0,
    processedNotes: 0,
    percent: 0,
  };

  const task: ActiveTask = {
    userId,
    backupType,
    abortController,
    currentProgress: initialProgress,
    listeners: new Set(),
    startedAt: Date.now(),
  };

  activeBackupTasks.set(userId, task);
  return task;
}

export function broadcastTaskProgress(userId: string, event: BackupProgressEvent): void {
  const task = activeBackupTasks.get(userId);
  if (!task) return;

  task.currentProgress = event;
  for (const listener of task.listeners) {
    try {
      listener(event);
    } catch {
      // Ignore dead subscriber errors
    }
  }

  if (event.status === "success" || event.status === "failed" || event.status === "cancelled") {
    // Keep task available briefly for final subscribers, then delete
    setTimeout(() => {
      if (activeBackupTasks.get(userId) === task) {
        activeBackupTasks.delete(userId);
      }
    }, 2000);
  }
}

export function cancelActiveTask(userId: string): boolean {
  const task = activeBackupTasks.get(userId);
  if (!task) return false;

  task.abortController.abort();
  broadcastTaskProgress(userId, {
    status: "cancelled",
    phase: "Backup cancelled by user",
    totalNotes: task.currentProgress.totalNotes,
    processedNotes: task.currentProgress.processedNotes,
    percent: task.currentProgress.percent,
  });

  activeBackupTasks.delete(userId);
  return true;
}
