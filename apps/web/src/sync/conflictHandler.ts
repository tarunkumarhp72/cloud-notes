import {
  detectNoteConflict,
  type NoteVersionInfo,
  type ConflictDetectionResult,
} from "@notepad/core";

export interface TabsStoreActionInterface {
  tabs: Array<{ id: string; title: string; content: string; isMarkdown: boolean; isDirty: boolean }>;
  createTab: (title?: string, initialContent?: string, isMarkdown?: boolean) => string;
  updateTabContent: (id: string, content: string) => void;
  setTabDirty: (id: string, isDirty: boolean) => void;
}

/**
 * Resolves a sync conflict by applying the winning version to the primary note tab
 * and automatically spawning a new tab for the losing version titled "[Note Name] - conflict".
 */
export function handleSyncConflict(
  localTab: { id: string; title: string; content: string; isMarkdown: boolean; isDirty: boolean },
  remoteNote: NoteVersionInfo,
  store: TabsStoreActionInterface
): ConflictDetectionResult {
  const localInfo: NoteVersionInfo = {
    id: localTab.id,
    title: localTab.title,
    content: localTab.content,
    isMarkdown: localTab.isMarkdown,
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  const result = detectNoteConflict(localInfo, remoteNote, localTab.isDirty);

  if (result.hasConflict && result.loser && result.conflictTabTitle) {
    // 1. Update primary tab with winning content
    store.updateTabContent(localTab.id, result.winner.content);

    // If remote won, clear dirty flag on primary note
    if (result.winner === remoteNote) {
      store.setTabDirty(localTab.id, false);
    }

    // 2. Open losing version in a new conflict tab with unsaved (dirty) status
    const conflictTabId = store.createTab(
      result.conflictTabTitle,
      result.loser.content,
      result.loser.isMarkdown
    );
    store.setTabDirty(conflictTabId, true);
  } else if (!localTab.isDirty) {
    // Clean update
    store.updateTabContent(localTab.id, remoteNote.content);
    store.setTabDirty(localTab.id, false);
  }

  return result;
}
