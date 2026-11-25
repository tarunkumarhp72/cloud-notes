import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveNoteModal } from "./SaveNoteModal";

describe("SaveNoteModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <SaveNoteModal isOpen={false} initialTitle="Untitled" onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Save dialog with editable title and optional download checkbox", () => {
    const onSave = vi.fn();
    render(
      <SaveNoteModal
        isOpen={true}
        initialTitle="Draft Note"
        isMarkdown={true}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByLabelText("Note name") as HTMLInputElement;
    expect(input.value).toBe("Draft Note");

    fireEvent.change(input, { target: { value: "Technical Round 1 - Python" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("Technical Round 1 - Python", false);
  });

  it("passes alsoDownload=true when checkbox is checked", () => {
    const onSave = vi.fn();
    render(
      <SaveNoteModal
        isOpen={true}
        initialTitle="Notes"
        isSaveAs={true}
        isMarkdown={false}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Save As")).toBeDefined();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith("Notes", true);
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(
      <SaveNoteModal isOpen={true} initialTitle="Notes" onSave={vi.fn()} onCancel={onCancel} />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
