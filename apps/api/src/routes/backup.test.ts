import { describe, it, expect } from "vitest";
import { app } from "../index";
import { signAccessToken } from "../auth/jwt";

describe("Backup API Endpoints (/backup & /api/backup)", () => {
  it("rejects unauthenticated requests to /api/backup/status", async () => {
    const res = await app.request("/api/backup/status");
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("returns status for authenticated user", async () => {
    const token = await signAccessToken("user-test-uuid", "test@example.com");
    const res = await app.request("/api/backup/status", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("connected");
    expect(json).toHaveProperty("autoBackupEnabled");
    expect(json).toHaveProperty("frequency");
  });

  it("generates valid Google Drive OAuth URL with least-privilege drive.file scope", async () => {
    const token = await signAccessToken("user-test-uuid", "test@example.com");
    const res = await app.request("/api/backup/auth/url", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(json.url).toContain("drive.file");
    expect(json.url).toContain("access_type=offline");
    expect(json.url).toContain("prompt=consent");
    expect(json).toHaveProperty("state");
  });

  it("rejects invalid settings payloads", async () => {
    const token = await signAccessToken("user-test-uuid", "test@example.com");
    const res = await app.request("/api/backup/settings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frequency: "invalid_frequency" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns backup history array for user", async () => {
    const token = await signAccessToken("user-test-uuid", "test@example.com");
    const res = await app.request("/api/backup/history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.history)).toBe(true);
  });

  it("returns idle progress snapshot from /api/backup/progress when no backup active", async () => {
    const token = await signAccessToken("user-test-progress", "progress@example.com");
    const res = await app.request("/api/backup/progress", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.active).toBe(false);
    expect(json.progress.status).toBe("idle");
    expect(json.progress.percent).toBe(0);
  });

  it("returns 404 from /api/backup/cancel when no active task exists", async () => {
    const token = await signAccessToken("user-test-cancel", "cancel@example.com");
    const res = await app.request("/api/backup/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("updates backup settings and dynamically schedules backup", async () => {
    const token = await signAccessToken("user-test-settings", "settings@example.com");
    const res = await app.request("/api/backup/settings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        autoBackupEnabled: true,
        frequency: "weekly",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.settings.autoBackupEnabled).toBe(true);
    expect(json.settings.frequency).toBe("weekly");
    expect(json.settings.nextBackupAt).toBeDefined();
  });

  it("disconnects Google Drive and safely cleans up tasks", async () => {
    const token = await signAccessToken("user-test-disconnect", "disconnect@example.com");
    const res = await app.request("/api/backup/disconnect", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
