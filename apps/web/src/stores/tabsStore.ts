import { create } from "zustand";

export interface TabData {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
  isMarkdown: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TabsState {
  tabs: TabData[];
  activeTabId: string;
  createTab: (title?: string, content?: string, isMarkdown?: boolean) => string;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  setTabDirty: (id: string, isDirty: boolean) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabMarkdown: (id: string, isMarkdown: boolean) => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  cycleNextTab: () => void;
  cyclePreviousTab: () => void;
  resetTabs: () => void;
}

const initialTabId = "note-initial";
const initialTab: TabData = {
  id: initialTabId,
  title: "Untitled",
  content: "",
  isDirty: false,
  isMarkdown: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTabId,

  createTab: (title = "Untitled", content = "", isMarkdown = true) => {
    const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabData = {
      id,
      title,
      content,
      isDirty: false,
      isMarkdown,
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
      // If closing the last tab, reset it to a fresh Untitled note
      const resetId = `note-${Date.now()}`;
      set({
        tabs: [
          {
            id: resetId,
            title: "Untitled",
            content: "",
            isDirty: false,
            isMarkdown: true,
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
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              content,
              isDirty: true,
              updatedAt: Date.now(),
            }
          : tab
      ),
    }));
  },

  setTabDirty: (id: string, isDirty: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, isDirty } : tab)),
    }));
  },

  setTabTitle: (id: string, title: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, title } : tab)),
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
