import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MenuBar } from "./MenuBar";

describe("MenuBar Component", () => {
  it("renders File, Edit, and View menu items", () => {
    render(<MenuBar />);

    expect(screen.getByRole("menuitem", { name: "File" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "View" })).toBeDefined();
  });

  it("toggles active menu on click and renders dropdown", async () => {
    const renderFile = vi.fn().mockReturnValue(<div data-testid="file-dropdown">File Content</div>);
    render(<MenuBar renderFileDropdown={renderFile} />);

    const fileBtn = screen.getByRole("menuitem", { name: "File" });
    expect(screen.queryByTestId("file-dropdown")).toBeNull();

    await act(async () => {
      fireEvent.click(fileBtn);
    });

    expect(screen.getByTestId("file-dropdown")).toBeDefined();
    expect(fileBtn.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      fireEvent.click(fileBtn);
    });

    expect(screen.queryByTestId("file-dropdown")).toBeNull();
  });

  it("switches active menu on hover when another menu is already open", async () => {
    const renderEdit = vi.fn().mockReturnValue(<div data-testid="edit-dropdown">Edit Content</div>);
    render(<MenuBar renderEditDropdown={renderEdit} />);

    const fileBtn = screen.getByRole("menuitem", { name: "File" });
    const editBtn = screen.getByRole("menuitem", { name: "Edit" });

    await act(async () => {
      fireEvent.click(fileBtn);
    });
    expect(fileBtn.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      fireEvent.mouseEnter(editBtn);
    });
    expect(screen.getByTestId("edit-dropdown")).toBeDefined();
    expect(editBtn.getAttribute("aria-expanded")).toBe("true");
  });

  it("navigates menus using keyboard ArrowRight and closes with Escape", async () => {
    const renderFile = vi.fn().mockReturnValue(<div data-testid="file-dropdown">File</div>);
    const renderEdit = vi.fn().mockReturnValue(<div data-testid="edit-dropdown">Edit</div>);

    const { container } = render(
      <MenuBar renderFileDropdown={renderFile} renderEditDropdown={renderEdit} />
    );

    const fileBtn = screen.getByRole("menuitem", { name: "File" });
    await act(async () => {
      fireEvent.click(fileBtn);
    });

    const menuNav = container.querySelector("nav");
    expect(menuNav).toBeDefined();

    // ArrowRight moves from File to Edit
    await act(async () => {
      fireEvent.keyDown(menuNav!, { key: "ArrowRight" });
    });
    expect(screen.getByTestId("edit-dropdown")).toBeDefined();

    // Escape closes active menu
    await act(async () => {
      fireEvent.keyDown(menuNav!, { key: "Escape" });
    });
    expect(screen.queryByTestId("edit-dropdown")).toBeNull();
  });
});
