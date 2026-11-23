import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { accountRouter } from "./account";
import { signAccessToken } from "../auth/jwt";
import { inMemoryNotesStore } from "./sync";

describe("T-045 Account Deletion & Purge Endpoint", () => {
  const app = new Hono();
  app.route("/account", accountRouter);

  it("returns 401 Unauthorized when request lacks Bearer token", async () => {
    const res = await app.request("/account", {
      method: "DELETE",
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("successfully purges account, clears notes store, and removes refresh cookie", async () => {
    const userId = "test-user-to-purge-45";
    const token = await signAccessToken(userId, "test45@example.com");

    // Populate mock in-memory note
    inMemoryNotesStore.set("note-45", {
      id: "note-45",
      userId,
      encryptedEnvelope: "ciphertext-payload",
      version: 1,
      clientUpdatedAt: new Date().toISOString(),
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(inMemoryNotesStore.has("note-45")).toBe(true);

    const res = await app.request("/account", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("purged permanently");

    // In-memory note for this user should be removed
    expect(inMemoryNotesStore.has("note-45")).toBe(false);

    // Refresh token cookie should be instructed to expire/clear
    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("refresh_token=");
  });
});
