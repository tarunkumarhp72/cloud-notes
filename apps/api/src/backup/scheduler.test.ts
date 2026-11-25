import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateNextBackupDate } from "./backupService";
import {
  scheduleUserBackup,
  cancelUserScheduledBackup,
  getUserScheduledTask,
  getActiveTaskCount,
  stopBackupScheduler,
} from "./scheduler";
import {
  registerActiveTask,
  cancelActiveTask,
  activeBackupTasks,
  broadcastTaskProgress,
  type BackupProgressEvent,
} from "./activeTasks";

describe("Dynamic Backup Scheduler & Task Management", () => {
  beforeEach(() => {
    stopBackupScheduler();
    activeBackupTasks.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopBackupScheduler();
    activeBackupTasks.clear();
    vi.useRealTimers();
  });

  describe("Frequency & Time Calculation (Requirements 2 & 5)", () => {
    it("preserves exact hour, minute, and second for Daily backup", () => {
      // User enables Daily backup at 10:30:45 AM
      const base = new Date("2026-11-25T10:30:45.000Z");
      const next = calculateNextBackupDate("daily", base);

      expect(next).not.toBeNull();
      expect(next!.getUTCHours()).toBe(10);
      expect(next!.getUTCMinutes()).toBe(30);
      expect(next!.getUTCSeconds()).toBe(45);
      expect(next!.toISOString()).toBe("2026-11-26T10:30:45.000Z");
    });

    it("preserves exact day-of-week and time for Weekly backup", () => {
      // User enables Weekly backup on Wednesday at 14:15:00
      const base = new Date("2026-11-25T14:15:00.000Z"); // Wed
      const next = calculateNextBackupDate("weekly", base);

      expect(next).not.toBeNull();
      expect(next!.getUTCDay()).toBe(base.getUTCDay()); // Same weekday (Wed)
      expect(next!.getUTCHours()).toBe(14);
      expect(next!.getUTCMinutes()).toBe(15);
      expect(next!.toISOString()).toBe("2026-12-02T14:15:00.000Z");
    });

    it("preserves exact day of month and time for Monthly backup", () => {
      const base = new Date("2026-11-15T09:00:00.000Z");
      const next = calculateNextBackupDate("monthly", base);

      expect(next).not.toBeNull();
      expect(next!.getUTCDate()).toBe(15);
      expect(next!.getUTCHours()).toBe(9);
      expect(next!.toISOString()).toBe("2026-12-15T09:00:00.000Z");
    });

    it("correctly clamps short months for Monthly backup (Jan 31 -> Feb 28)", () => {
      // 2027 is not a leap year, Feb has 28 days
      const base = new Date("2027-01-31T10:30:00.000Z");
      const next = calculateNextBackupDate("monthly", base);

      expect(next).not.toBeNull();
      expect(next!.getUTCMonth()).toBe(1); // February (0-indexed: Jan=0, Feb=1)
      expect(next!.getUTCDate()).toBe(28); // Clamped to 28
      expect(next!.getUTCHours()).toBe(10);
      expect(next!.getUTCMinutes()).toBe(30);
    });

    it("returns null when frequency is disabled", () => {
      expect(calculateNextBackupDate("disabled")).toBeNull();
    });
  });

  describe("Scheduler Task Lifecycle & Strict 1 Task Per User (Requirement 3 & 4)", () => {
    const testUserId = "user-12345";

    it("Scenario 1: Daily -> Weekly dynamically replaces existing task without duplicates", () => {
      // 1. User schedules Daily backup
      const t1 = scheduleUserBackup(testUserId, "daily");
      expect(t1).not.toBeNull();
      expect(getActiveTaskCount()).toBe(1);
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("daily");

      // 2. User switches to Weekly backup
      const t2 = scheduleUserBackup(testUserId, "weekly");
      expect(t2).not.toBeNull();

      // STRICT CHECK: exactly 1 active task for this user
      expect(getActiveTaskCount()).toBe(1);
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("weekly");
    });

    it("Scenario 2: Weekly -> Monthly dynamically replaces task", () => {
      scheduleUserBackup(testUserId, "weekly");
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("weekly");

      scheduleUserBackup(testUserId, "monthly");
      expect(getActiveTaskCount()).toBe(1);
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("monthly");
    });

    it("Scenario 3: Monthly -> Daily dynamically replaces task", () => {
      scheduleUserBackup(testUserId, "monthly");
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("monthly");

      scheduleUserBackup(testUserId, "daily");
      expect(getActiveTaskCount()).toBe(1);
      expect(getUserScheduledTask(testUserId)?.frequency).toBe("daily");
    });

    it("Scenario 4: Disable Automatic Backup cancels existing task without orphaned jobs", () => {
      scheduleUserBackup(testUserId, "daily");
      expect(getActiveTaskCount()).toBe(1);

      const cancelled = cancelUserScheduledBackup(testUserId);
      expect(cancelled).toBe(true);
      expect(getActiveTaskCount()).toBe(0);
      expect(getUserScheduledTask(testUserId)).toBeNull();
    });

    it("cancelling a non-existent task is safe and returns false (idempotent)", () => {
      expect(cancelUserScheduledBackup("non-existent-user")).toBe(false);
      expect(getActiveTaskCount()).toBe(0);
    });

    it("maintains separate tasks for distinct users (no cross-user interference)", () => {
      scheduleUserBackup("user-A", "daily");
      scheduleUserBackup("user-B", "weekly");
      scheduleUserBackup("user-C", "monthly");

      expect(getActiveTaskCount()).toBe(3);
      expect(getUserScheduledTask("user-A")?.frequency).toBe("daily");
      expect(getUserScheduledTask("user-B")?.frequency).toBe("weekly");
      expect(getUserScheduledTask("user-C")?.frequency).toBe("monthly");

      // Cancel user B only
      cancelUserScheduledBackup("user-B");
      expect(getActiveTaskCount()).toBe(2);
      expect(getUserScheduledTask("user-A")).not.toBeNull();
      expect(getUserScheduledTask("user-B")).toBeNull();
      expect(getUserScheduledTask("user-C")).not.toBeNull();
    });
  });

  describe("Active Task Progress, Cancellation & Concurrency (Requirements 1, 3, 4)", () => {
    const testUserId = "user-active-99";

    it("registers active task and prevents simultaneous backup execution for same user", () => {
      const task = registerActiveTask(testUserId, "manual");
      expect(task).toBeDefined();
      expect(task.userId).toBe(testUserId);
      expect(activeBackupTasks.has(testUserId)).toBe(true);

      // Attempting to register another simultaneous backup for the same user must throw
      expect(() => registerActiveTask(testUserId, "manual")).toThrow(
        "A backup is already in progress for this account"
      );
    });

    it("Scenario 5: User Cancels Active Backup aborts signal and notifies listeners", () => {
      const task = registerActiveTask(testUserId, "manual");
      let receivedEvent: BackupProgressEvent | null = null;

      task.listeners.add((evt) => {
        receivedEvent = evt;
      });

      expect(task.abortController.signal.aborted).toBe(false);

      const cancelled = cancelActiveTask(testUserId);
      expect(cancelled).toBe(true);
      expect(task.abortController.signal.aborted).toBe(true);
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.status).toBe("cancelled");
      expect(activeBackupTasks.has(testUserId)).toBe(false);
    });

    it("broadcasts note-by-note progress to active task listeners", () => {
      const task = registerActiveTask(testUserId, "manual");
      const progressHistory: BackupProgressEvent[] = [];

      task.listeners.add((evt) => {
        progressHistory.push(evt);
      });

      broadcastTaskProgress(testUserId, {
        status: "in_progress",
        phase: "Backing up notes (31%)",
        totalNotes: 100,
        processedNotes: 31,
        percent: 31,
      });

      expect(progressHistory.length).toBe(1);
      expect(progressHistory[0].processedNotes).toBe(31);
      expect(progressHistory[0].totalNotes).toBe(100);
      expect(progressHistory[0].percent).toBe(31);
      expect(task.currentProgress.percent).toBe(31);
    });

    it("Scenario 6: Disconnecting Google Drive cancels both active backup and scheduled task", () => {
      // Setup scheduled task and active backup
      scheduleUserBackup(testUserId, "daily");
      registerActiveTask(testUserId, "manual");

      expect(getActiveTaskCount()).toBe(1);
      expect(activeBackupTasks.has(testUserId)).toBe(true);

      // Simulate disconnect cleanup actions
      cancelActiveTask(testUserId);
      cancelUserScheduledBackup(testUserId);

      expect(getActiveTaskCount()).toBe(0);
      expect(activeBackupTasks.has(testUserId)).toBe(false);
    });
  });
});
