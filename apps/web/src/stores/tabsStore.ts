import { create } from "zustand";

export interface TabData {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
  isMarkdown: boolean;
  isCustomTitle?: boolean;
  defaultTitle?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TabsState {
  tabs: TabData[];
  activeTabId: string;
  createTab: (title?: string, content?: string, isMarkdown?: boolean, isCustomTitle?: boolean) => string;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  setTabDirty: (id: string, isDirty: boolean) => void;
  setTabTitle: (id: string, title: string, isCustomTitle?: boolean) => void;
  setTabMarkdown: (id: string, isMarkdown: boolean) => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  cycleNextTab: () => void;
  cyclePreviousTab: () => void;
  resetTabs: () => void;
}

export function extractTitleFromContent(content: string, fallback: string = "Untitled"): string {
  if (!content || !content.trim()) return fallback;
  const lines = content.split("\n");
  for (const line of lines) {
    const cleaned = line
      .replace(/^[#\s*>-]+/, "")
      .replace(/[*_~`]/g, "")
      .trim();
    if (cleaned.length > 0) {
      return cleaned.length > 35 ? cleaned.slice(0, 32).trim() + "..." : cleaned;
    }
  }
  return fallback;
}

export function getNextUntitledTitle(existingTabs: TabData[]): string {
  const untitledRegex = /^Untitled(?:\s+(\d+))?$/i;
  const usedNumbers = new Set<number>();
  let hasBaseUntitled = false;

  for (const tab of existingTabs) {
    const candidates = [tab.defaultTitle, tab.title].filter(Boolean) as string[];
    for (const cand of candidates) {
      const match = cand.match(untitledRegex);
      if (match) {
        if (match[1]) {
          usedNumbers.add(parseInt(match[1], 10));
        } else {
          hasBaseUntitled = true;
          usedNumbers.add(1);
        }
      }
    }
  }

  if (!hasBaseUntitled && !usedNumbers.has(1)) {
    return "Untitled";
  }

  let candidate = 2;
  while (usedNumbers.has(candidate)) {
    candidate++;
  }
  return `Untitled ${candidate}`;
}

const initialTabId = "note-initial";
const initialTab: TabData = {
  id: initialTabId,
  title: "Untitled",
  content: "",
  isDirty: false,
  isMarkdown: true,
  isCustomTitle: false,
  defaultTitle: "Untitled",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTabId,

  createTab: (title?: string, content = "", isMarkdown = true, isCustomTitle = false) => {
    const { tabs } = get();
    const isExplicitTitle = !!title && title !== "Untitled";
    const defaultTitle = isExplicitTitle ? title : getNextUntitledTitle(tabs);
    const finalIsCustom = isCustomTitle || isExplicitTitle;
    const finalTitle = finalIsCustom ? defaultTitle : extractTitleFromContent(content, defaultTitle);

    const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabData = {
      id,
      title: finalTitle,
      content,
      isDirty: false,
      isMarkdown,
      isCustomTitle: finalIsCustom,
      defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }));

    return id;
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) {
      const resetId = `note-${Date.now()}`;
      set({
        tabs: [
          {
            id: resetId,
            title: "Untitled",
            content: "",
            isDirty: false,
            isMarkdown: true,
            isCustomTitle: false,
            defaultTitle: "Untitled",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeTabId: resetId,
      });
      return;
    }

    const targetIndex = tabs.findIndex((t) => t.id === id);
    if (targetIndex === -1) return;

    const remainingTabs = tabs.filter((t) => t.id !== id);
    let nextActiveId = activeTabId;

    if (activeTabId === id) {
      // Choose nearest adjacent tab
      const nextIndex = targetIndex > 0 ? targetIndex - 1 : 0;
      nextActiveId = remainingTabs[nextIndex]?.id || remainingTabs[0].id;
    }

    set({
      tabs: remainingTabs,
      activeTabId: nextActiveId,
    });
  },

  selectTab: (id: string) => {
    set({ activeTabId: id });
  },

  updateTabContent: (id: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.id !== id) return tab;
        const fallback = tab.defaultTitle || "Untitled";
        const isCustom = tab.isCustomTitle ?? (tab.title !== fallback && !/^Untitled(?:\s+\d+)?$/i.test(tab.title));
        const newTitle = isCustom
          ? tab.title
          : extractTitleFromContent(content, fallback);

        return {
          ...tab,
          title: newTitle,
          content,
          isDirty: true,
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  setTabDirty: (id: string, isDirty: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, isDirty } : tab)),
    }));
  },

  setTabTitle: (id: string, title: string, isCustomTitle?: boolean) => {
    const isCustom = isCustomTitle !== undefined ? isCustomTitle : !/^Untitled(?:\s+\d+)?$/i.test(title);
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, title, isCustomTitle: isCustom } : tab)),
    }));
  },

  setTabMarkdown: (id: string, isMarkdown: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, isMarkdown, updatedAt: Date.now() } : tab)),
    }));
  },

  reorderTabs: (sourceIndex: number, destinationIndex: number) => {
    set((state) => {
      const { tabs } = state;
      if (
        sourceIndex < 0 ||
        sourceIndex >= tabs.length ||
        destinationIndex < 0 ||
        destinationIndex >= tabs.length ||
        sourceIndex === destinationIndex
      ) {
        return state;
      }

      const updated = [...tabs];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(destinationIndex, 0, moved);

      return { tabs: updated };
    });
  },

  cycleNextTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    set({ activeTabId: tabs[nextIndex].id });
  },

  cyclePreviousTab: () => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    set({ activeTabId: tabs[prevIndex].id });
  },

  resetTabs: () => {
    const id = "note-initial";
    set({
      tabs: [
        {
          id,
          title: "Untitled",
          content: "",
          isDirty: false,
          isMarkdown: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeTabId: id,
    });
  },
}));
