import { getDb, type NotepadDBSchema } from "../storage/db";

export type OutboxItem = NotepadDBSchema["outbox"]["value"];

export interface EnqueueOptions {
  id?: string;
  attempts?: number;
  createdAt?: string;
}

/**
 * Appends or coalesces a note mutation into the local sync outbox queue in IndexedDB.
 * Coalescing ensures that multiple rapid edits to the same note update the single
 * pending outbox entry instead of flooding the backend with redundant intermediate edits.
 */
export async function enqueueOutboxItem(
  noteId: string,
  action: "upsert" | "delete",
  payload: string,
  options?: EnqueueOptions
): Promise<OutboxItem> {
  const db = await getDb();
  const tx = db.transaction("outbox", "readwrite");
  const store = tx.objectStore("outbox");

  // Check if an entry for this noteId already exists
  const allItems = await store.getAll();
  const existing = allItems.find((item) => item.noteId === noteId);

  const item: OutboxItem = {
    id: existing ? existing.id : options?.id || crypto.randomUUID(),
    noteId,
    action,
    payload,
    attempts: existing ? existing.attempts : options?.attempts || 0,
    createdAt: existing ? existing.createdAt : options?.createdAt || new Date().toISOString(),
  };

  await store.put(item);
  await tx.done;
  return item;
}

/**
 * Returns all pending outbox items ordered by creation time (FIFO).
 */
export async function getOutboxItems(limit?: number): Promise<OutboxItem[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("outbox", "by-created");
  if (limit && limit > 0) {
    return items.slice(0, limit);
  }
  return items;
}

/**
 * Returns the total count of pending mutations in the outbox.
 */
export async function getOutboxCount(): Promise<number> {
  const db = await getDb();
  return db.count("outbox");
}

/**
 * Atomically removes a batch of successfully synced mutation IDs from the outbox in a single transaction.
 */
export async function removeOutboxItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction("outbox", "readwrite");
  const store = tx.objectStore("outbox");

  for (const id of ids) {
    await store.delete(id);
  }

  await tx.done;
}

/**
 * Removes a single outbox item by its mutation ID.
 */
export async function removeOutboxItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("outbox", id);
}

/**
 * Increments the retry attempts count for a specific outbox item.
 */
export async function incrementOutboxAttempts(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("outbox", "readwrite");
  const store = tx.objectStore("outbox");

  const item = await store.get(id);
  if (item) {
    item.attempts += 1;
    await store.put(item);
  }

  await tx.done;
}

/**
 * Clears all pending mutations from the outbox.
 */
export async function clearOutbox(): Promise<void> {
  const db = await getDb();
  await db.clear("outbox");
}
