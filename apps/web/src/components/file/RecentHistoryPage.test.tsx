import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecentHistoryPage } from "./RecentHistoryPage";
import { useRecentHistoryStore } from "../../stores/recentHistoryStore";

describe("RecentHistoryPage Component", () => {
  beforeEach(() => {
    localStorage.removeItem("notepad_recent_history");
    useRecentHistoryStore.setState({
      items: [
        {
          id: "closed-1",
          title: "Project Requirements",
          content: "Requirements content",
          isMarkdown: true,
          status: "closed",
          timestamp: "2026-11-25T10:30:00Z",
        },
      ],
    });
  });

  it("renders closed and saved notes, filters by tab/search, and reopens on click", async () => {
    const onReopenNote = vi.fn();
    const mockNotesLoader = vi.fn().mockResolvedValue([
      {
        id: "saved-1",
        title: "Meeting Minutes",
        content: "Action items",
        isMarkdown: false,
        updatedAt: "2026-11-23T09:00:00Z",
      },
    ]);

    render(
      <RecentHistoryPage
        onBack={vi.fn()}
        onNewDocument={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
        onReopenNote={onReopenNote}
        notesLoader={mockNotesLoader}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Project Requirements")).toBeDefined();
      expect(screen.getByText("Meeting Minutes")).toBeDefined();
    });

    // Filter to Recently Closed
    fireEvent.click(screen.getByRole("button", { name: "Recently Closed" }));
    expect(screen.getByText("Project Requirements")).toBeDefined();
    expect(screen.queryByText("Meeting Minutes")).toBeNull();

    // Reopen closed note
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    expect(onReopenNote).toHaveBeenCalledWith({
      id: "closed-1",
      title: "Project Requirements",
      content: "Requirements content",
      isMarkdown: true,
      isCustomTitle: false,
    });
  });

  it("triggers onNewDocument when New Document card is clicked", async () => {
    const onNewDocument = vi.fn();
    render(
      <RecentHistoryPage
        onBack={vi.fn()}
        onNewDocument={onNewDocument}
        onOpenFileFromDisk={vi.fn()}
        onReopenNote={vi.fn()}
        notesLoader={vi.fn().mockResolvedValue([])}
      />
    );

    fireEvent.click(screen.getByText("New Document"));
    expect(onNewDocument).toHaveBeenCalledTimes(1);
  });

  it("renders Open Document mode with Saved Notes filter and deletes notes on Delete click", async () => {
    const onDeleteNote = vi.fn();
    const mockNotesLoader = vi.fn().mockResolvedValue([
      {
        id: "saved-1",
        title: "Meeting Minutes",
        content: "Action items",
        isMarkdown: false,
        updatedAt: "2026-11-23T09:00:00Z",
      },
    ]);

    render(
      <RecentHistoryPage
        mode="open"
        onBack={vi.fn()}
        onNewDocument={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
        onReopenNote={vi.fn()}
        onDeleteNote={onDeleteNote}
        notesLoader={mockNotesLoader}
      />
    );

    expect(screen.getByText("Open Document")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("Meeting Minutes")).toBeDefined();
    });

    expect(screen.getByRole("button", { name: "Open" })).toBeDefined();
    fireEvent.click(screen.getByLabelText("Delete Meeting Minutes"));

    expect(onDeleteNote).toHaveBeenCalledWith("saved-1");
    await waitFor(() => {
      expect(screen.queryByText("Meeting Minutes")).toBeNull();
    });
  });

  it("calls onClearAll and clears all notes when Clear history is clicked", async () => {
    const onClearAll = vi.fn();
    render(
      <RecentHistoryPage
        mode="history"
        onBack={vi.fn()}
        onNewDocument={vi.fn()}
        onOpenFileFromDisk={vi.fn()}
        onReopenNote={vi.fn()}
        onClearAll={onClearAll}
        notesLoader={vi.fn().mockResolvedValue([])}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No recent or closed notes found.")).toBeDefined();
  });
});
