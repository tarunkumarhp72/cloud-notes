import { describe, it, expect, vi } from "vitest";
import { GoogleDriveClient } from "./driveClient.js";

describe("GoogleDriveClient", () => {
  it("refreshes access token via OAuth token endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access-token-12345",
        expires_in: 3600,
      }),
    });

    const client = new GoogleDriveClient(mockFetch as any);
    const result = await client.refreshAccessToken("dummy-refresh-token");

    expect(result.accessToken).toBe("new-access-token-12345");
    expect(result.expiresIn).toBe(3600);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("finds existing folder if present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: [{ id: "existing-folder-id-789", name: "Notes App Backups" }],
      }),
    });

    const client = new GoogleDriveClient(mockFetch as any);
    const folderId = await client.findOrCreateFolder("mock-token", "Notes App Backups");

    expect(folderId).toBe("existing-folder-id-789");
  });

  it("creates folder if not found", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "newly-created-folder-456" }),
      });

    const client = new GoogleDriveClient(mockFetch as any);
    const folderId = await client.findOrCreateFolder("mock-token", "Notes App Backups");

    expect(folderId).toBe("newly-created-folder-456");
  });

  it("uploads multipart backup file accurately", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "drive-file-999",
        name: "backup.enc.gz",
        size: 1024,
        createdTime: "2026-11-24T12:00:00Z",
      }),
    });

    const client = new GoogleDriveClient(mockFetch as any);
    const res = await client.uploadBackupFile(
      "mock-token",
      "folder-123",
      "backup.enc.gz",
      Buffer.from("dummy-encrypted-data")
    );

    expect(res.id).toBe("drive-file-999");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("uploadType=multipart"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
