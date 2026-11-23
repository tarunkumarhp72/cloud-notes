import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabStrip, Tab } from "./TabStrip";

describe("TabStrip Component", () => {
  const mockTabs: Tab[] = [
    { id: "tab-1", title: "Untitled", isDirty: false },
    { id: "tab-2", title: "Project Notes.md", isDirty: true },
  ];

  it("renders tabs, active state, and new tab button", () => {
    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />
    );

    const tab1 = screen.getByRole("tab", { name: /untitled/i });
    expect(tab1).toBeDefined();
    expect(tab1.getAttribute("aria-selected")).toBe("true");

    const tab2 = screen.getByRole("tab", { name: /project notes\.md/i });
    expect(tab2).toBeDefined();
    expect(tab2.getAttribute("aria-selected")).toBe("false");

    expect(screen.getByLabelText(/new tab/i)).toBeDefined();
  });

  it("displays dirty dot indicator on modified tabs", () => {
    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />
    );

    expect(screen.getByTitle("Unsaved changes")).toBeDefined();
  });

  it("triggers onSelectTab when clicking an inactive tab", () => {
    const handleSelect = vi.fn();
    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={handleSelect}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />
    );

    const tab2 = screen.getByRole("tab", { name: /project notes\.md/i });
    fireEvent.click(tab2);
    expect(handleSelect).toHaveBeenCalledWith("tab-2");
  });

  it("triggers onCloseTab when clicking the tab close button without selecting", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();
    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={handleSelect}
        onCloseTab={handleClose}
        onNewTab={vi.fn()}
      />
    );

    const closeBtn = screen.getByLabelText("Close tab Project Notes.md");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledWith("tab-2");
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("triggers onNewTab when clicking the new tab button", () => {
    const handleNewTab = vi.fn();
    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={handleNewTab}
      />
    );

    const newBtn = screen.getByLabelText(/new tab/i);
    fireEvent.click(newBtn);
    expect(handleNewTab).toHaveBeenCalledTimes(1);
  });

  it("triggers window caption controls (minimize, maximize, close)", () => {
    const onMinimize = vi.fn();
    const onMaximize = vi.fn();
    const onCloseWindow = vi.fn();

    render(
      <TabStrip
        tabs={mockTabs}
        activeTabId="tab-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onCloseWindow={onCloseWindow}
      />
    );

    const minBtn = screen.getByRole("button", { name: "Minimize" });
    fireEvent.click(minBtn);
    expect(onMinimize).toHaveBeenCalledTimes(1);

    const maxBtn = screen.getByRole("button", { name: "Maximize" });
    fireEvent.click(maxBtn);
    expect(onMaximize).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(onCloseWindow).toHaveBeenCalledTimes(1);
  });
});
