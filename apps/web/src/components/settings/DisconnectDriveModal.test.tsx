import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisconnectDriveModal } from "./DisconnectDriveModal";

describe("DisconnectDriveModal Component", () => {
  it("does not render when isOpen is false", () => {
    render(<DisconnectDriveModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders modal with Google email and confirmation text when open", () => {
    render(
      <DisconnectDriveModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        googleEmail="user@example.com"
      />
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Disconnect Google Drive?")).toBeDefined();
    expect(screen.getByText("user@example.com")).toBeDefined();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^disconnect$/i })).toBeDefined();
  });

  it("clicking Cancel calls onClose", () => {
    const handleClose = vi.fn();
    render(
      <DisconnectDriveModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("clicking Disconnect calls onConfirm", () => {
    const handleConfirm = vi.fn();
    render(
      <DisconnectDriveModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^disconnect$/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("pressing Escape key triggers onClose", () => {
    const handleClose = vi.fn();
    render(
      <DisconnectDriveModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
