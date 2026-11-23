import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

describe("Tooltip Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children without showing tooltip initially", () => {
    render(
      <Tooltip content="Bold (Ctrl+B)">
        <button type="button">B</button>
      </Tooltip>
    );

    expect(screen.getByRole("button", { name: "B" })).toBeDefined();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows tooltip after delay on mouse enter and hides on mouse leave", () => {
    render(
      <Tooltip content="Bold (Ctrl+B)" delay={200}>
        <button type="button">B</button>
      </Tooltip>
    );

    const btn = screen.getByRole("button", { name: "B" });
    fireEvent.mouseEnter(btn);

    // Before delay completes
    expect(screen.queryByRole("tooltip")).toBeNull();

    // After delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toBe("Bold (Ctrl+B)");

    // Mouse leave hides it
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("hides tooltip on click", () => {
    render(
      <Tooltip content="Settings" delay={100}>
        <button type="button">Settings</button>
      </Tooltip>
    );

    const btn = screen.getByRole("button", { name: "Settings" });
    fireEvent.mouseEnter(btn);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole("tooltip")).toBeDefined();

    fireEvent.click(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
