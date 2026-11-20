import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeadingDropdown } from "./HeadingDropdown";

describe("HeadingDropdown Component", () => {
  it("renders trigger button with active short label", () => {
    render(<HeadingDropdown activeLevel="title" />);
    const trigger = screen.getByRole("button", { name: /style/i });
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain("H1");
  });

  it("opens dropdown on click and displays all 7 heading levels matching image copy 4.png", () => {
    render(<HeadingDropdown activeLevel="body" />);
    const trigger = screen.getByRole("button", { name: /style/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Title" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Subtitle" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Heading" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Subheading" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Section" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Subsection" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Body" })).toBeDefined();
  });

  it("calls onSelectLevel when an option is clicked and closes dropdown", () => {
    const handleSelect = vi.fn();
    render(<HeadingDropdown activeLevel="title" onSelectLevel={handleSelect} />);

    const trigger = screen.getByRole("button", { name: /style/i });
    fireEvent.click(trigger);

    const headingItem = screen.getByRole("menuitem", { name: "Heading" });
    fireEvent.click(headingItem);

    expect(handleSelect).toHaveBeenCalledWith("heading");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
