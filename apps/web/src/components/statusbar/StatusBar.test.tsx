import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatusBar } from "./StatusBar";

describe("StatusBar Component", () => {
  it("does not render when visible is false", () => {
    const { container } = render(
      <StatusBar
        visible={false}
        line={1}
        col={1}
        charCount={10}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders accurate cursor coordinates, character count, and format tokens", () => {
    const onGoToClick = vi.fn();
    const onZoomClick = vi.fn();

    render(
      <StatusBar
        visible={true}
        line={5}
        col={18}
        charCount={142}
        mode="plain"
        zoomLevel={100}
        lineEnding="Windows (CRLF)"
        encoding="UTF-8"
        onGoToClick={onGoToClick}
        onZoomClick={onZoomClick}
      />
    );

    const lnColBtn = screen.getByRole("button", { name: "Line 5, Column 18" });
    expect(lnColBtn.textContent).toContain("Ln 5, Col 18");
    fireEvent.click(lnColBtn);
    expect(onGoToClick).toHaveBeenCalledTimes(1);

    expect(screen.getByText("142 characters")).toBeDefined();
    expect(screen.getByText("Plain text")).toBeDefined();

    const zoomBtn = screen.getByRole("button", { name: "Zoom 100%" });
    expect(zoomBtn.textContent).toContain("100%");
    fireEvent.click(zoomBtn);
    expect(onZoomClick).toHaveBeenCalledTimes(1);

    expect(screen.getByText("Windows (CRLF)")).toBeDefined();
    expect(screen.getByText("UTF-8")).toBeDefined();
  });

  it("renders markdown label and selected character count", () => {
    render(
      <StatusBar
        line={2}
        col={10}
        charCount={50}
        selectedCount={12}
        mode="markdown"
        zoomLevel={120}
      />
    );

    expect(screen.getByText("Markdown")).toBeDefined();
    expect(screen.getByText("12 selected, 50 characters")).toBeDefined();
    expect(screen.getByText("120%")).toBeDefined();
  });

  it("renders distinct sync status indicators: Saving, Saved, Offline, Sync failed", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <StatusBar
        line={1}
        col={1}
        charCount={0}
        syncStatus="saving"
      />
    );
    expect(screen.getByText("Saving")).toBeDefined();

    rerender(
      <StatusBar
        line={1}
        col={1}
        charCount={0}
        syncStatus="saved"
      />
    );
    expect(screen.getByText("Saved")).toBeDefined();

    rerender(
      <StatusBar
        line={1}
        col={1}
        charCount={0}
        syncStatus="offline"
      />
    );
    expect(screen.getByText("Offline")).toBeDefined();

    rerender(
      <StatusBar
        line={1}
        col={1}
        charCount={0}
        syncStatus="sync_failed"
        onRetrySync={onRetry}
      />
    );
    const retryBtn = screen.getByRole("button", { name: /Sync failed/ });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
