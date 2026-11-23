import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CollapsedMenu } from "./CollapsedMenu";

describe("CollapsedMenu Component", () => {
  it("renders Menu button and opens dropdown when clicked", async () => {
    const renderFile = vi.fn().mockReturnValue(<div data-testid="file-items">File Content</div>);
    const renderEdit = vi.fn().mockReturnValue(<div data-testid="edit-items">Edit Content</div>);
    const renderView = vi.fn().mockReturnValue(<div data-testid="view-items">View Content</div>);

    render(
      <CollapsedMenu
        renderFileDropdown={renderFile}
        renderEditDropdown={renderEdit}
        renderViewDropdown={renderView}
      />
    );

    const menuBtn = screen.getByRole("button", { name: "Application menu" });
    expect(menuBtn).toBeDefined();
    expect(menuBtn.getAttribute("aria-expanded")).toBe("false");

    // Click to open
    await act(async () => {
      fireEvent.click(menuBtn);
    });
    expect(menuBtn.getAttribute("aria-expanded")).toBe("true");

    // Defaults to File category
    expect(screen.getByTestId("file-items")).toBeDefined();
    expect(renderFile).toHaveBeenCalled();
  });

  it("switches categories between File, Edit, and View", async () => {
    render(
      <CollapsedMenu
        renderFileDropdown={() => <div data-testid="file-items">File Menu Items</div>}
        renderEditDropdown={() => <div data-testid="edit-items">Edit Menu Items</div>}
        renderViewDropdown={() => <div data-testid="view-items">View Menu Items</div>}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Application menu" }));
    });

    // Switch to Edit
    const editTab = screen.getByRole("tab", { name: "Edit" });
    await act(async () => {
      fireEvent.click(editTab);
    });
    expect(screen.getByTestId("edit-items")).toBeDefined();
    expect(screen.queryByTestId("file-items")).toBeNull();

    // Switch to View
    const viewTab = screen.getByRole("tab", { name: "View" });
    await act(async () => {
      fireEvent.click(viewTab);
    });
    expect(screen.getByTestId("view-items")).toBeDefined();
    expect(screen.queryByTestId("edit-items")).toBeNull();
  });

  it("closes flyout when pressing Escape", async () => {
    render(
      <CollapsedMenu
        renderFileDropdown={() => <div>File Items</div>}
      />
    );

    const menuBtn = screen.getByRole("button", { name: "Application menu" });
    await act(async () => {
      fireEvent.click(menuBtn);
    });
    expect(menuBtn.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      fireEvent.keyDown(menuBtn, { key: "Escape" });
    });
    expect(menuBtn.getAttribute("aria-expanded")).toBe("false");
  });
});
