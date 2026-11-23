import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerServiceWorker, isServiceWorkerSupported } from "./sw";

describe("registerServiceWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("detects whether serviceWorker is supported", () => {
    // In jsdom without navigator.serviceWorker
    const originalSW = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(isServiceWorkerSupported()).toBe(false);
    const cleanup = registerServiceWorker();
    expect(typeof cleanup).toBe("function");

    Object.defineProperty(navigator, "serviceWorker", {
      value: originalSW,
      configurable: true,
      writable: true,
    });
  });

  it("registers service worker and triggers callbacks on success", async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
    };

    const mockRegister = vi.fn().mockResolvedValue(mockRegistration);

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: mockRegister,
        controller: null,
      },
      configurable: true,
      writable: true,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    registerServiceWorker({
      swUrl: "/sw.js",
      onSuccess,
      onError,
    });

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("/sw.js");
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it("handles registration errors gracefully via onError callback", async () => {
    const testError = new Error("Registration failed");
    const mockRegister = vi.fn().mockRejectedValue(testError);

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: mockRegister,
        controller: null,
      },
      configurable: true,
      writable: true,
    });

    const onError = vi.fn();

    registerServiceWorker({
      swUrl: "/sw.js",
      onError,
    });

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("/sw.js");
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });
});
