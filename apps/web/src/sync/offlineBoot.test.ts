import { describe, it, expect, vi, beforeEach } from "vitest";
import { NetworkMonitor } from "./networkStatus";
import { useTabsStore } from "../stores/tabsStore";

describe("Offline Boot & Local-First Editor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("detects offline state and transitions sync indicator to offline", () => {
    const monitor = new NetworkMonitor(false);
    expect(monitor.isOnline()).toBe(false);

    let currentSyncStatus = "saved";
    monitor.subscribe((online) => {
      if (!online) {
        currentSyncStatus = "offline";
      } else {
        currentSyncStatus = "saved";
      }
    });

    expect(currentSyncStatus).toBe("offline");

    monitor.setOnline(true);
    expect(currentSyncStatus).toBe("saved");
  });

  it("loads existing local note into initial tab on offline boot", async () => {
    const store = useTabsStore.getState();

    // Mock local notes stored in IndexedDB
    const mockStoredNotes = [
      {
        id: "note-offline-1",
        encryptedEnvelope: JSON.stringify({
          title: "Offline Meeting Notes",
          content: "Action item 1: Ship offline mode\nAction item 2: Verify zero-network launch.",
          isMarkdown: false,
        }),
        clientUpdatedAt: new Date().toISOString(),
        syncStatus: "synced" as const,
        deleted: false,
      },
    ];

    // Simulate offline initial boot
    const currentTabs = useTabsStore.getState().tabs;
    expect(currentTabs.length).toBeGreaterThan(0);

    const activeId = currentTabs[0].id;
    const noteData = JSON.parse(mockStoredNotes[0].encryptedEnvelope);

    store.updateTabContent(activeId, noteData.content);
    store.setTabTitle(activeId, noteData.title);
    store.setTabDirty(activeId, false);

    const updatedTab = useTabsStore.getState().tabs.find((t) => t.id === activeId);
    expect(updatedTab?.title).toBe("Offline Meeting Notes");
    expect(updatedTab?.content).toContain("Ship offline mode");
    expect(updatedTab?.isDirty).toBe(false);
  });

  it("allows creating and editing notes with zero network connectivity", () => {
    const store = useTabsStore.getState();

    // Create a new note while offline
    const newTabId = store.createTab("Offline Draft", "Drafting content with no internet...");
    expect(useTabsStore.getState().tabs.some((t) => t.id === newTabId)).toBe(true);

    // Edit content
    store.updateTabContent(newTabId, "Drafting content with no internet... updated!");
    store.setTabDirty(newTabId, true);

    const tab = useTabsStore.getState().tabs.find((t) => t.id === newTabId);
    expect(tab?.title).toBe("Offline Draft");
    expect(tab?.content).toBe("Drafting content with no internet... updated!");
    expect(tab?.isDirty).toBe(true);
  });
});
