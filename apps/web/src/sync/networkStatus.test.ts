import { describe, it, expect, vi } from "vitest";
import { NetworkMonitor } from "./networkStatus";

describe("NetworkMonitor", () => {
  it("initializes with provided or navigator status", () => {
    const monitorOnline = new NetworkMonitor(true);
    expect(monitorOnline.isOnline()).toBe(true);

    const monitorOffline = new NetworkMonitor(false);
    expect(monitorOffline.isOnline()).toBe(false);
  });

  it("subscribes and receives immediate current state", () => {
    const monitor = new NetworkMonitor(false);
    const listener = vi.fn();

    const unsub = monitor.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(false);

    unsub();
  });

  it("notifies listeners on transition", () => {
    const monitor = new NetworkMonitor(true);
    const listener = vi.fn();

    monitor.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(true);

    monitor.setOnline(false);
    expect(listener).toHaveBeenCalledWith(false);

    monitor.setOnline(true);
    expect(listener).toHaveBeenCalledWith(true);
  });

  it("unsubscribes and destroys listeners cleanly", () => {
    const monitor = new NetworkMonitor(true);
    const listener = vi.fn();

    const unsub = monitor.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    monitor.setOnline(false);
    expect(listener).toHaveBeenCalledTimes(1);

    monitor.subscribe(listener);
    monitor.destroy();
    monitor.setOnline(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
