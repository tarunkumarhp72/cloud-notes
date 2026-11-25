import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloseTabConfirmModal } from "./CloseTabConfirmModal";

describe("CloseTabConfirmModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CloseTabConfirmModal
        isOpen={false}
        tabTitle="Untitled"
        onSave={vi.fn()}
        onDontSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Windows 11 Notepad confirmation prompt and triggers Save, Don't save, and Cancel", () => {
    const onSave = vi.fn();
    const onDontSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <CloseTabConfirmModal
        isOpen={true}
        tabTitle="Technical Round 1 - Python.txt"
        onSave={onSave}
        onDontSave={onDontSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Notepad")).toBeDefined();
    expect(
      screen.getByText("Do you want to save changes to Technical Round 1 - Python.txt?")
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /don't save/i }));
    expect(onDontSave).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
