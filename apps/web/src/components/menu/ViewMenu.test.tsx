import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewMenu } from "./ViewMenu";

describe("ViewMenu Component", () => {
  it("renders all top-level items matching Windows Notepad", () => {
    render(<ViewMenu statusBarVisible={true} wordWrap={false} />);

    expect(screen.getByRole("menuitem", { name: /zoom/i })).toBeDefined();
    expect(screen.getByRole("menuitemcheckbox", { name: /status bar/i })).toBeDefined();
    expect(screen.getByRole("menuitemcheckbox", { name: /word wrap/i })).toBeDefined();
    expect(screen.getByRole("menuitemcheckbox", { name: /markdown/i })).toBeDefined();
  });

  it("handles Status bar and Word wrap toggles", () => {
    const handleToggleStatus = vi.fn();
    const handleToggleWrap = vi.fn();

    render(
      <ViewMenu
        statusBarVisible={true}
        wordWrap={false}
        onToggleStatusBar={handleToggleStatus}
        onToggleWordWrap={handleToggleWrap}
      />
    );

    const statusBarItem = screen.getByRole("menuitemcheckbox", { name: /status bar/i });
    expect(statusBarItem.getAttribute("aria-checked")).toBe("true");

    const wordWrapItem = screen.getByRole("menuitemcheckbox", { name: /word wrap/i });
    expect(wordWrapItem.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(statusBarItem);
    expect(handleToggleStatus).toHaveBeenCalledTimes(1);

    fireEvent.click(wordWrapItem);
    expect(handleToggleWrap).toHaveBeenCalledTimes(1);
  });

  it("opens Zoom submenu and triggers zoom actions", () => {
    const handleZoomIn = vi.fn();
    const handleZoomOut = vi.fn();
    const handleResetZoom = vi.fn();

    render(
      <ViewMenu
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
    );

    // Zoom submenu initially closed
    expect(screen.queryByRole("menu", { name: /zoom submenu/i })).toBeNull();

    // Click Zoom to open submenu
    const zoomItem = screen.getByRole("menuitem", { name: /zoom/i });
    fireEvent.click(zoomItem);

    expect(screen.getByRole("menu", { name: /zoom submenu/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /zoom in/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /zoom out/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /restore default zoom/i })).toBeDefined();

    // Click Zoom in
    fireEvent.click(screen.getByRole("menuitem", { name: /zoom in/i }));
    expect(handleZoomIn).toHaveBeenCalledTimes(1);

    // Re-open and click Zoom out
    fireEvent.click(zoomItem);
    fireEvent.click(screen.getByRole("menuitem", { name: /zoom out/i }));
    expect(handleZoomOut).toHaveBeenCalledTimes(1);
  });
});
