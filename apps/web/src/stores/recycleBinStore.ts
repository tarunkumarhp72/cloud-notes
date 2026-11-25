import { create } from "zustand";

export const RECYCLE_BIN_RETENTION_DAYS = 15;
const RETENTION_MS = RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "notepad_recycle_bin";

export interface RecycleBinItem {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  isCustomTitle: boolean;
  deletedAt: string;
}

export interface RecycleBinState {
  items: RecycleBinItem[];
  moveToRecycleBin: (
    item: Omit<RecycleBinItem, "deletedAt"> & { deletedAt?: string }
  ) => void;
  restoreFromRecycleBin: (id: string) => RecycleBinItem | undefined;
  deletePermanently: (id: string) => void;
  emptyRecycleBin: () => void;
  purgeExpired: () => void;
}

export function isExpiredRecycleItem(deletedAt: string, nowMs = Date.now()): boolean {
  const ts = new Date(deletedAt).getTime();
  if (isNaN(ts)) return false;
  return nowMs - ts >= RETENTION_MS;
}

export function getDaysRemaining(deletedAt: string, nowMs = Date.now()): number {
  const ts = new Date(deletedAt).getTime();
  if (isNaN(ts)) return RECYCLE_BIN_RETENTION_DAYS;
  const remainingMs = RETENTION_MS - (nowMs - ts);
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

function loadInitialRecycleBin(): RecycleBinItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const nowMs = Date.now();
    const valid = parsed.filter((item) => !isExpiredRecycleItem(item.deletedAt, nowMs));
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

function persistRecycleBin(items: RecycleBinItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

export const useRecycleBinStore = create<RecycleBinState>((set, get) => ({
  items: loadInitialRecycleBin(),

  moveToRecycleBin: (entry) => {
    const nowMs = Date.now();
    const item: RecycleBinItem = {
      ...entry,
      deletedAt: entry.deletedAt || new Date(nowMs).toISOString(),
    };
    set((state) => {
      const active = state.items.filter(
        (i) => i.id !== item.id && !isExpiredRecycleItem(i.deletedAt, nowMs)
      );
      const next = [item, ...active];
      persistRecycleBin(next);
      return { items: next };
    });
  },

  restoreFromRecycleBin: (id) => {
    const found = get().items.find((i) => i.id === id);
    if (!found) return undefined;
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      persistRecycleBin(next);
      return { items: next };
    });
    return found;
  },

  deletePermanently: (id) => {
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      persistRecycleBin(next);
      return { items: next };
    });
  },

  emptyRecycleBin: () => {
    persistRecycleBin([]);
    set({ items: [] });
  },

  purgeExpired: () => {
    const nowMs = Date.now();
    set((state) => {
      const valid = state.items.filter((i) => !isExpiredRecycleItem(i.deletedAt, nowMs));
      if (valid.length !== state.items.length) {
        persistRecycleBin(valid);
        return { items: valid };
      }
      return state;
    });
  },
}));
