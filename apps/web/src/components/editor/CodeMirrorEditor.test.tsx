import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CodeMirrorEditor, CodeMirrorEditorRef } from "./CodeMirrorEditor";

describe("CodeMirrorEditor Component", () => {
  it("renders editor container and initializes CodeMirror surface", () => {
    const { container } = render(
      <CodeMirrorEditor value="Hello Windows 11 Notepad" />
    );

    const cmElement = container.querySelector(".cm-editor");
    expect(cmElement).toBeDefined();
    expect(container.textContent).toContain("Hello Windows 11 Notepad");
  });

  it("reports initial cursor position and character count", () => {
    const handleCursorChange = vi.fn();
    const testVal = "Hello World!";
    render(
      <CodeMirrorEditor
        value={testVal}
        onCursorChange={handleCursorChange}
      />
    );

    expect(handleCursorChange).toHaveBeenCalledWith(1, 1, testVal.length);
  });

  it("updates word wrap dynamically without crashing", () => {
    const { rerender, container } = render(
      <CodeMirrorEditor value="Wrap test" wordWrap={false} />
    );

    expect(container.querySelector(".cm-editor")).toBeDefined();

    rerender(<CodeMirrorEditor value="Wrap test" wordWrap={true} />);
    expect(container.querySelector(".cm-editor")).toBeDefined();
  });

  it("exposes imperative ref for finding, replacing, and jumping to lines", () => {
    const ref = createRef<CodeMirrorEditorRef>();
    const text = "Apple banana apple Cherry apple";
    render(<CodeMirrorEditor ref={ref} value={text} />);

    expect(ref.current).toBeDefined();

    // Match count (case insensitive)
    const info = ref.current!.getMatchesInfo("apple", false);
    expect(info.total).toBe(3);

    // Find next
    const firstFind = ref.current!.findNext("apple", false, true);
    expect(firstFind.current).toBe(1);

    const secondFind = ref.current!.findNext("apple", false, true);
    expect(secondFind.current).toBe(2);

    // Replace current
    const replaceResult = ref.current!.replace("apple", "orange", false, true);
    expect(replaceResult.total).toBe(2);

    // Replace all remaining
    const replacedCount = ref.current!.replaceAll("apple", "orange", false);
    expect(replacedCount).toBe(2);

    // Go to line
    const jumped = ref.current!.goToLine(1);
    expect(jumped).toBe(true);
  });
});
