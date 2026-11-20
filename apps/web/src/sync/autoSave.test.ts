import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AutoSaveCoordinator, AutoSavePayload } from "./localAutoSave";

describe("Local AutoSave Coordinator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves note precisely 1 second after typing ceases", async () => {
    const saveWriter = vi.fn().mockResolvedValue(undefined);
    const coordinator = new AutoSaveCoordinator(saveWriter, { debounceMs: 1000, maxWaitMs: 10000 });

    const note: AutoSavePayload = {
      id: "note-1",
      title: "My Note",
      content: "Hello",
      isMarkdown: false,
    };

    coordinator.notifyChange(note);
    expect(coordinator.hasPending()).toBe(true);

    // Fast-forward 500ms (typing stopped, but only 500ms elapsed)
    vi.advanceTimersByTime(500);
    expect(saveWriter).not.toHaveBeenCalled();

    // Fast-forward another 500ms (1000ms total elapsed)
    vi.advanceTimersByTime(500);
    await Promise.resolve();

    expect(saveWriter).toHaveBeenCalledTimes(1);
    expect(saveWriter).toHaveBeenCalledWith(note);
    expect(coordinator.hasPending()).toBe(false);

    coordinator.destroy();
  });

  it("resets 1-second debounce when keystrokes continue within the window", async () => {
    const saveWriter = vi.fn().mockResolvedValue(undefined);
    const coordinator = new AutoSaveCoordinator(saveWriter, { debounceMs: 1000, maxWaitMs: 10000 });

    coordinator.notifyChange({ id: "note-1", title: "Note", content: "A", isMarkdown: false });
    vi.advanceTimersByTime(600);

    coordinator.notifyChange({ id: "note-1", title: "Note", content: "AB", isMarkdown: false });
    vi.advanceTimersByTime(600);

    coordinator.notifyChange({ id: "note-1", title: "Note", content: "ABC", isMarkdown: false });
    vi.advanceTimersByTime(600);

    // Total elapsed: 1800ms, but no 1000ms quiet pause yet
    expect(saveWriter).not.toHaveBeenCalled();

    // Now wait full 1000ms
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(saveWriter).toHaveBeenCalledTimes(1);
    expect(saveWriter).toHaveBeenCalledWith({ id: "note-1", title: "Note", content: "ABC", isMarkdown: false });

    coordinator.destroy();
  });

  it("forces a save every 10 seconds during continuous uninterrupted typing", async () => {
    const saveWriter = vi.fn().mockResolvedValue(undefined);
    const coordinator = new AutoSaveCoordinator(saveWriter, { debounceMs: 1000, maxWaitMs: 10000 });

    // Continuously type every 500ms for 10.5 seconds
    for (let t = 0; t <= 10000; t += 500) {
      coordinator.notifyChange({
        id: "note-1",
        title: "Note",
        content: `Content at ${t}ms`,
        isMarkdown: false,
      });
      vi.advanceTimersByTime(500);
    }

    await Promise.resolve();
    // At least one forced save must have executed at the 10-second mark
    expect(saveWriter).toHaveBeenCalled();

    coordinator.destroy();
  });

  it("immediately flushes unsaved state on manual flush (visibilitychange / pagehide)", async () => {
    const saveWriter = vi.fn().mockResolvedValue(undefined);
    const coordinator = new AutoSaveCoordinator(saveWriter, { debounceMs: 1000, maxWaitMs: 10000 });

    const note: AutoSavePayload = {
      id: "note-urgent",
      title: "Urgent",
      content: "Unsaved text before tab close",
      isMarkdown: false,
    };

    coordinator.notifyChange(note);
    expect(saveWriter).not.toHaveBeenCalled();

    // Trigger immediate flush as pagehide/visibilitychange does
    await coordinator.flush();

    expect(saveWriter).toHaveBeenCalledTimes(1);
    expect(saveWriter).toHaveBeenCalledWith(note);
    expect(coordinator.hasPending()).toBe(false);

    coordinator.destroy();
  });
});
