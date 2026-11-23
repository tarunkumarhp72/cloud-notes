import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import styles from "./editor.module.css";
import { sanitizeUrl } from "../../security/sanitize";

export interface TipTapEditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setParagraph: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  insertTable: (rows: number, cols: number) => void;
  setLink: (url: string) => void;
  clearFormatting: () => void;
  selectAll: () => void;
}

export interface TipTapEditorProps {
  value: string;
  onChange?: (markdown: string) => void;
  onCursorChange?: (line: number, col: number, charCount: number) => void;
  fontFamily?: string;
  fontSize?: number;
  readOnly?: boolean;
}

const getDocMarkdown = (ed: ReturnType<typeof useEditor>) => {
  if (!ed || ed.isDestroyed || !ed.state?.doc) return "";
  try {
    // @ts-expect-error tiptap-markdown injects storage.markdown
    return ed.storage.markdown?.getMarkdown() ?? ed.getText();
  } catch {
    return "";
  }
};

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  (
    {
      value,
      onChange,
      onCursorChange,
      fontFamily = "Segoe UI Variable",
      fontSize = 14,
      readOnly = false,
    },
    ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
          link: false,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
          validate: (href) => /^https?:\/\//i.test(href) || /^mailto:/i.test(href),
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown.configure({
          html: false,
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content: value,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const markdown = getDocMarkdown(editor);
        onChange?.(markdown);

        if (!editor.isDestroyed && editor.state?.doc && editor.state?.selection) {
          try {
            const pos = editor.state.selection.from;
            const textUpToCursor = editor.state.doc.textBetween(0, pos, "\n");
            const lines = textUpToCursor.split("\n");
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            const charCount = editor.state.doc.textContent.length;
            onCursorChange?.(line, col, charCount);
          } catch {
            // ignore
          }
        }
      },
      onSelectionUpdate: ({ editor }) => {
        if (!editor.isDestroyed && editor.state?.doc && editor.state?.selection) {
          try {
            const pos = editor.state.selection.from;
            const textUpToCursor = editor.state.doc.textBetween(0, pos, "\n");
            const lines = textUpToCursor.split("\n");
            const line = lines.length;
            const col = lines[lines.length - 1].length + 1;
            const charCount = editor.state.doc.textContent.length;
            onCursorChange?.(line, col, charCount);
          } catch {
            // ignore
          }
        }
      },
    });

    useImperativeHandle(ref, () => ({
      toggleBold: () => editor?.chain().focus().toggleBold().run(),
      toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
      toggleStrike: () => editor?.chain().focus().toggleStrike().run(),
      setHeading: (level) => editor?.chain().focus().toggleHeading({ level }).run(),
      setParagraph: () => editor?.chain().focus().setParagraph().run(),
      toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
      insertTable: (rows, cols) =>
        editor
          ?.chain()
          .focus()
          .insertTable({ rows, cols, withHeaderRow: true })
          .run(),
      setLink: (url) => {
        const cleanUrl = sanitizeUrl(url);
        if (cleanUrl) {
          editor?.chain().focus().setLink({ href: cleanUrl }).run();
        }
      },
      clearFormatting: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
      selectAll: () => editor?.chain().focus().selectAll().run(),
    }));

    // Synchronize external value changes if markdown differs
    useEffect(() => {
      if (!editor || editor.isDestroyed) return;
      const currentMarkdown = getDocMarkdown(editor);
      if (value !== currentMarkdown) {
        editor.commands.setContent(value, { emitUpdate: false });
      }
    }, [value, editor]);

    return (
      <div className={styles.editorWrapper}>
        <div
          className={styles.proseContainer}
          style={{
            fontFamily: `${fontFamily}, Segoe UI Variable, sans-serif`,
            fontSize: `${fontSize}px`,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

TipTapEditor.displayName = "TipTapEditor";
