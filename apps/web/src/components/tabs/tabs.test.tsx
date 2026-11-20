import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTabsStore } from "../../stores/tabsStore";
import { TabItem } from "./TabItem";

describe("Tabs Management & Store", () => {
  beforeEach(() => {
    // Reset store state
    useTabsStore.setState({
      tabs: [
        {
          id: "tab-1",
          title: "Note 1",
          content: "Initial text",
          isDirty: false,
          isMarkdown: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
      activeTabId: "tab-1",
    });
  });

  it("creates a new tab and sets it as active", () => {
    const id = useTabsStore.getState().createTab("New Note", "Hello world");
    const state = useTabsStore.getState();

    expect(state.tabs.length).toBe(2);
    expect(state.activeTabId).toBe(id);
    expect(state.tabs[1].title).toBe("New Note");
    expect(state.tabs[1].content).toBe("Hello world");
    expect(state.tabs[1].isDirty).toBe(false);
  });

  it("updates content and marks tab as dirty", () => {
    useTabsStore.getState().updateTabContent("tab-1", "Updated content");
    const tab = useTabsStore.getState().tabs[0];

    expect(tab.content).toBe("Updated content");
    expect(tab.isDirty).toBe(true);
  });

  it("cycles tabs sequentially with cycleNextTab and cyclePreviousTab", () => {
    const id2 = useTabsStore.getState().createTab("Note 2");
    const id3 = useTabsStore.getState().createTab("Note 3");

    expect(useTabsStore.getState().activeTabId).toBe(id3);

    useTabsStore.getState().cycleNextTab(); // wraps to tab-1
    expect(useTabsStore.getState().activeTabId).toBe("tab-1");

    useTabsStore.getState().cycleNextTab(); // tab-2
    expect(useTabsStore.getState().activeTabId).toBe(id2);

    useTabsStore.getState().cyclePreviousTab(); // back to tab-1
    expect(useTabsStore.getState().activeTabId).toBe("tab-1");
  });

  it("reorders tabs correctly", () => {
    useTabsStore.getState().createTab("Note 2");
    useTabsStore.getState().createTab("Note 3");
    // Initial order: Note 1, Note 2, Note 3
    expect(useTabsStore.getState().tabs.map((t) => t.title)).toEqual(["Note 1", "Note 2", "Note 3"]);

    // Move first tab to position 2
    useTabsStore.getState().reorderTabs(0, 2);
    expect(useTabsStore.getState().tabs.map((t) => t.title)).toEqual(["Note 2", "Note 3", "Note 1"]);
  });

  it("closing an active tab selects the nearest adjacent tab", () => {
    const id2 = useTabsStore.getState().createTab("Note 2");
    useTabsStore.getState().createTab("Note 3");
    useTabsStore.getState().selectTab(id2);

    useTabsStore.getState().closeTab(id2);
    const state = useTabsStore.getState();

    expect(state.tabs.length).toBe(2);
    expect(state.tabs.find((t) => t.id === id2)).toBeUndefined();
    expect(state.activeTabId).toBe("tab-1");
  });

  it("closing the sole remaining tab resets to a clean Untitled tab", () => {
    useTabsStore.getState().closeTab("tab-1");
    const state = useTabsStore.getState();

    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].title).toBe("Untitled");
    expect(state.tabs[0].content).toBe("");
    expect(state.tabs[0].isDirty).toBe(false);
  });
});

describe("TabItem Component Drag and Drop", () => {
  it("initiates drag and handles drop reorder", () => {
    const handleReorder = vi.fn();
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <TabItem
        tab={{ id: "t1", title: "Tab 1", isDirty: false }}
        isActive={true}
        index={0}
        onSelect={handleSelect}
        onClose={handleClose}
        onReorder={handleReorder}
      />
    );

    const tabEl = screen.getByRole("tab");

    // Test dragstart
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("1"),
      effectAllowed: "",
      dropEffect: "",
    };

    fireEvent.dragStart(tabEl, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "0");

    // Test dragOver and drop
    fireEvent.dragOver(tabEl, { dataTransfer });
    fireEvent.drop(tabEl, { dataTransfer });

    expect(handleReorder).toHaveBeenCalledWith(1, 0);
  });
});
