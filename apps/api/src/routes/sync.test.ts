import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../index";
import { signAccessToken } from "../auth/jwt";
import { inMemoryNotesStore } from "./sync";

describe("Sync Endpoints (/sync)", () => {
  const user1 = "01934c2b-88a2-73a1-b84a-923f03b2241b";
  const user2 = "01934c2b-88a2-73a1-b84a-923f03b2241c";
  let token1: string;
  let token2: string;

  beforeEach(async () => {
    inMemoryNotesStore.clear();
    token1 = await signAccessToken(user1, "tarun@example.com");
    token2 = await signAccessToken(user2, "other@example.com");
  });

  describe("POST /sync/push", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await app.request("/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mutations: [],
        }),
      });

      expect(res.status).toBe(401);
    });

    it("rejects invalid mutation bodies with 400", async () => {
      const res = await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              // missing noteId, encryptedEnvelope, etc.
              id: "mutation-1",
            },
          ],
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation error");
    });

    it("accepts valid encrypted mutations and persists them", async () => {
      const payloadEnvelope = JSON.stringify({
        ciphertext: "base64-mock-ciphertext",
        iv: "base64-mock-iv",
        authTag: "base64-mock-tag",
      });

      const res = await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-1",
              noteId: "note-uuid-1",
              action: "upsert",
              encryptedEnvelope: payloadEnvelope,
              version: 1,
              clientUpdatedAt: "2026-11-23T10:00:00.000Z",
            },
          ],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.synced).toHaveLength(1);
      expect(data.synced[0].mutationId).toBe("mut-1");
      expect(data.synced[0].noteId).toBe("note-uuid-1");
      expect(data.synced[0].version).toBe(1);
      expect(data.cursor).toBeDefined();
    });

    it("increments version on subsequent update for the same note", async () => {
      const payloadEnvelope = JSON.stringify({ ciphertext: "rev-1" });
      const payloadEnvelope2 = JSON.stringify({ ciphertext: "rev-2" });

      await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-1",
              noteId: "note-uuid-1",
              action: "upsert",
              encryptedEnvelope: payloadEnvelope,
              version: 1,
              clientUpdatedAt: "2026-11-23T10:00:00.000Z",
            },
          ],
        }),
      });

      const res2 = await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-2",
              noteId: "note-uuid-1",
              action: "upsert",
              encryptedEnvelope: payloadEnvelope2,
              version: 1,
              clientUpdatedAt: "2026-11-23T10:05:00.000Z",
            },
          ],
        }),
      });

      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.synced[0].version).toBe(2);
    });

    it("enforces maximum limit of 50 active notes per account and rejects 51st note", async () => {
      // Pre-fill 50 notes for user1 in memory store
      for (let i = 1; i <= 50; i++) {
        inMemoryNotesStore.set(`${user1}:note-${i}`, {
          id: `note-${i}`,
          userId: user1,
          encryptedEnvelope: JSON.stringify({ ciphertext: `note-${i}` }),
          version: 1,
          clientUpdatedAt: new Date().toISOString(),
          deleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Updating an existing note among the 50 should succeed
      const updateRes = await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-update",
              noteId: "note-1",
              action: "upsert",
              encryptedEnvelope: JSON.stringify({ ciphertext: "updated note 1" }),
              version: 1,
              clientUpdatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
      expect(updateRes.status).toBe(200);

      // Attempting to create the 51st note should be rejected with 403
      const overflowRes = await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-51",
              noteId: "note-51",
              action: "upsert",
              encryptedEnvelope: JSON.stringify({ ciphertext: "note 51 content" }),
              version: 1,
              clientUpdatedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      expect(overflowRes.status).toBe(403);
      const overflowData = await overflowRes.json();
      expect(overflowData.error).toContain("Active note limit reached");
    });
  });

  describe("GET /sync/pull", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await app.request("/sync/pull");
      expect(res.status).toBe(401);
    });

    it("returns notes belonging to authenticated user", async () => {
      // User 1 pushes note
      await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-u1",
              noteId: "note-user1",
              action: "upsert",
              encryptedEnvelope: "envelope-user1",
              version: 1,
              clientUpdatedAt: "2026-11-23T10:00:00.000Z",
            },
          ],
        }),
      });

      // User 2 pushes note
      await app.request("/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({
          mutations: [
            {
              id: "mut-u2",
              noteId: "note-user2",
              action: "upsert",
              encryptedEnvelope: "envelope-user2",
              version: 1,
              clientUpdatedAt: "2026-11-23T10:00:00.000Z",
            },
          ],
        }),
      });

      // User 1 pulls
      const pullRes1 = await app.request("/sync/pull", {
        headers: { Authorization: `Bearer ${token1}` },
      });
      expect(pullRes1.status).toBe(200);
      const data1 = await pullRes1.json();

      expect(data1.notes).toHaveLength(1);
      expect(data1.notes[0].id).toBe("note-user1");
      expect(data1.notes[0].encryptedEnvelope).toBe("envelope-user1");

      // User 2 pulls
      const pullRes2 = await app.request("/sync/pull", {
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(pullRes2.status).toBe(200);
      const data2 = await pullRes2.json();

      expect(data2.notes).toHaveLength(1);
      expect(data2.notes[0].id).toBe("note-user2");
    });

    it("supports /api/sync/pull rewrite path", async () => {
      const res = await app.request("/api/sync/pull", {
        headers: { Authorization: `Bearer ${token1}` },
      });
      expect(res.status).toBe(200);
    });
  });
});
