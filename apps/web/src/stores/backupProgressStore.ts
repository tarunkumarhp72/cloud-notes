import { create } from "zustand";
import { webConfig } from "../config";

export interface BackupProgressState {
  isVisible: boolean;
  isToastOnly: boolean;
  status: "idle" | "in_progress" | "success" | "failed" | "cancelled";
  customTitle: string | null;
  phase: string;
  totalNotes: number;
  processedNotes: number;
  percent: number;
  errorMessage: string | null;
  fileName: string | null;
  backupId: string | null;
  activeAbortController: AbortController | null;
  dismissTimer: any;

  // Actions
  startBackup: (accessToken: string, onCompleted?: () => void) => Promise<void>;
  cancelBackup: (accessToken: string) => Promise<void>;
  dismiss: () => void;
  setProgress: (data: Partial<BackupProgressState>) => void;
  notifyMessage: (data: {
    title?: string;
    phase: string;
    status?: "success" | "failed" | "cancelled";
    errorMessage?: string;
    autoDismissMs?: number;
  }) => void;
}

export const useBackupProgressStore = create<BackupProgressState>((set, get) => ({
  isVisible: false,
  isToastOnly: false,
  status: "idle",
  customTitle: null,
  phase: "",
  totalNotes: 0,
  processedNotes: 0,
  percent: 0,
  errorMessage: null,
  fileName: null,
  backupId: null,
  activeAbortController: null,
  dismissTimer: null,

  setProgress: (data) => set((prev) => ({ ...prev, ...data })),

  notifyMessage: ({ title, phase, status = "success", errorMessage, autoDismissMs = 4000 }) => {
    const { dismissTimer } = get();
    if (dismissTimer) clearTimeout(dismissTimer);

    set({
      isVisible: true,
      isToastOnly: true,
      customTitle: title || null,
      status,
      phase,
      percent: status === "success" ? 100 : 0,
      errorMessage: errorMessage || null,
      totalNotes: 0,
      processedNotes: 0,
      fileName: null,
      backupId: null,
    });

    if (autoDismissMs > 0) {
      const t = setTimeout(() => {
        set({ isVisible: false, dismissTimer: null });
      }, autoDismissMs);
      set({ dismissTimer: t });
    }
  },

  dismiss: () => {
    const { dismissTimer } = get();
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ isVisible: false, dismissTimer: null });
  },

  startBackup: async (accessToken: string, onCompleted?: () => void) => {
    const { dismissTimer } = get();
    if (dismissTimer) clearTimeout(dismissTimer);

    const abortController = new AbortController();

    set({
      isVisible: true,
      isToastOnly: false,
      customTitle: null,
      status: "in_progress",
      phase: "Preparing backup...",
      totalNotes: 0,
      processedNotes: 0,
      percent: 10,
      errorMessage: null,
      fileName: null,
      backupId: null,
      activeAbortController: abortController,
      dismissTimer: null,
    });

    let sseActive = true;
    let progressTimer: ReturnType<typeof setTimeout> | null = null;

    // Smooth progress simulation while request is in flight
    const simulationSteps = [
      { delay: 350, percent: 30, phase: "Connecting to Google Drive..." },
      { delay: 750, percent: 55, phase: "Packaging and encrypting notes with AES-256-GCM..." },
      { delay: 1200, percent: 80, phase: "Uploading encrypted vault to Google Drive..." },
      { delay: 1800, percent: 92, phase: "Finalizing backup..." },
    ];

    let currentStep = 0;
    const triggerSimulation = () => {
      if (currentStep < simulationSteps.length && get().status === "in_progress") {
        const nextStep = simulationSteps[currentStep++];
        progressTimer = setTimeout(() => {
          if (get().status === "in_progress") {
            set({
              percent: Math.max(get().percent, nextStep.percent),
              phase: nextStep.phase,
            });
            triggerSimulation();
          }
        }, nextStep.delay);
      }
    };
    triggerSimulation();

    const cleanupSimulation = () => {
      if (progressTimer) clearTimeout(progressTimer);
    };

    // 1. Establish SSE streaming listener using fetch + ReadableStream with Bearer token
    const startSseStream = async () => {
      try {
        const sseRes = await fetch(`${webConfig.apiBaseUrl}/api/backup/progress`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/event-stream",
          },
          signal: abortController.signal,
        });

        if (sseRes.ok && sseRes.body) {
          const reader = sseRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (sseActive) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data:")) {
                try {
                  const eventData = JSON.parse(trimmed.slice(5).trim());
                  if (eventData.status && eventData.status !== "idle") {
                    cleanupSimulation();
                    set({
                      status: eventData.status,
                      phase: eventData.phase || get().phase,
                      totalNotes: eventData.totalNotes ?? get().totalNotes,
                      processedNotes: eventData.processedNotes ?? get().processedNotes,
                      percent: eventData.percent ?? get().percent,
                      errorMessage: eventData.errorMessage || null,
                      fileName: eventData.fileName || null,
                      backupId: eventData.backupId || null,
                    });

                    if (eventData.status === "success") {
                      sseActive = false;
                      onCompleted?.();
                      const t = setTimeout(() => {
                        set({ isVisible: false, dismissTimer: null });
                      }, 4000);
                      set({ dismissTimer: t });
                    } else if (eventData.status === "failed" || eventData.status === "cancelled") {
                      sseActive = false;
                    }
                  }
                } catch {
                  // Ignore JSON parse error on partial chunks
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[BACKUP SSE] Stream ended or connection closed:", err);
        }
      }
    };

    // Start SSE stream in background
    startSseStream();

    // 2. Initiate backup via POST /api/backup/now?wait=true
    try {
      const res = await fetch(`${webConfig.apiBaseUrl}/api/backup/now?wait=true`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
      });

      cleanupSimulation();
      sseActive = false;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        set({
          status: "failed",
          phase: "Backup failed",
          errorMessage: data.error || "Failed to complete backup",
          activeAbortController: null,
        });
      } else {
        const backup = data.backup || {};
        const count = backup.notesCount ?? backup.notes_count ?? get().totalNotes;
        set({
          status: "success",
          phase: "Backup completed successfully",
          percent: 100,
          totalNotes: count,
          processedNotes: count,
          fileName: backup.fileName ?? backup.file_name ?? null,
          backupId: backup.fileId ?? backup.drive_file_id ?? null,
          activeAbortController: null,
        });

        onCompleted?.();
        const t = setTimeout(() => {
          set({ isVisible: false, dismissTimer: null });
        }, 4000);
        set({ dismissTimer: t });
      }
    } catch (err: any) {
      cleanupSimulation();
      sseActive = false;
      if (err.name !== "AbortError") {
        set({
          status: "failed",
          phase: "Backup failed",
          errorMessage: err.message || "Network request failed",
          activeAbortController: null,
        });
      }
    }
  },

  cancelBackup: async (accessToken: string) => {
    const { activeAbortController, dismissTimer } = get();
    if (dismissTimer) clearTimeout(dismissTimer);

    if (activeAbortController) {
      activeAbortController.abort();
    }

    set({
      status: "cancelled",
      phase: "Backup cancelled by user",
      activeAbortController: null,
    });

    try {
      await fetch(`${webConfig.apiBaseUrl}/api/backup/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error("[BACKUP] Cancel call failed:", err);
    }

    const t = setTimeout(() => {
      set({ isVisible: false, dismissTimer: null });
    }, 4000);
    set({ dismissTimer: t });
  },
}));

if (typeof window !== "undefined") {
  (window as any).__backupProgressStore = useBackupProgressStore;
}
