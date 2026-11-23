import { describe, it, expect, vi } from "vitest";
import { TabBroadcastSync, type BroadcastEnvelope, type BroadcastEvent } from "./broadcast";

describe("TabBroadcastSync", () => {
  it("gracefully falls back when BroadcastChannel is unsupported", () => {
    const sync = new TabBroadcastSync("test_channel", "tab-1", null);
    expect(sync.isSupported()).toBe(false);

    // Should not throw on broadcast, subscribe, or destroy
    expect(() => {
      sync.broadcast({ type: "TAB_CLOSED", payload: { noteId: "note-1" } });
    }).not.toThrow();

    const handler = vi.fn();
    const unsub = sync.subscribe(handler);
    expect(typeof unsub).toBe("function");
    unsub();

    expect(() => sync.destroy()).not.toThrow();
  });

  it("envelopes and broadcasts messages with sender ID and timestamp", () => {
    const mockChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    } as unknown as BroadcastChannel;

    const sync = new TabBroadcastSync("test_channel", "tab-1", mockChannel);
    expect(sync.isSupported()).toBe(true);

    const event: BroadcastEvent = {
      type: "NOTE_UPDATED",
      payload: { noteId: "note-123", content: "New content", title: "Note 1" },
    };

    sync.broadcast(event);

    expect(mockChannel.postMessage).toHaveBeenCalledTimes(1);
    const sentEnvelope = (mockChannel.postMessage as any).mock.calls[0][0] as BroadcastEnvelope;
    expect(sentEnvelope.senderId).toBe("tab-1");
    expect(sentEnvelope.event).toEqual(event);
    expect(typeof sentEnvelope.timestamp).toBe("number");
  });

  it("ignores messages sent by itself (same senderId)", () => {
    let messageHandler: ((e: MessageEvent) => void) | null = null;
    const mockChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      set onmessage(fn: (e: MessageEvent) => void) {
        messageHandler = fn;
      },
    } as unknown as BroadcastChannel;

    const sync = new TabBroadcastSync("test_channel", "tab-1", mockChannel);
    const subscriber = vi.fn();
    sync.subscribe(subscriber);

    // Simulate message arriving from self
    const selfMessage: MessageEvent<BroadcastEnvelope> = {
      data: {
        senderId: "tab-1",
        event: { type: "NOTE_UPDATED", payload: { noteId: "note-1", content: "Updated" } },
        timestamp: Date.now(),
      },
    } as any;

    messageHandler!(selfMessage);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("delivers broadcast messages from other tabs to subscribers", () => {
    let messageHandler: ((e: MessageEvent) => void) | null = null;
    const mockChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      set onmessage(fn: (e: MessageEvent) => void) {
        messageHandler = fn;
      },
    } as unknown as BroadcastChannel;

    const sync = new TabBroadcastSync("test_channel", "tab-1", mockChannel);
    const subscriber = vi.fn();
    const unsub = sync.subscribe(subscriber);

    const remoteEvent: BroadcastEvent = {
      type: "TAB_CREATED",
      payload: { noteId: "note-99", title: "New Tab", content: "Initial", isMarkdown: false },
    };

    const remoteMessage: MessageEvent<BroadcastEnvelope> = {
      data: {
        senderId: "tab-2",
        event: remoteEvent,
        timestamp: Date.now(),
      },
    } as any;

    messageHandler!(remoteMessage);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(remoteEvent);

    // Unsubscribe and verify no more calls
    unsub();
    messageHandler!(remoteMessage);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("closes channel on destroy", () => {
    const mockChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    } as unknown as BroadcastChannel;

    const sync = new TabBroadcastSync("test_channel", "tab-1", mockChannel);
    sync.destroy();
    expect(mockChannel.close).toHaveBeenCalledTimes(1);
    expect(sync.isSupported()).toBe(false);
  });
});
