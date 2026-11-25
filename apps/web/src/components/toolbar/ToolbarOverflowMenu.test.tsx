import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolbarOverflowMenu } from "./ToolbarOverflowMenu";

describe("ToolbarOverflowMenu Component", () => {
  it("opens dropdown and triggers formatting actions", () => {
    const onInsertLink = vi.fn();
    const onClearFormatting = vi.fn();
    const onInsertTable = vi.fn();

    render(
      <ToolbarOverflowMenu
        onToggleBold={vi.fn()}
        onToggleItalic={vi.fn()}
        onToggleStrikethrough={vi.fn()}
        onToggleBullet={vi.fn()}
        onToggleNumber={vi.fn()}
        onInsertLink={onInsertLink}
        onInsertTable={onInsertTable}
        onClearFormatting={onClearFormatting}
      />
    );

    const trigger = screen.getByRole("button", { name: "More formatting" });
    fireEvent.click(trigger);

    expect(screen.getByRole("menu", { name: "More formatting options" })).toBeDefined();

    fireEvent.click(screen.getByRole("menuitem", { name: "Insert link" }));
    expect(onInsertLink).toHaveBeenCalledTimes(1);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Insert table (3×3)" }));
    expect(onInsertTable).toHaveBeenCalledWith(3, 3);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Clear formatting" }));
    expect(onClearFormatting).toHaveBeenCalledTimes(1);
  });
});
