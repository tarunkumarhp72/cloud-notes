import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { closeDb } from "../storage/db";
import {
  enqueueOutboxItem,
  getOutboxItems,
  getOutboxCount,
  removeOutboxItems,
  removeOutboxItem,
  incrementOutboxAttempts,
  clearOutbox,
} from "./outbox";

describe("Client Sync Outbox Queue (T-032)", () => {
  beforeEach(async () => {
    await closeDb();
    indexedDB.deleteDatabase("notepad_cloud_db");
  });

  afterEach(async () => {
    await closeDb();
    indexedDB.deleteDatabase("notepad_cloud_db");
  });

  it("appends mutations to the local sync outbox queue in FIFO order", async () => {
    const item1 = await enqueueOutboxItem(
      "note-1",
      "upsert",
      JSON.stringify({ ciphertext: "payload-1" }),
      { createdAt: "2026-11-23T10:00:00.000Z" }
    );

    const item2 = await enqueueOutboxItem(
      "note-2",
      "upsert",
      JSON.stringify({ ciphertext: "payload-2" }),
      { createdAt: "2026-11-23T10:01:00.000Z" }
    );

    const count = await getOutboxCount();
    expect(count).toBe(2);

    const items = await getOutboxItems();
    expect(items).toHaveLength(2);
    expect(items[0].noteId).toBe("note-1");
    expect(items[0].id).toBe(item1.id);
    expect(items[1].noteId).toBe("note-2");
    expect(items[1].id).toBe(item2.id);

    // Limit check
    const limited = await getOutboxItems(1);
    expect(limited).toHaveLength(1);
    expect(limited[0].noteId).toBe("note-1");
  });

  it("coalesces rapid edits for the same note into a single outbox entry", async () => {
    const first = await enqueueOutboxItem(
      "note-1",
      "upsert",
      JSON.stringify({ ciphertext: "version-1" })
    );

    const second = await enqueueOutboxItem(
      "note-1",
      "upsert",
      JSON.stringify({ ciphertext: "version-2" })
    );

    expect(second.id).toBe(first.id); // Same mutation entry coalesced
    expect(second.payload).toContain("version-2");

    const count = await getOutboxCount();
    expect(count).toBe(1);

    const items = await getOutboxItems();
    expect(items).toHaveLength(1);
    expect(items[0].payload).toContain("version-2");
  });

  it("persists outbox items across database connections", async () => {
    await enqueueOutboxItem("note-persist-1", "upsert", "payload-persist");
    expect(await getOutboxCount()).toBe(1);

    // Simulate page reload / DB reconnect
    await closeDb();

    const reloadedItems = await getOutboxItems();
    expect(reloadedItems).toHaveLength(1);
    expect(reloadedItems[0].noteId).toBe("note-persist-1");
    expect(reloadedItems[0].payload).toBe("payload-persist");
  });

  it("atomically removes a batch of successfully synced items", async () => {
    const item1 = await enqueueOutboxItem("note-1", "upsert", "p1");
    const item2 = await enqueueOutboxItem("note-2", "upsert", "p2");
    const item3 = await enqueueOutboxItem("note-3", "delete", "");

    expect(await getOutboxCount()).toBe(3);

    // Atomically remove item1 and item2
    await removeOutboxItems([item1.id, item2.id]);

    expect(await getOutboxCount()).toBe(1);
    const remaining = await getOutboxItems();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(item3.id);
    expect(remaining[0].action).toBe("delete");

    // Remove single item
    await removeOutboxItem(item3.id);
    expect(await getOutboxCount()).toBe(0);
  });

  it("increments attempt counter when retrying sync push", async () => {
    const item = await enqueueOutboxItem("note-retry", "upsert", "payload");
    expect(item.attempts).toBe(0);

    await incrementOutboxAttempts(item.id);
    await incrementOutboxAttempts(item.id);

    const items = await getOutboxItems();
    expect(items[0].attempts).toBe(2);
  });

  it("clears all outbox items on clearOutbox", async () => {
    await enqueueOutboxItem("n1", "upsert", "p1");
    await enqueueOutboxItem("n2", "upsert", "p2");
    expect(await getOutboxCount()).toBe(2);

    await clearOutbox();
    expect(await getOutboxCount()).toBe(0);
  });
});
