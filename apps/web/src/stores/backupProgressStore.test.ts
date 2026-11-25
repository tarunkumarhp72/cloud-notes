import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBackupProgressStore } from "./backupProgressStore";

describe("backupProgressStore", () => {
  beforeEach(() => {
    useBackupProgressStore.setState({
      isVisible: false,
      status: "idle",
      phase: "",
      totalNotes: 0,
      processedNotes: 0,
      percent: 0,
      errorMessage: null,
      fileName: null,
      backupId: null,
      activeAbortController: null,
      dismissTimer: null,
    });
    vi.restoreAllMocks();
  });

  it("initializes with default idle state", () => {
    const state = useBackupProgressStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.percent).toBe(0);
  });

  it("updates progress via setProgress", () => {
    useBackupProgressStore.getState().setProgress({
      isVisible: true,
      status: "in_progress",
      phase: "Preparing backup (31%)",
      totalNotes: 100,
      processedNotes: 31,
      percent: 31,
    });

    const state = useBackupProgressStore.getState();
    expect(state.isVisible).toBe(true);
    expect(state.status).toBe("in_progress");
    expect(state.percent).toBe(31);
    expect(state.processedNotes).toBe(31);
    expect(state.totalNotes).toBe(100);
  });

  it("dismiss hides notification and clears timers", () => {
    const mockTimer = setTimeout(() => {}, 10000);
    useBackupProgressStore.setState({
      isVisible: true,
      dismissTimer: mockTimer,
    });

    useBackupProgressStore.getState().dismiss();

    const state = useBackupProgressStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.dismissTimer).toBeNull();
  });

  it("cancelBackup aborts active controller, sets cancelled status, and calls API", async () => {
    const abortSpy = vi.fn();
    const mockController = { abort: abortSpy } as unknown as AbortController;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    useBackupProgressStore.setState({
      isVisible: true,
      status: "in_progress",
      activeAbortController: mockController,
    });

    await useBackupProgressStore.getState().cancelBackup("test-token");

    expect(abortSpy).toHaveBeenCalled();
    const state = useBackupProgressStore.getState();
    expect(state.status).toBe("cancelled");
    expect(state.phase).toBe("Backup cancelled by user");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/backup/cancel"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });
});
