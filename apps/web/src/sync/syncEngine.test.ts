import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getOutboxItems,
  removeOutboxItems,
  incrementOutboxAttempts,
  enqueueOutboxItem,
  getOutboxCount,
} from "@notepad/core";
import {
  SyncEngine,
  calculateBackoffWithJitter,
  type SyncStatus,
} from "./syncEngine";

vi.mock("@notepad/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@notepad/core")>();
  return {
    ...actual,
    getOutboxItems: vi.fn().mockResolvedValue([]),
    removeOutboxItems: vi.fn().mockResolvedValue(undefined),
    incrementOutboxAttempts: vi.fn().mockResolvedValue(undefined),
    enqueueOutboxItem: vi.fn().mockResolvedValue({
      id: "mut-1",
      noteId: "note-1",
      action: "upsert",
      payload: "payload",
      attempts: 0,
      createdAt: new Date().toISOString(),
    }),
    getOutboxCount: vi.fn().mockResolvedValue(0),
  };
});

describe("SyncEngine (T-034)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates exponential backoff with bounded random jitter", () => {
    const delay0 = calculateBackoffWithJitter(0, 1000, 30000);
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(1300);

    const delay1 = calculateBackoffWithJitter(1, 1000, 30000);
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay1).toBeLessThanOrEqual(2600);

    const delayMax = calculateBackoffWithJitter(10, 1000, 10000);
    expect(delayMax).toBeGreaterThanOrEqual(10000);
    expect(delayMax).toBeLessThanOrEqual(13000);
  });

  it("notifies subscribers when sync status transitions", () => {
    const engine = new SyncEngine();
    const statuses: SyncStatus[] = [];

    const unsubscribe = engine.subscribe((s) => statuses.push(s));
    expect(statuses).toEqual(["idle"]);

    engine.setStatus("saving");
    engine.setStatus("saved");
    engine.setStatus("offline");
    engine.setStatus("sync_failed");

    expect(statuses).toEqual(["idle", "saving", "saved", "offline", "sync_failed"]);
    unsubscribe();
    engine.destroy();
  });

  it("schedules push 2 seconds after local note is saved", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", synced: [] }),
    });

    const engine = new SyncEngine({
      getAccessToken: () => "mock-jwt-token",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const pushSpy = vi.spyOn(engine, "push");

    await engine.onLocalNoteSaved("note-1", "mock-envelope-payload");
    expect(enqueueOutboxItem).toHaveBeenCalledWith("note-1", "upsert", "mock-envelope-payload");

    // Before 2000ms: not pushed yet
    vi.advanceTimersByTime(1500);
    expect(pushSpy).not.toHaveBeenCalled();

    // After 2000ms: pushed
    vi.advanceTimersByTime(600);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    engine.destroy();
  });

  it("executes successful sync push and removes synced items", async () => {
    const outboxMockItem = {
      id: "mut-1",
      noteId: "note-1",
      action: "upsert" as const,
      payload: "mock-envelope",
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    vi.mocked(getOutboxItems).mockResolvedValue([outboxMockItem]);
    vi.mocked(getOutboxCount).mockResolvedValue(0);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        synced: [{ mutationId: "mut-1", noteId: "note-1", version: 1, updatedAt: new Date().toISOString() }],
      }),
    });

    const engine = new SyncEngine({
      getAccessToken: () => "valid-token",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const success = await engine.push();
    expect(success).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sync/push",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer valid-token",
        }),
      })
    );

    expect(removeOutboxItems).toHaveBeenCalledWith(["mut-1"]);
    expect(engine.getStatus()).toBe("saved");
    engine.destroy();
  });

  it("handles push failures by transitioning to sync_failed and scheduling retry with backoff", async () => {
    const outboxMockItem = {
      id: "mut-fail",
      noteId: "note-fail",
      action: "upsert" as const,
      payload: "mock-envelope",
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    vi.mocked(getOutboxItems).mockResolvedValue([outboxMockItem]);
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));

    const engine = new SyncEngine({
      getAccessToken: () => "valid-token",
      fetchFn: mockFetch as unknown as typeof fetch,
      baseBackoffMs: 500,
    });

    const success = await engine.push();
    expect(success).toBe(false);

    expect(engine.getStatus()).toBe("sync_failed");
    expect(incrementOutboxAttempts).toHaveBeenCalledWith("mut-fail");

    engine.destroy();
  });
});
