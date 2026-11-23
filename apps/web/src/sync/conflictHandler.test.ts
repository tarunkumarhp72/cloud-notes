import { describe, it, expect, vi } from "vitest";
import { handleSyncConflict, type TabsStoreActionInterface } from "./conflictHandler";
import type { NoteVersionInfo } from "@notepad/core";

describe("conflictHandler (T-035)", () => {
  it("applies clean remote update when local is not dirty", () => {
    const localTab = {
      id: "tab-1",
      title: "My Note",
      content: "Old local content",
      isMarkdown: false,
      isDirty: false,
    };

    const remoteNote: NoteVersionInfo = {
      id: "tab-1",
      title: "My Note",
      content: "New remote content",
      isMarkdown: false,
      version: 2,
      updatedAt: "2026-11-23T12:05:00.000Z",
    };

    const mockStore: TabsStoreActionInterface = {
      tabs: [localTab],
      createTab: vi.fn(),
      updateTabContent: vi.fn(),
      setTabDirty: vi.fn(),
    };

    const result = handleSyncConflict(localTab, remoteNote, mockStore);

    expect(result.hasConflict).toBe(false);
    expect(mockStore.updateTabContent).toHaveBeenCalledWith("tab-1", "New remote content");
    expect(mockStore.setTabDirty).toHaveBeenCalledWith("tab-1", false);
    expect(mockStore.createTab).not.toHaveBeenCalled();
  });

  it("handles conflict when remote is newer: updates main tab and opens local as conflict tab", () => {
    const localTab = {
      id: "tab-1",
      title: "Architecture Doc",
      content: "Local concurrent edits",
      isMarkdown: true,
      isDirty: true,
    };

    const remoteNote: NoteVersionInfo = {
      id: "tab-1",
      title: "Architecture Doc",
      content: "Remote concurrent edits (newer)",
      isMarkdown: true,
      version: 2,
      updatedAt: "2099-01-01T00:00:00.000Z", // decisively newer
    };

    const mockStore: TabsStoreActionInterface = {
      tabs: [localTab],
      createTab: vi.fn().mockReturnValue("tab-conflict-id"),
      updateTabContent: vi.fn(),
      setTabDirty: vi.fn(),
    };

    const result = handleSyncConflict(localTab, remoteNote, mockStore);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictTabTitle).toBe("Architecture Doc - conflict");

    // Primary tab updated with winner (remote)
    expect(mockStore.updateTabContent).toHaveBeenCalledWith("tab-1", "Remote concurrent edits (newer)");
    expect(mockStore.setTabDirty).toHaveBeenCalledWith("tab-1", false);

    // Losing version opened in conflict tab with dirty status
    expect(mockStore.createTab).toHaveBeenCalledWith(
      "Architecture Doc - conflict",
      "Local concurrent edits",
      true
    );
    expect(mockStore.setTabDirty).toHaveBeenCalledWith("tab-conflict-id", true);
  });
});
