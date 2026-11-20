import { useEffect } from "react";

export interface ShortcutActions {
  onNewTab?: () => void;
  onNewWindow?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onCloseTab?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onGoTo?: () => void;
  onTimeDate?: () => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onSelectTabByIndex?: (index: number) => void;
}

export interface MinimalKeyboardEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: () => void;
}

export function handleShortcutEvent(
  event: MinimalKeyboardEvent,
  actions: ShortcutActions
): boolean {
  const isCtrlOrCmd = !!(event.ctrlKey || event.metaKey);
  const isShift = !!event.shiftKey;
  const key = event.key.toLowerCase();

  // F5 -> Time/Date
  if (event.key === "F5") {
    event.preventDefault?.();
    actions.onTimeDate?.();
    return true;
  }

  // Ctrl+Tab / Ctrl+Shift+Tab -> Next / Prev tab
  if (isCtrlOrCmd && key === "tab") {
    event.preventDefault?.();
    if (isShift) {
      actions.onPrevTab?.();
    } else {
      actions.onNextTab?.();
    }
    return true;
  }

  // Ctrl+1 through Ctrl+9 -> Tab navigation
  if (isCtrlOrCmd && !isShift && /^[1-9]$/.test(key)) {
    event.preventDefault?.();
    const index = parseInt(key, 10) - 1;
    actions.onSelectTabByIndex?.(index);
    return true;
  }

  if (isCtrlOrCmd) {
    if (isShift) {
      // Ctrl+Shift+N -> New Window
      if (key === "n") {
        event.preventDefault?.();
        actions.onNewWindow?.();
        return true;
      }
      // Ctrl+Shift+S -> Save As
      if (key === "s") {
        event.preventDefault?.();
        actions.onSaveAs?.();
        return true;
      }
    } else {
      // Ctrl+N -> New Tab
      if (key === "n") {
        event.preventDefault?.();
        actions.onNewTab?.();
        return true;
      }
      // Ctrl+O -> Open
      if (key === "o") {
        event.preventDefault?.();
        actions.onOpen?.();
        return true;
      }
      // Ctrl+S -> Save
      if (key === "s") {
        event.preventDefault?.();
        actions.onSave?.();
        return true;
      }
      // Ctrl+W -> Close Tab
      if (key === "w") {
        event.preventDefault?.();
        actions.onCloseTab?.();
        return true;
      }
      // Ctrl+F -> Find
      if (key === "f") {
        event.preventDefault?.();
        actions.onFind?.();
        return true;
      }
      // Ctrl+H -> Replace
      if (key === "h") {
        event.preventDefault?.();
        actions.onReplace?.();
        return true;
      }
      // Ctrl+G -> Go to Line
      if (key === "g") {
        event.preventDefault?.();
        actions.onGoTo?.();
        return true;
      }
      // Ctrl+Plus or Ctrl+= -> Zoom In
      if (key === "+" || key === "=") {
        event.preventDefault?.();
        actions.onZoomIn?.();
        return true;
      }
      // Ctrl+- or Ctrl+_ -> Zoom Out
      if (key === "-" || key === "_") {
        event.preventDefault?.();
        actions.onZoomOut?.();
        return true;
      }
      // Ctrl+0 -> Reset Zoom
      if (key === "0") {
        event.preventDefault?.();
        actions.onResetZoom?.();
        return true;
      }
      // Ctrl+A -> Select All
      if (key === "a" && actions.onSelectAll) {
        event.preventDefault?.();
        actions.onSelectAll();
        return true;
      }
      // Ctrl+Z -> Undo
      if (key === "z" && actions.onUndo) {
        event.preventDefault?.();
        actions.onUndo();
        return true;
      }
      // Ctrl+Y -> Redo
      if (key === "y" && actions.onRedo) {
        event.preventDefault?.();
        actions.onRedo();
        return true;
      }
    }
  }

  return false;
}

export function useNotepadShortcuts(actions: ShortcutActions, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      handleShortcutEvent(e, actions);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, enabled]);
}
