import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableDropdown } from "./TableDropdown";

describe("TableDropdown Component", () => {
  it("renders table button trigger", () => {
    render(<TableDropdown />);
    const trigger = screen.getByRole("button", { name: /table/i });
    expect(trigger).toBeDefined();
  });

  it("opens dropdown and renders 5x5 grid cells matching image copy 6.png", () => {
    render(<TableDropdown />);
    const trigger = screen.getByRole("button", { name: /table/i });
    fireEvent.click(trigger);

    // 25 grid cells
    const cell3x3 = screen.getByRole("button", { name: "3 by 3 table" });
    expect(cell3x3).toBeDefined();

    expect(screen.getByRole("menuitem", { name: "Insert table" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /edit table/i })).toBeDefined();
  });

  it("triggers onInsertTable with selected dimensions when cell is clicked", () => {
    const handleInsert = vi.fn();
    render(<TableDropdown onInsertTable={handleInsert} />);

    const trigger = screen.getByRole("button", { name: /table/i });
    fireEvent.click(trigger);

    const cell2x4 = screen.getByRole("button", { name: "2 by 4 table" });
    fireEvent.click(cell2x4);

    expect(handleInsert).toHaveBeenCalledWith(2, 4);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("disables Edit table when canEditTable is false", () => {
    render(<TableDropdown canEditTable={false} />);
    const trigger = screen.getByRole("button", { name: /table/i });
    fireEvent.click(trigger);

    const editItem = screen.getByRole("menuitem", { name: /edit table/i });
    expect(editItem.hasAttribute("disabled")).toBe(true);
  });
});
