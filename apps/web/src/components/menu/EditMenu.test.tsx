import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditMenu } from "./EditMenu";

describe("EditMenu Component", () => {
  it("renders all Edit items matching image copy 2.png", () => {
    render(<EditMenu canUndo={true} canPaste={true} canCut={true} canCopy={true} canDelete={true} />);

    expect(screen.getByRole("menuitem", { name: "UndoCtrl+Z" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "CutCtrl+X" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "CopyCtrl+C" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "PasteCtrl+V" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "DeleteDel" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Clear formatting" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Search with BingCtrl+E" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "FindCtrl+F" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Find nextF3" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Find previousShift+F3" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "ReplaceCtrl+H" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Go toCtrl+G" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Select allCtrl+A" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Time/DateF5" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Font" })).toBeDefined();
  });

  it("disables unavailable actions dynamically", () => {
    render(<EditMenu canUndo={false} canCut={false} canCopy={false} canDelete={false} />);

    const undoBtn = screen.getByRole("menuitem", { name: "UndoCtrl+Z" });
    expect(undoBtn.hasAttribute("disabled")).toBe(true);

    const cutBtn = screen.getByRole("menuitem", { name: "CutCtrl+X" });
    expect(cutBtn.hasAttribute("disabled")).toBe(true);

    const copyBtn = screen.getByRole("menuitem", { name: "CopyCtrl+C" });
    expect(copyBtn.hasAttribute("disabled")).toBe(true);

    const deleteBtn = screen.getByRole("menuitem", { name: "DeleteDel" });
    expect(deleteBtn.hasAttribute("disabled")).toBe(true);
  });

  it("triggers callbacks when clicked", () => {
    const handleUndo = vi.fn();
    const handleTimeDate = vi.fn();
    const handleSelectAll = vi.fn();

    render(
      <EditMenu
        canUndo={true}
        onUndo={handleUndo}
        onTimeDate={handleTimeDate}
        onSelectAll={handleSelectAll}
      />
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "UndoCtrl+Z" }));
    expect(handleUndo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: "Time/DateF5" }));
    expect(handleTimeDate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: "Select allCtrl+A" }));
    expect(handleSelectAll).toHaveBeenCalledTimes(1);
  });
});
