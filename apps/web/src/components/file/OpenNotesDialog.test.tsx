import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OpenNotesDialog, SavedNoteSummary } from "./OpenNotesDialog";

describe("OpenNotesDialog Component", () => {
  const sampleNotes: SavedNoteSummary[] = [
    {
      id: "note-1",
      title: "Work Notes",
      content: "Important tasks",
      isMarkdown: false,
      updatedAt: "2026-11-20T10:00:00Z",
    },
    {
      id: "note-2",
      title: "Shopping List",
      content: "- Milk\n- Apples",
      isMarkdown: true,
      updatedAt: "2026-11-20T11:00:00Z",
    },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <OpenNotesDialog
        isOpen={false}
        onClose={vi.fn()}
        onSelectNote={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("loads and displays saved notes and filters by search query", async () => {
    const mockLoader = vi.fn().mockResolvedValue(sampleNotes);

    render(
      <OpenNotesDialog
        isOpen={true}
        onClose={vi.fn()}
        onSelectNote={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
        notesLoader={mockLoader}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeDefined();
      expect(screen.getByText("Shopping List")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText("Search saved notes...");
    fireEvent.change(searchInput, { target: { value: "Shop" } });

    expect(screen.queryByText("Work Notes")).toBeNull();
    expect(screen.getByText("Shopping List")).toBeDefined();
  });

  it("calls onSelectNote and onClose when clicking a note item", async () => {
    const onSelectNote = vi.fn();
    const onClose = vi.fn();
    const mockLoader = vi.fn().mockResolvedValue(sampleNotes);

    render(
      <OpenNotesDialog
        isOpen={true}
        onClose={onClose}
        onSelectNote={onSelectNote}
        onOpenFileFromDisk={vi.fn()}
        notesLoader={mockLoader}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Work Notes"));
    expect(onSelectNote).toHaveBeenCalledWith(sampleNotes[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when clicking cancel button", async () => {
    const onClose = vi.fn();
    render(
      <OpenNotesDialog
        isOpen={true}
        onClose={onClose}
        onSelectNote={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
        notesLoader={vi.fn().mockResolvedValue([])}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
