import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import styles from "./editor.module.css";
import { sanitizeUrl } from "../../security/sanitize";
import type { HeadingLevel } from "../toolbar/HeadingDropdown";

export interface TipTapEditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setParagraph: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  indent?: () => void;
  outdent?: () => void;
  insertTable: (rows: number, cols: number) => void;
  setLink: (url: string, text?: string) => void;
  clearFormatting: () => void;
  selectAll: () => void;
}

export interface TipTapEditorProps {
  value: string;
  onChange?: (markdown: string) => void;
  onCursorChange?: (line: number, col: number, charCount: number) => void;
  onActiveFormatsChange?: (formats: {
    isBold: boolean;
    isItalic: boolean;
    isStrikethrough: boolean;
    headingLevel: HeadingLevel;
    canIndent: boolean;
    canOutdent: boolean;
  }) => void;
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
      onActiveFormatsChange,
      fontFamily = "Segoe UI Variable",
      fontSize = 14,
      readOnly = false,
    },
    ref
  ) => {
    const updateActiveFormats = (ed: NonNullable<ReturnType<typeof useEditor>>) => {
      if (ed.isDestroyed || !ed.state?.doc || !ed.state?.selection) return;
      try {
        const isBold = ed.isActive("bold");
        const isItalic = ed.isActive("italic");
        const isStrike = ed.isActive("strike");
        let headingLevel: HeadingLevel = "body";
        if (ed.isActive("heading", { level: 1 })) headingLevel = "title";
        else if (ed.isActive("heading", { level: 2 })) headingLevel = "subtitle";
        else if (ed.isActive("heading", { level: 3 })) headingLevel = "heading";
        else if (ed.isActive("heading", { level: 4 })) headingLevel = "subheading";
        else if (ed.isActive("heading", { level: 5 })) headingLevel = "section";
        else if (ed.isActive("heading", { level: 6 })) headingLevel = "subsection";

        const canIndent = Boolean(ed.can().sinkListItem("listItem"));
        const canOutdent = Boolean(ed.can().liftListItem("listItem"));

        onActiveFormatsChange?.({
          isBold,
          isItalic,
          isStrikethrough: isStrike,
          headingLevel,
          canIndent,
          canOutdent,
        });
      } catch {
        // ignore
      }
    };

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
        updateActiveFormats(editor);
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
        updateActiveFormats(editor);
      },
    });

    useImperativeHandle(ref, () => ({
      toggleBold: () => {
        editor?.chain().focus().toggleBold().run();
        if (editor) updateActiveFormats(editor);
      },
      toggleItalic: () => {
        editor?.chain().focus().toggleItalic().run();
        if (editor) updateActiveFormats(editor);
      },
      toggleStrike: () => {
        editor?.chain().focus().toggleStrike().run();
        if (editor) updateActiveFormats(editor);
      },
      setHeading: (level) => {
        editor?.chain().focus().toggleHeading({ level }).run();
        if (editor) updateActiveFormats(editor);
      },
      setParagraph: () => {
        editor?.chain().focus().setParagraph().run();
        if (editor) updateActiveFormats(editor);
      },
      toggleBulletList: () => {
        editor?.chain().focus().toggleBulletList().run();
        if (editor) updateActiveFormats(editor);
      },
      toggleOrderedList: () => {
        editor?.chain().focus().toggleOrderedList().run();
        if (editor) updateActiveFormats(editor);
      },
      indent: () => {
        editor?.chain().focus().sinkListItem("listItem").run();
        if (editor) updateActiveFormats(editor);
      },
      outdent: () => {
        editor?.chain().focus().liftListItem("listItem").run();
        if (editor) updateActiveFormats(editor);
      },
      insertTable: (rows, cols) =>
        editor
          ?.chain()
          .focus()
          .insertTable({ rows, cols, withHeaderRow: true })
          .run(),
      setLink: (url, text) => {
        const cleanUrl = sanitizeUrl(url);
        if (cleanUrl && editor) {
          if (editor.state.selection.empty) {
            const displayText = text || cleanUrl;
            editor.chain().focus().insertContent(`<a href="${cleanUrl}">${displayText}</a>`).run();
          } else {
            editor.chain().focus().setLink({ href: cleanUrl }).run();
          }
          updateActiveFormats(editor);
        }
      },
      clearFormatting: () => {
        editor?.chain().focus().unsetAllMarks().clearNodes().run();
        if (editor) updateActiveFormats(editor);
      },
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
