import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleDriveBackup } from "./GoogleDriveBackup";

describe("GoogleDriveBackup Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders disconnected state when status is disconnected", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connected: false,
            googleEmail: null,
            autoBackupEnabled: false,
            frequency: "daily",
            lastBackupAt: null,
            nextBackupAt: null,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ history: [] }) });
    });

    render(<GoogleDriveBackup accessToken="mock-access-token" />);

    expect(screen.getByText("Google Drive Backup")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("Not Connected")).toBeDefined();
      expect(screen.getByText("Connect Google Drive")).toBeDefined();
    });
  });

  it("renders connected state with account info and auto-backup toggle", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connected: true,
            googleEmail: "testuser@gmail.com",
            autoBackupEnabled: true,
            frequency: "daily",
            lastBackupAt: "2026-11-24T10:00:00Z",
            nextBackupAt: "2026-11-25T10:00:00Z",
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          history: [
            {
              id: "hist-1",
              drive_file_id: "drive-123",
              folder_path: "Notes App Backups/Daily",
              backup_type: "daily",
              status: "success",
              notes_count: 5,
              file_size_bytes: 4096,
              created_at: "2026-11-24T10:00:00Z",
            },
          ],
        }),
      });
    });

    render(<GoogleDriveBackup accessToken="mock-access-token" />);

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeDefined();
      expect(screen.getByText("testuser@gmail.com")).toBeDefined();
      expect(screen.getByText("Backup Now")).toBeDefined();
      expect(screen.getByText("Restore")).toBeDefined();
    });
  });
});
