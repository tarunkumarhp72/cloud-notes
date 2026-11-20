import { useEffect, useRef } from "react";
import { saveNote } from "@notepad/core";

export interface AutoSavePayload {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
}

export type AutoSaveStorageWriter = (payload: AutoSavePayload) => Promise<void> | void;

export interface AutoSaveOptions {
  debounceMs?: number;
  maxWaitMs?: number;
}

export class AutoSaveCoordinator {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingNote: AutoSavePayload | null = null;
  private firstDirtyTimestamp: number | null = null;
  private isSaving = false;

  constructor(
    private saveWriter: AutoSaveStorageWriter,
    private options: AutoSaveOptions = {}
  ) {}

  get debounceMs(): number {
    return this.options.debounceMs ?? 1000;
  }

  get maxWaitMs(): number {
    return this.options.maxWaitMs ?? 10000;
  }

  public notifyChange(payload: AutoSavePayload): void {
    this.pendingNote = payload;
    const now = Date.now();

    if (this.firstDirtyTimestamp === null) {
      this.firstDirtyTimestamp = now;

      // Start 10-second max-wait timer for uninterrupted continuous typing
      this.maxWaitTimer = setTimeout(() => {
        this.flush();
      }, this.maxWaitMs);
    }

    // Reset 1-second debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  public async flush(): Promise<void> {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer !== null) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }

    this.firstDirtyTimestamp = null;

    if (!this.pendingNote || this.isSaving) return;

    const noteToSave = this.pendingNote;
    this.pendingNote = null;
    this.isSaving = true;

    try {
      await this.saveWriter(noteToSave);
    } finally {
      this.isSaving = false;
      // If another change occurred while saving, schedule flush
      if (this.pendingNote) {
        this.notifyChange(this.pendingNote);
      }
    }
  }

  public hasPending(): boolean {
    return this.pendingNote !== null;
  }

  public destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer !== null) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
    this.pendingNote = null;
    this.firstDirtyTimestamp = null;
  }
}

export const defaultIndexedDbWriter: AutoSaveStorageWriter = async (payload) => {
  await saveNote({
    id: payload.id,
    encryptedEnvelope: JSON.stringify({
      title: payload.title,
      content: payload.content,
      isMarkdown: payload.isMarkdown,
    }),
    version: 1,
    clientUpdatedAt: new Date().toISOString(),
    deleted: false,
    syncStatus: "pending",
  });
};

export function useLocalAutoSave(
  activeTab:
    | { id: string; title: string; content: string; isMarkdown: boolean; isDirty: boolean }
    | undefined,
  onSaved?: (id: string) => void,
  saveWriter: AutoSaveStorageWriter = defaultIndexedDbWriter
) {
  const coordinatorRef = useRef<AutoSaveCoordinator | null>(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new AutoSaveCoordinator(async (payload) => {
      await saveWriter(payload);
      onSaved?.(payload.id);
    });
  }

  // Update writer if changed
  useEffect(() => {
    coordinatorRef.current = new AutoSaveCoordinator(async (payload) => {
      await saveWriter(payload);
      onSaved?.(payload.id);
    });
  }, [saveWriter, onSaved]);

  // Track tab modifications
  useEffect(() => {
    if (!activeTab || !activeTab.isDirty) return;
    coordinatorRef.current?.notifyChange({
      id: activeTab.id,
      title: activeTab.title,
      content: activeTab.content,
      isMarkdown: activeTab.isMarkdown,
    });
  }, [activeTab?.id, activeTab?.content, activeTab?.title, activeTab?.isMarkdown, activeTab?.isDirty]);

  // Flush on visibilitychange, pagehide, and beforeunload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        coordinatorRef.current?.flush();
      }
    };

    const handlePageHide = () => {
      coordinatorRef.current?.flush();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      coordinatorRef.current?.flush();
      coordinatorRef.current?.destroy();
    };
  }, []);
}
