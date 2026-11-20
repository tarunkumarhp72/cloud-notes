import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FindReplaceBar } from "./FindReplaceBar";

describe("FindReplaceBar Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <FindReplaceBar
        isOpen={false}
        isReplaceOpen={false}
        onClose={vi.fn()}
        onToggleReplace={vi.fn()}
        onFindNext={vi.fn()}
        onFindPrevious={vi.fn()}
        onReplace={vi.fn()}
        onReplaceAll={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders find row and responds to find queries and triggers findNext on Enter", () => {
    const onFindNext = vi.fn();
    const onQueryChange = vi.fn();

    render(
      <FindReplaceBar
        isOpen={true}
        isReplaceOpen={false}
        onClose={vi.fn()}
        onToggleReplace={vi.fn()}
        onFindNext={onFindNext}
        onFindPrevious={vi.fn()}
        onReplace={vi.fn()}
        onReplaceAll={vi.fn()}
        onQueryChange={onQueryChange}
        currentMatch={2}
        totalMatches={5}
      />
    );

    const findInput = screen.getByPlaceholderText("Find");
    expect(findInput).toBeDefined();

    fireEvent.change(findInput, { target: { value: "hello" } });
    expect(onQueryChange).toHaveBeenCalledWith("hello", false);

    expect(screen.getByText("2/5")).toBeDefined();

    // Press Enter to find next
    fireEvent.keyDown(findInput, { key: "Enter" });
    expect(onFindNext).toHaveBeenCalledWith("hello", false, true);
  });

  it("toggles replace row and triggers replace actions", () => {
    const onToggleReplace = vi.fn();
    const onReplace = vi.fn();
    const onReplaceAll = vi.fn();

    render(
      <FindReplaceBar
        isOpen={true}
        isReplaceOpen={true}
        onClose={vi.fn()}
        onToggleReplace={onToggleReplace}
        onFindNext={vi.fn()}
        onFindPrevious={vi.fn()}
        onReplace={onReplace}
        onReplaceAll={onReplaceAll}
        currentMatch={1}
        totalMatches={3}
      />
    );

    const findInput = screen.getByPlaceholderText("Find");
    fireEvent.change(findInput, { target: { value: "foo" } });

    const replaceInput = screen.getByPlaceholderText("Replace");
    expect(replaceInput).toBeDefined();
    fireEvent.change(replaceInput, { target: { value: "bar" } });

    const replaceBtn = screen.getByRole("button", { name: "Replace" });
    fireEvent.click(replaceBtn);
    expect(onReplace).toHaveBeenCalledWith("foo", "bar", false, true);

    const replaceAllBtn = screen.getByRole("button", { name: "Replace all" });
    fireEvent.click(replaceAllBtn);
    expect(onReplaceAll).toHaveBeenCalledWith("foo", "bar", false);
  });

  it("toggles match case and wrap around flags", () => {
    const onFindNext = vi.fn();

    render(
      <FindReplaceBar
        isOpen={true}
        isReplaceOpen={false}
        onClose={vi.fn()}
        onToggleReplace={vi.fn()}
        onFindNext={onFindNext}
        onFindPrevious={vi.fn()}
        onReplace={vi.fn()}
        onReplaceAll={vi.fn()}
        totalMatches={1}
      />
    );

    const matchCaseBtn = screen.getByRole("button", { name: "Match case" });
    fireEvent.click(matchCaseBtn);
    expect(matchCaseBtn.getAttribute("aria-pressed")).toBe("true");

    const wrapBtn = screen.getByRole("button", { name: "Wrap around" });
    fireEvent.click(wrapBtn);
    expect(wrapBtn.getAttribute("aria-pressed")).toBe("false");

    const findInput = screen.getByPlaceholderText("Find");
    fireEvent.change(findInput, { target: { value: "caseTest" } });
    fireEvent.keyDown(findInput, { key: "Enter" });
    expect(onFindNext).toHaveBeenCalledWith("caseTest", true, false);
  });
});
