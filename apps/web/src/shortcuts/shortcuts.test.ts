import { describe, it, expect, vi } from "vitest";
import { handleShortcutEvent, ShortcutActions, MinimalKeyboardEvent } from "./shortcutsDispatcher";

describe("Shortcuts Dispatcher", () => {
  const createMockEvent = (partial: Partial<MinimalKeyboardEvent>): MinimalKeyboardEvent => ({
    key: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    ...partial,
  });

  it("handles File shortcuts: Ctrl+N, Ctrl+Shift+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+W", () => {
    const actions: ShortcutActions = {
      onNewTab: vi.fn(),
      onNewWindow: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onSaveAs: vi.fn(),
      onCloseTab: vi.fn(),
    };

    // Ctrl+N -> New Tab
    const e1 = createMockEvent({ key: "n", ctrlKey: true });
    expect(handleShortcutEvent(e1, actions)).toBe(true);
    expect(actions.onNewTab).toHaveBeenCalledTimes(1);
    expect(e1.preventDefault).toHaveBeenCalled();

    // Ctrl+Shift+N -> New Window
    const e2 = createMockEvent({ key: "N", ctrlKey: true, shiftKey: true });
    expect(handleShortcutEvent(e2, actions)).toBe(true);
    expect(actions.onNewWindow).toHaveBeenCalledTimes(1);

    // Ctrl+O -> Open
    const e3 = createMockEvent({ key: "o", ctrlKey: true });
    expect(handleShortcutEvent(e3, actions)).toBe(true);
    expect(actions.onOpen).toHaveBeenCalledTimes(1);

    // Ctrl+S -> Save
    const e4 = createMockEvent({ key: "s", ctrlKey: true });
    expect(handleShortcutEvent(e4, actions)).toBe(true);
    expect(actions.onSave).toHaveBeenCalledTimes(1);

    // Ctrl+Shift+S -> Save As
    const e5 = createMockEvent({ key: "S", ctrlKey: true, shiftKey: true });
    expect(handleShortcutEvent(e5, actions)).toBe(true);
    expect(actions.onSaveAs).toHaveBeenCalledTimes(1);

    // Ctrl+W -> Close Tab
    const e6 = createMockEvent({ key: "w", ctrlKey: true });
    expect(handleShortcutEvent(e6, actions)).toBe(true);
    expect(actions.onCloseTab).toHaveBeenCalledTimes(1);
  });

  it("handles Edit shortcuts: Ctrl+F, Ctrl+H, Ctrl+G, F5, Ctrl+Z, Ctrl+Y", () => {
    const actions: ShortcutActions = {
      onFind: vi.fn(),
      onReplace: vi.fn(),
      onGoTo: vi.fn(),
      onTimeDate: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
    };

    // Ctrl+F -> Find
    const ef = createMockEvent({ key: "f", ctrlKey: true });
    expect(handleShortcutEvent(ef, actions)).toBe(true);
    expect(actions.onFind).toHaveBeenCalledTimes(1);

    // Ctrl+H -> Replace
    const eh = createMockEvent({ key: "h", ctrlKey: true });
    expect(handleShortcutEvent(eh, actions)).toBe(true);
    expect(actions.onReplace).toHaveBeenCalledTimes(1);

    // Ctrl+G -> Go to
    const eg = createMockEvent({ key: "g", ctrlKey: true });
    expect(handleShortcutEvent(eg, actions)).toBe(true);
    expect(actions.onGoTo).toHaveBeenCalledTimes(1);

    // F5 -> Time/Date only active on desktop, ignored on web
    const eF5 = createMockEvent({ key: "F5" });
    expect(handleShortcutEvent(eF5, { ...actions, isDesktop: false })).toBe(false);
    expect(handleShortcutEvent(eF5, { ...actions, isDesktop: true })).toBe(true);
    expect(actions.onTimeDate).toHaveBeenCalledTimes(1);

    // Ctrl+Z -> Undo
    const ez = createMockEvent({ key: "z", ctrlKey: true });
    expect(handleShortcutEvent(ez, actions)).toBe(true);
    expect(actions.onUndo).toHaveBeenCalledTimes(1);

    // Ctrl+Y -> Redo
    const ey = createMockEvent({ key: "y", ctrlKey: true });
    expect(handleShortcutEvent(ey, actions)).toBe(true);
    expect(actions.onRedo).toHaveBeenCalledTimes(1);
  });

  it("handles View shortcuts for Zoom: Ctrl++, Ctrl+-, Ctrl+0", () => {
    const actions: ShortcutActions = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    // Ctrl+= or Ctrl++
    const eZoomIn = createMockEvent({ key: "=", ctrlKey: true });
    expect(handleShortcutEvent(eZoomIn, actions)).toBe(true);
    expect(actions.onZoomIn).toHaveBeenCalledTimes(1);

    // Ctrl+-
    const eZoomOut = createMockEvent({ key: "-", ctrlKey: true });
    expect(handleShortcutEvent(eZoomOut, actions)).toBe(true);
    expect(actions.onZoomOut).toHaveBeenCalledTimes(1);

    // Ctrl+0
    const eReset = createMockEvent({ key: "0", ctrlKey: true });
    expect(handleShortcutEvent(eReset, actions)).toBe(true);
    expect(actions.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it("handles tab navigation shortcuts: Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+1..9", () => {
    const actions: ShortcutActions = {
      onNextTab: vi.fn(),
      onPrevTab: vi.fn(),
      onSelectTabByIndex: vi.fn(),
    };

    // Ctrl+Tab
    const eTabNext = createMockEvent({ key: "Tab", ctrlKey: true });
    expect(handleShortcutEvent(eTabNext, actions)).toBe(true);
    expect(actions.onNextTab).toHaveBeenCalledTimes(1);

    // Ctrl+Shift+Tab
    const eTabPrev = createMockEvent({ key: "Tab", ctrlKey: true, shiftKey: true });
    expect(handleShortcutEvent(eTabPrev, actions)).toBe(true);
    expect(actions.onPrevTab).toHaveBeenCalledTimes(1);

    // Ctrl+3 -> selects index 2
    const eTab3 = createMockEvent({ key: "3", ctrlKey: true });
    expect(handleShortcutEvent(eTab3, actions)).toBe(true);
    expect(actions.onSelectTabByIndex).toHaveBeenCalledWith(2);
  });

  it("ignores unhandled key events and does not preventDefault", () => {
    const actions: ShortcutActions = { onSave: vi.fn() };
    const e = createMockEvent({ key: "k", ctrlKey: true });
    expect(handleShortcutEvent(e, actions)).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(actions.onSave).not.toHaveBeenCalled();
  });
});
