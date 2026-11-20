import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileMenu } from "./FileMenu";

describe("FileMenu Component", () => {
  it("renders all items with exact labels and shortcuts matching Windows 11 Notepad", () => {
    render(<FileMenu />);

    expect(screen.getByRole("menuitem", { name: /^New tab/i })).toBeDefined();
    expect(screen.getByText("Ctrl+N")).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^New window/i })).toBeDefined();
    expect(screen.getByText("Ctrl+Shift+N")).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^New Markdown tab/i })).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^Open/i })).toBeDefined();
    expect(screen.getByText("Ctrl+O")).toBeDefined();

    expect(screen.getByRole("menuitem", { name: "SaveCtrl+S" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Save asCtrl+Shift+S" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Save allCtrl+Alt+S" })).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^Print/i })).toBeDefined();
    expect(screen.getByText("Ctrl+P")).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^Close tab/i })).toBeDefined();
    expect(screen.getByText("Ctrl+W")).toBeDefined();

    expect(screen.getByRole("menuitem", { name: /^Close window/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Exit/i })).toBeDefined();
  });

  it("triggers callbacks on action click", () => {
    const handleNewTab = vi.fn();
    const handleSave = vi.fn();
    const handleCloseTab = vi.fn();

    render(
      <FileMenu
        onNewTab={handleNewTab}
        onSave={handleSave}
        onCloseTab={handleCloseTab}
      />
    );

    fireEvent.click(screen.getByRole("menuitem", { name: /^New tab/i }));
    expect(handleNewTab).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: "SaveCtrl+S" }));
    expect(handleSave).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("menuitem", { name: /^Close tab/i }));
    expect(handleCloseTab).toHaveBeenCalledTimes(1);
  });
});
