import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { createRef } from "react";
import { TipTapEditor, TipTapEditorRef } from "./TipTapEditor";
import { extractPlainTextFromMarkdown, normalizeMarkdown } from "./markdownSerializer";
import styles from "./editor.module.css";

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
    expect(typeof editorRef.current?.toggleUnderline).toBe("function");
    expect(typeof editorRef.current?.setHeading).toBe("function");
    expect(typeof editorRef.current?.insertTable).toBe("function");
    expect(typeof editorRef.current?.clearFormatting).toBe("function");
  });

  it("applies noWrap class when wordWrap is false and removes it when true", () => {
    const { container, rerender } = render(
      <TipTapEditor value="Wrap test" wordWrap={false} />
    );
    expect(container.querySelector(`.${styles.noWrap}`)).not.toBeNull();

    rerender(<TipTapEditor value="Wrap test" wordWrap={true} />);
    expect(container.querySelector(`.${styles.noWrap}`)).toBeNull();
  });

  it("applies spellcheck and autocorrect attributes correctly", () => {
    const { container, rerender } = render(
      <TipTapEditor value="Spellcheck test" spellCheck={true} autoCorrect={true} />
    );
    const tiptap = container.querySelector(".tiptap");
    expect(tiptap?.getAttribute("spellcheck")).toBe("true");
    expect(tiptap?.getAttribute("autocorrect")).toBe("on");

    rerender(
      <TipTapEditor value="Spellcheck test" spellCheck={false} autoCorrect={false} />
    );
    expect(tiptap?.getAttribute("spellcheck")).toBe("false");
    expect(tiptap?.getAttribute("autocorrect")).toBe("off");
  });

  it("inserts a clickable link node with display text instead of escaped HTML", () => {
    const editorRef = createRef<TipTapEditorRef>();
    const onChange = vi.fn();
    const { container } = render(
      <TipTapEditor ref={editorRef} value="" onChange={onChange} />
    );

    act(() => {
      editorRef.current?.setLink("http://localhost:3000/", "localhost");
    });

    const anchor = container.querySelector(".tiptap a");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("http://localhost:3000/");
    expect(anchor?.textContent).toBe("localhost");
    expect(container.textContent).not.toContain("<a ");
    expect(onChange).toHaveBeenCalledWith("[localhost](http://localhost:3000/)");
  });
});
