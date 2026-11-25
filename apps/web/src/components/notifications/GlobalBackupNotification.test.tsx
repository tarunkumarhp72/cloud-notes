import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalBackupNotification } from "./GlobalBackupNotification";
import { useBackupProgressStore } from "../../stores/backupProgressStore";

describe("GlobalBackupNotification Component", () => {
  beforeEach(() => {
    useBackupProgressStore.setState({
      isVisible: false,
      isToastOnly: false,
      status: "idle",
      phase: "",
      totalNotes: 0,
      processedNotes: 0,
      percent: 0,
      errorMessage: null,
      fileName: null,
      backupId: null,
      activeAbortController: null,
      dismissTimer: null,
    });
    vi.restoreAllMocks();
  });

  it("does not render when isVisible is false", () => {
    render(<GlobalBackupNotification />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders WhatsApp-style in_progress notification with percentage and note count", () => {
    useBackupProgressStore.setState({
      isVisible: true,
      status: "in_progress",
      phase: "Preparing backup (31%)",
      totalNotes: 100,
      processedNotes: 31,
      percent: 31,
    });

    render(<GlobalBackupNotification accessToken="mock-token" />);

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Google Drive Backup")).toBeDefined();
    expect(screen.getByText("Backup in progress")).toBeDefined();
    expect(screen.getByText("Preparing backup (31%)")).toBeDefined();
    expect(screen.getByText("31 / 100 files backed up")).toBeDefined();
    expect(screen.getByText("31%")).toBeDefined();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
  });

  it("clicking Cancel calls cancelBackup", () => {
    const cancelSpy = vi.fn();
    useBackupProgressStore.setState({
      isVisible: true,
      status: "in_progress",
      phase: "Backing up notes...",
      cancelBackup: cancelSpy,
    });

    render(<GlobalBackupNotification accessToken="mock-token" />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(cancelSpy).toHaveBeenCalledWith("mock-token");
  });

  it("renders success state with completed message and dismiss button", () => {
    useBackupProgressStore.setState({
      isVisible: true,
      status: "success",
      phase: "All notes backed up safely",
      totalNotes: 15,
      processedNotes: 15,
      percent: 100,
    });

    render(<GlobalBackupNotification />);

    expect(screen.getByText("Backup completed")).toBeDefined();
    expect(screen.getByText("All notes backed up safely")).toBeDefined();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeDefined();
  });

  it("renders failed state with error message", () => {
    useBackupProgressStore.setState({
      isVisible: true,
      status: "failed",
      phase: "Backup failed",
      errorMessage: "Google Drive quota exceeded",
      percent: 45,
    });

    render(<GlobalBackupNotification />);

    expect(screen.getByRole("heading", { name: "Backup failed" })).toBeDefined();
    expect(screen.getByText("Google Drive quota exceeded")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("close button ✕ dismisses the notification", () => {
    const dismissSpy = vi.fn();
    useBackupProgressStore.setState({
      isVisible: true,
      status: "in_progress",
      dismiss: dismissSpy,
    });

    render(<GlobalBackupNotification />);

    const closeBtn = screen.getByTitle("Close notification");
    fireEvent.click(closeBtn);

    expect(dismissSpy).toHaveBeenCalled();
  });

  it("renders compact toast without progress bar or dismiss footer when isToastOnly is true", () => {
    useBackupProgressStore.setState({
      isVisible: true,
      isToastOnly: true,
      customTitle: "Google Drive Disconnected",
      status: "success",
      phase: "Google Drive was disconnected successfully.",
      percent: 100,
    });

    const { container } = render(<GlobalBackupNotification />);

    expect(screen.getByText("Google Drive Disconnected")).toBeDefined();
    expect(screen.getByText("Google Drive was disconnected successfully.")).toBeDefined();
    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
    expect(container.querySelector('[class*="progressBarContainer"]')).toBeNull();
  });
});
