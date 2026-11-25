import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecycleBinPage } from "./RecycleBinPage";
import { useRecycleBinStore } from "../../stores/recycleBinStore";

describe("RecycleBinPage Component", () => {
  beforeEach(() => {
    localStorage.removeItem("notepad_recycle_bin");
    useRecycleBinStore.setState({
      items: [
        {
          id: "bin-1",
          title: "Project Plan",
          content: "Roadmap details",
          isMarkdown: true,
          isCustomTitle: true,
          deletedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it("renders deleted notes with 15-day retention info and restores on Restore click", () => {
    const onRestoreNote = vi.fn();
    render(<RecycleBinPage onBack={vi.fn()} onRestoreNote={onRestoreNote} />);

    expect(screen.getByText("Recycle Bin")).toBeDefined();
    expect(screen.getByText("Project Plan")).toBeDefined();
    expect(screen.getByText("15d remaining")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onRestoreNote).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bin-1", title: "Project Plan" })
    );
    expect(screen.getByText("Recycle Bin is empty.")).toBeDefined();
  });

  it("permanently deletes a note when delete permanently is clicked", () => {
    render(<RecycleBinPage onBack={vi.fn()} onRestoreNote={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Delete Project Plan permanently"));
    expect(screen.getByText("Recycle Bin is empty.")).toBeDefined();
  });
});
