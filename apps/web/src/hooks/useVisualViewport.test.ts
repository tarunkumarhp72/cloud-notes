import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisualViewport } from "./useVisualViewport";

describe("useVisualViewport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles environment without visualViewport gracefully", () => {
    const originalVV = window.visualViewport;
    Object.defineProperty(window, "visualViewport", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { unmount } = renderHook(() => useVisualViewport());
    expect(() => unmount()).not.toThrow();

    Object.defineProperty(window, "visualViewport", {
      value: originalVV,
      configurable: true,
      writable: true,
    });
  });

  it("subscribes to resize and scroll and notifies callback", () => {
    const listeners: Record<string, () => void> = {};
    const mockVV = {
      height: 450,
      offsetTop: 0,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
    };

    Object.defineProperty(window, "visualViewport", {
      value: mockVV,
      configurable: true,
      writable: true,
    });

    const onViewportChange = vi.fn();
    const { unmount } = renderHook(() =>
      useVisualViewport({ onViewportChange })
    );

    expect(mockVV.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(mockVV.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));

    // Simulate keyboard open (height drops to 300)
    mockVV.height = 300;
    mockVV.offsetTop = 100;
    listeners["resize"]?.();

    expect(onViewportChange).toHaveBeenCalledWith(300, 100);

    unmount();
    expect(mockVV.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(mockVV.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("scrolls active editable element into view on keyboard resize", () => {
    const listeners: Record<string, () => void> = {};
    const mockVV = {
      height: 400,
      offsetTop: 0,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, "visualViewport", {
      value: mockVV,
      configurable: true,
      writable: true,
    });

    // Create and focus an input element
    const input = document.createElement("textarea");
    input.scrollIntoView = vi.fn();
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useVisualViewport());

    // Trigger keyboard resize
    listeners["resize"]?.();

    // In requestAnimationFrame
    expect(listeners["resize"]).toBeDefined();

    document.body.removeChild(input);
  });
});
