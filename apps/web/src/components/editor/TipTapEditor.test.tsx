import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { TipTapEditor, TipTapEditorRef } from "./TipTapEditor";
import { extractPlainTextFromMarkdown, normalizeMarkdown } from "./markdownSerializer";

describe("TipTapEditor Component & Markdown Serializer", () => {
  it("normalizes and extracts plain text from markdown correctly", () => {
    const md = "# Title\n\nThis is **bold** and *italic* text with a [link](https://example.com).";
    const plain = extractPlainTextFromMarkdown(md);
    expect(plain).toContain("Title");
    expect(plain).toContain("This is bold and italic text with a link.");

    expect(normalizeMarkdown("Line 1\r\nLine 2")).toBe("Line 1\nLine 2");
  });

  it("renders TipTap editor with initial markdown content", () => {
    const { container } = render(
      <TipTapEditor value="# Hello TipTap\n\nMarkdown rich text surface." />
    );

    const prose = container.querySelector(".tiptap");
    expect(prose).toBeDefined();
    expect(container.textContent).toContain("Hello TipTap");
    expect(container.textContent).toContain("Markdown rich text surface.");
  });

  it("exposes formatting methods on imperative ref", () => {
    const editorRef = createRef<TipTapEditorRef>();
    render(<TipTapEditor ref={editorRef} value="Sample text" />);

    expect(editorRef.current).toBeDefined();
    expect(typeof editorRef.current?.toggleBold).toBe("function");
    expect(typeof editorRef.current?.setHeading).toBe("function");
    expect(typeof editorRef.current?.insertTable).toBe("function");
    expect(typeof editorRef.current?.clearFormatting).toBe("function");
  });
});
