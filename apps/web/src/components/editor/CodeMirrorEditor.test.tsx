import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CodeMirrorEditor } from "./CodeMirrorEditor";

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
});
