import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListDropdown } from "./ListDropdown";

describe("ListDropdown Component", () => {
  it("renders list button trigger", () => {
    render(<ListDropdown />);
    const trigger = screen.getByRole("button", { name: /lists/i });
    expect(trigger).toBeDefined();
  });

  it("opens dropdown and lists Bulleted list, Numbered list, Increase indent, Decrease indent", () => {
    render(<ListDropdown canIndent={true} canOutdent={false} />);
    const trigger = screen.getByRole("button", { name: /lists/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Bulleted list" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Numbered list" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Increase indent" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Decrease indent" })).toBeDefined();
  });

  it("triggers callbacks on list item click", () => {
    const handleBullet = vi.fn();
    const handleNumber = vi.fn();

    render(<ListDropdown onToggleBullet={handleBullet} onToggleNumber={handleNumber} />);
    const trigger = screen.getByRole("button", { name: /lists/i });
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole("menuitem", { name: "Bulleted list" }));
    expect(handleBullet).toHaveBeenCalledTimes(1);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Numbered list" }));
    expect(handleNumber).toHaveBeenCalledTimes(1);
  });
});
