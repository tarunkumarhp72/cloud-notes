import { create } from "zustand";

export interface RecentHistoryItem {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  status: "closed" | "saved";
  timestamp: string;
}

export interface RecentHistoryState {
  items: RecentHistoryItem[];
  recordHistoryItem: (entry: Omit<RecentHistoryItem, "timestamp"> & { timestamp?: string }) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = "notepad_recent_history";
const MAX_HISTORY_ITEMS = 50;

function loadInitialHistory(): RecentHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(items: RecentHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export const useRecentHistoryStore = create<RecentHistoryState>((set) => ({
  items: loadInitialHistory(),

  recordHistoryItem: (entry) => {
    const item: RecentHistoryItem = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    set((state) => {
      const filtered = state.items.filter((i) => i.id !== item.id);
      const next = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      persistHistory(next);
      return { items: next };
    });
  },

  removeHistoryItem: (id) => {
    set((state) => {
      const next = state.items.filter((i) => i.id !== id);
      persistHistory(next);
      return { items: next };
    });
  },

  clearHistory: () => {
    persistHistory([]);
    set({ items: [] });
  },
}));
