import {
  getOutboxItems,
  removeOutboxItems,
  incrementOutboxAttempts,
  enqueueOutboxItem,
  getOutboxCount,
  saveNote,
  deleteNote,
} from "@notepad/core";

export type SyncStatus = "idle" | "saving" | "saved" | "offline" | "sync_failed";

export interface SyncEngineConfig {
  pushUrl?: string;
  pullUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  autoPushDelayMs?: number; // 2000 ms (2 seconds after auto-save)
  fetchFn?: typeof fetch;
}

/**
 * Calculates exponential backoff with bounded random jitter (up to 30%).
 */
export function calculateBackoffWithJitter(
  attempt: number,
  baseMs = 1000,
  maxMs = 30000
): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt)));
  const jitter = Math.random() * 0.3 * exp; // up to 30% jitter
  return Math.floor(exp + jitter);
}

export class SyncEngine {
  private status: SyncStatus = "idle";
  private statusListeners = new Set<(status: SyncStatus) => void>();
  private autoPushTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isPushing = false;
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor(private config: SyncEngineConfig = {}) {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.setStatus("idle");
        this.schedulePush(500); // Push quickly when connection restores
      });

      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.setStatus("offline");
      });
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public setStatus(status: SyncStatus): void {
    if (this.status !== status) {
      this.status = status;
      for (const listener of this.statusListeners) {
        listener(status);
      }
    }
  }

  /**
   * Called when a local auto-save completes.
   * Enqueues the note mutation into the outbox and schedules push after 2 seconds.
   */
  public async onLocalNoteSaved(
    noteId: string,
    encryptedEnvelope: string,
    action: "upsert" | "delete" = "upsert"
  ): Promise<void> {
    await enqueueOutboxItem(noteId, action, encryptedEnvelope);
    this.schedulePush(this.config.autoPushDelayMs ?? 2000);
  }

  public async enqueueMutation(
    noteId: string,
    action: "upsert" | "delete" = "upsert",
    encryptedEnvelope: string = "",
    _version = 1
  ): Promise<void> {
    await this.onLocalNoteSaved(noteId, encryptedEnvelope, action);
  }

  /**
   * Pulls remote notes from Supabase sync API and persists them locally into IndexedDB.
   */
  public async pull(): Promise<boolean> {
    if (!this.isOnline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      return false;
    }

    const token = this.config.getAccessToken ? await this.config.getAccessToken() : null;
    if (!token) {
      return false;
    }

    const pullUrl = this.config.pullUrl || "/api/sync/pull";
    const fetchImpl = this.config.fetchFn || fetch;

    try {
      const response = await fetchImpl(pullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data && Array.isArray(data.notes)) {
        for (const n of data.notes) {
          if (n.deleted) {
            await deleteNote(n.id, false);
          } else {
            await saveNote({
              id: n.id,
              encryptedEnvelope: n.encryptedEnvelope,
              version: n.version || 1,
              clientUpdatedAt: n.clientUpdatedAt || new Date().toISOString(),
              deleted: false,
              syncStatus: "synced",
            });
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Sync pull error:", err);
      return false;
    }
  }

  public schedulePush(delayMs: number = 2000): void {
    if (this.autoPushTimer !== null) {
      clearTimeout(this.autoPushTimer);
    }

    this.autoPushTimer = setTimeout(() => {
      this.autoPushTimer = null;
      this.push();
    }, delayMs);
  }

  /**
   * Executes the push operation to the backend sync API.
   */
  public async push(): Promise<boolean> {
    if (this.isPushing) return false;

    if (!this.isOnline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      this.setStatus("offline");
      return false;
    }

    const items = await getOutboxItems(50);
    if (items.length === 0) {
      this.setStatus("saved");
      return true;
    }

    const token = this.config.getAccessToken ? await this.config.getAccessToken() : null;
    if (!token) {
      this.setStatus("saved");
      return false;
    }

    this.isPushing = true;
    this.setStatus("saving");

    const pushUrl = this.config.pushUrl || "/api/sync/push";
    const fetchImpl = this.config.fetchFn || fetch;

    try {
      const response = await fetchImpl(pushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mutations: items.map((item) => ({
            id: item.id,
            noteId: item.noteId,
            action: item.action,
            encryptedEnvelope: item.payload,
            version: 1,
            clientUpdatedAt: item.createdAt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync push HTTP ${response.status}`);
      }

      const syncedIds = items.map((i) => i.id);
      await removeOutboxItems(syncedIds);

      this.setStatus("saved");
      this.isPushing = false;

      // Check if more items arrived while pushing
      const remainingCount = await getOutboxCount();
      if (remainingCount > 0) {
        this.schedulePush(500);
      }

      return true;
    } catch {
      this.isPushing = false;
      this.setStatus("sync_failed");

      // Increment attempt count on all failed items
      let maxAttempts = 0;
      for (const item of items) {
        await incrementOutboxAttempts(item.id);
        maxAttempts = Math.max(maxAttempts, item.attempts + 1);
      }

      // Schedule retry with exponential backoff & jitter
      const retryDelay = calculateBackoffWithJitter(
        maxAttempts,
        this.config.baseBackoffMs,
        this.config.maxBackoffMs
      );

      if (this.retryTimer !== null) {
        clearTimeout(this.retryTimer);
      }
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.push();
      }, retryDelay);

      return false;
    }
  }

  public destroy(): void {
    if (this.autoPushTimer !== null) {
      clearTimeout(this.autoPushTimer);
      this.autoPushTimer = null;
    }
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.statusListeners.clear();
  }
}
