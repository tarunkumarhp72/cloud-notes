import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, selectAll } from "@codemirror/commands";
import styles from "./editor.module.css";

export interface CodeMirrorEditorRef {
  findNext: (query: string, matchCase: boolean, wrapAround: boolean) => { current: number; total: number };
  findPrevious: (query: string, matchCase: boolean, wrapAround: boolean) => { current: number; total: number };
  replace: (query: string, replacement: string, matchCase: boolean, wrapAround: boolean) => { current: number; total: number };
  replaceAll: (query: string, replacement: string, matchCase: boolean) => number;
  getMatchesInfo: (query: string, matchCase: boolean) => { current: number; total: number };
  goToLine: (line: number) => boolean;
  getTotalLines: () => number;
  focus: () => void;
  selectAll: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  setHeading: (level: number) => void;
  setParagraph: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  insertLink: (text: string, url: string) => void;
  insertTable: (rows: number, cols: number) => void;
  clearFormatting: () => void;
}

export interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, col: number, charCount: number) => void;
  wordWrap?: boolean;
  fontFamily?: string;
  fontSize?: number;
  readOnly?: boolean;
}

const findAllMatches = (text: string, query: string, matchCase: boolean) => {
  if (!query) return [];
  const matches: Array<{ from: number; to: number }> = [];
  const src = matchCase ? text : text.toLowerCase();
  const q = matchCase ? query : query.toLowerCase();
  let index = 0;
  while ((index = src.indexOf(q, index)) !== -1) {
    matches.push({ from: index, to: index + q.length });
    index += q.length || 1;
  }
  return matches;
};

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(
  (
    {
      value,
      onChange,
      onCursorChange,
      wordWrap = false,
      fontFamily = "Consolas",
      fontSize = 14,
      readOnly = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const wrapCompartment = useRef(new Compartment());
    const themeCompartment = useRef(new Compartment());
    const readOnlyCompartment = useRef(new Compartment());

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onCursorChangeRef = useRef(onCursorChange);
    onCursorChangeRef.current = onCursorChange;

    useImperativeHandle(ref, () => ({
      focus: () => {
        viewRef.current?.focus();
      },
      getTotalLines: () => {
        return viewRef.current?.state.doc.lines ?? 1;
      },
      getMatchesInfo: (query: string, matchCase: boolean) => {
        const view = viewRef.current;
        if (!view || !query) return { current: 0, total: 0 };
        const docText = view.state.doc.toString();
        const matches = findAllMatches(docText, query, matchCase);
        if (matches.length === 0) return { current: 0, total: 0 };
        const curFrom = view.state.selection.main.from;
        const curTo = view.state.selection.main.to;
        const matchIndex = matches.findIndex((m) => m.from === curFrom && m.to === curTo);
        return { current: matchIndex !== -1 ? matchIndex + 1 : 1, total: matches.length };
      },
      findNext: (query: string, matchCase: boolean, wrapAround: boolean) => {
        const view = viewRef.current;
        if (!view || !query) return { current: 0, total: 0 };
        const docText = view.state.doc.toString();
        const matches = findAllMatches(docText, query, matchCase);
        if (matches.length === 0) return { current: 0, total: 0 };

        const curTo = view.state.selection.main.to;
        let target = matches.find((m) => m.from >= curTo);
        if (!target && wrapAround) {
          target = matches[0];
        }

        if (target) {
          view.dispatch({
            selection: { anchor: target.from, head: target.to },
            scrollIntoView: true,
          });
          const index = matches.indexOf(target);
          return { current: index + 1, total: matches.length };
        }
        return { current: 0, total: matches.length };
      },
      findPrevious: (query: string, matchCase: boolean, wrapAround: boolean) => {
        const view = viewRef.current;
        if (!view || !query) return { current: 0, total: 0 };
        const docText = view.state.doc.toString();
        const matches = findAllMatches(docText, query, matchCase);
        if (matches.length === 0) return { current: 0, total: 0 };

        const curFrom = view.state.selection.main.from;
        let target: { from: number; to: number } | undefined;
        for (let i = matches.length - 1; i >= 0; i--) {
          if (matches[i].to <= curFrom) {
            target = matches[i];
            break;
          }
        }
        if (!target && wrapAround) {
          target = matches[matches.length - 1];
        }

        if (target) {
          view.dispatch({
            selection: { anchor: target.from, head: target.to },
            scrollIntoView: true,
          });
          const index = matches.indexOf(target);
          return { current: index + 1, total: matches.length };
        }
        return { current: 0, total: matches.length };
      },
      replace: (query: string, replacement: string, matchCase: boolean, wrapAround: boolean) => {
        const view = viewRef.current;
        if (!view || !query) return { current: 0, total: 0 };
        const docText = view.state.doc.toString();
        const matches = findAllMatches(docText, query, matchCase);
        if (matches.length === 0) return { current: 0, total: 0 };

        const curFrom = view.state.selection.main.from;
        const curTo = view.state.selection.main.to;
        const currentMatch = matches.find((m) => m.from === curFrom && m.to === curTo);

        if (currentMatch) {
          view.dispatch({
            changes: { from: currentMatch.from, to: currentMatch.to, insert: replacement },
          });
          const newDoc = view.state.doc.toString();
          const nextMatches = findAllMatches(newDoc, query, matchCase);
          const nextFrom = currentMatch.from + replacement.length;
          let nextTarget = nextMatches.find((m) => m.from >= nextFrom);
          if (!nextTarget && wrapAround && nextMatches.length > 0) {
            nextTarget = nextMatches[0];
          }
          if (nextTarget) {
            view.dispatch({
              selection: { anchor: nextTarget.from, head: nextTarget.to },
              scrollIntoView: true,
            });
            return { current: nextMatches.indexOf(nextTarget) + 1, total: nextMatches.length };
          }
          return { current: 0, total: nextMatches.length };
        } else {
          // If not currently selecting a match, select next match first
          let target = matches.find((m) => m.from >= curTo);
          if (!target && wrapAround) {
            target = matches[0];
          }
          if (target) {
            view.dispatch({
              selection: { anchor: target.from, head: target.to },
              scrollIntoView: true,
            });
            return { current: matches.indexOf(target) + 1, total: matches.length };
          }
          return { current: 0, total: matches.length };
        }
      },
      replaceAll: (query: string, replacement: string, matchCase: boolean) => {
        const view = viewRef.current;
        if (!view || !query) return 0;
        const docText = view.state.doc.toString();
        const matches = findAllMatches(docText, query, matchCase);
        if (matches.length === 0) return 0;

        // Perform replacement from end to start
        const changes = matches.map((m) => ({
          from: m.from,
          to: m.to,
          insert: replacement,
        }));
        view.dispatch({ changes });
        return matches.length;
      },
      goToLine: (line: number) => {
        const view = viewRef.current;
        if (!view) return false;
        const totalLines = view.state.doc.lines;
        const targetLine = Math.max(1, Math.min(totalLines, line));
        const lineObj = view.state.doc.line(targetLine);
        view.dispatch({
          selection: { anchor: lineObj.from },
          scrollIntoView: true,
        });
        view.focus();
        return true;
      },
      selectAll: () => {
        const view = viewRef.current;
        if (!view) return;
        view.focus();
        selectAll(view);
      },
      toggleBold: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const text = view.state.sliceDoc(from, to);
        if (text.startsWith("**") && text.endsWith("**") && text.length >= 4) {
          const unwrapped = text.slice(2, -2);
          view.dispatch({
            changes: { from, to, insert: unwrapped },
            selection: { anchor: from, head: from + unwrapped.length },
          });
        } else {
          const prefix = view.state.sliceDoc(Math.max(0, from - 2), from);
          const suffix = view.state.sliceDoc(to, Math.min(view.state.doc.length, to + 2));
          if (prefix === "**" && suffix === "**") {
            view.dispatch({
              changes: [
                { from: from - 2, to: from, insert: "" },
                { from: to, to: to + 2, insert: "" },
              ],
              selection: { anchor: from - 2, head: to - 2 },
            });
          } else {
            const wrapped = `**${text}**`;
            view.dispatch({
              changes: { from, to, insert: wrapped },
              selection: from === to
                ? { anchor: from + 2, head: from + 2 }
                : { anchor: from, head: from + wrapped.length },
            });
          }
        }
        view.focus();
      },
      toggleItalic: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const text = view.state.sliceDoc(from, to);
        if (text.startsWith("*") && text.endsWith("*") && text.length >= 2 && !text.startsWith("**")) {
          const unwrapped = text.slice(1, -1);
          view.dispatch({
            changes: { from, to, insert: unwrapped },
            selection: { anchor: from, head: from + unwrapped.length },
          });
        } else {
          const prefix = view.state.sliceDoc(Math.max(0, from - 1), from);
          const suffix = view.state.sliceDoc(to, Math.min(view.state.doc.length, to + 1));
          if (prefix === "*" && suffix === "*" && view.state.sliceDoc(Math.max(0, from - 2), from) !== "**") {
            view.dispatch({
              changes: [
                { from: from - 1, to: from, insert: "" },
                { from: to, to: to + 1, insert: "" },
              ],
              selection: { anchor: from - 1, head: to - 1 },
            });
          } else {
            const wrapped = `*${text}*`;
            view.dispatch({
              changes: { from, to, insert: wrapped },
              selection: from === to
                ? { anchor: from + 1, head: from + 1 }
                : { anchor: from, head: from + wrapped.length },
            });
          }
        }
        view.focus();
      },
      toggleStrike: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const text = view.state.sliceDoc(from, to);
        if (text.startsWith("~~") && text.endsWith("~~") && text.length >= 4) {
          const unwrapped = text.slice(2, -2);
          view.dispatch({
            changes: { from, to, insert: unwrapped },
            selection: { anchor: from, head: from + unwrapped.length },
          });
        } else {
          const wrapped = `~~${text}~~`;
          view.dispatch({
            changes: { from, to, insert: wrapped },
            selection: from === to
              ? { anchor: from + 2, head: from + 2 }
              : { anchor: from, head: from + wrapped.length },
          });
        }
        view.focus();
      },
      setHeading: (level: number) => {
        const view = viewRef.current;
        if (!view) return;
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        const headerPrefix = "#".repeat(Math.max(1, Math.min(6, level))) + " ";
        const cleaned = line.text.replace(/^#{1,6}\s+/, "");
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: headerPrefix + cleaned },
        });
        view.focus();
      },
      setParagraph: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        const cleaned = line.text.replace(/^#{1,6}\s+/, "");
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: cleaned },
        });
        view.focus();
      },
      toggleBulletList: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        let newText: string;
        if (line.text.startsWith("- ")) {
          newText = line.text.slice(2);
        } else {
          newText = "- " + line.text.replace(/^(\d+\.\s+)/, "");
        }
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: newText },
        });
        view.focus();
      },
      toggleOrderedList: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from } = view.state.selection.main;
        const line = view.state.doc.lineAt(from);
        let newText: string;
        if (/^\d+\.\s+/.test(line.text)) {
          newText = line.text.replace(/^\d+\.\s+/, "");
        } else {
          newText = "1. " + line.text.replace(/^-\s+/, "");
        }
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: newText },
        });
        view.focus();
      },
      insertLink: (text: string, url: string) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.sliceDoc(from, to);
        const linkTitle = text || selectedText || "link";
        const markdownLink = `[${linkTitle}](${url})`;
        view.dispatch({
          changes: { from, to, insert: markdownLink },
          selection: { anchor: from + markdownLink.length },
        });
        view.focus();
      },
      insertTable: (rows: number, cols: number) => {
        const view = viewRef.current;
        if (!view) return;
        const r = Math.max(1, rows);
        const c = Math.max(1, cols);
        const headerRow = "| " + Array.from({ length: c }, (_, i) => `Header ${i + 1}`).join(" | ") + " |\n";
        const sepRow = "| " + Array.from({ length: c }, () => "---").join(" | ") + " |\n";
        const bodyRows = Array.from({ length: r }, () => "| " + Array.from({ length: c }, () => "Cell").join(" | ") + " |\n").join("");
        const table = "\n" + headerRow + sepRow + bodyRows + "\n";
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: table },
          selection: { anchor: from + table.length },
        });
        view.focus();
      },
      clearFormatting: () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const text = view.state.sliceDoc(from, to);
        const cleaned = text
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/~~(.*?)~~/g, "$1")
          .replace(/__(.*?)__/g, "$1")
          .replace(/_(.*?)_/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/^[-*+]\s+/gm, "")
          .replace(/^\d+\.\s+/gm, "");
        view.dispatch({
          changes: { from, to, insert: cleaned },
          selection: { anchor: from, head: from + cleaned.length },
        });
        view.focus();
      },
    }));

    // Initialize CodeMirror 6 View
    useEffect(() => {
      if (!containerRef.current) return;

      const baseTheme = EditorView.theme({
        "&": {
          fontFamily: `${fontFamily}, Consolas, monospace`,
          fontSize: `${fontSize}px`,
        },
      });

      const startState = EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          keymap.of([
            { key: "Mod-a", run: selectAll },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          wrapCompartment.current.of(wordWrap ? EditorView.lineWrapping : []),
          themeCompartment.current.of(baseTheme),
          readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && onChangeRef.current) {
              onChangeRef.current(update.state.doc.toString());
            }

            if (update.selectionSet || update.docChanged) {
              const pos = update.state.selection.main.head;
              const lineObj = update.state.doc.lineAt(pos);
              const line = lineObj.number;
              const col = pos - lineObj.from + 1;
              const charCount = update.state.doc.length;
              onCursorChangeRef.current?.(line, col, charCount);
            }
          }),
        ],
      });

      const view = new EditorView({
        state: startState,
        parent: containerRef.current,
      });

      viewRef.current = view;

      // Report initial cursor position
      onCursorChangeRef.current?.(1, 1, value.length);

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    // Update doc if external value changes and differs from editor doc
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const currentDoc = view.state.doc.toString();
      if (value !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
        });
      }
    }, [value]);

    // Dynamic Word Wrap update
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      view.dispatch({
        effects: wrapCompartment.current.reconfigure(
          wordWrap ? EditorView.lineWrapping : []
        ),
      });
    }, [wordWrap]);

    // Dynamic Font / Style update
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const updatedTheme = EditorView.theme({
        "&": {
          fontFamily: `${fontFamily}, Consolas, monospace`,
          fontSize: `${fontSize}px`,
        },
      });

      view.dispatch({
        effects: themeCompartment.current.reconfigure(updatedTheme),
      });
    }, [fontFamily, fontSize]);

    const handleContainerClick = (e: React.MouseEvent) => {
      if (viewRef.current && (e.target === e.currentTarget || e.target === containerRef.current)) {
        viewRef.current.focus();
      }
    };

    return (
      <div className={styles.editorWrapper} onClick={handleContainerClick}>
        <div
          ref={containerRef}
          className={styles.cmContainer}
          style={{
            fontFamily: `${fontFamily}, Consolas, monospace`,
            fontSize: `${fontSize}px`,
          }}
          onClick={handleContainerClick}
        />
      </div>
    );
  }
);

CodeMirrorEditor.displayName = "CodeMirrorEditor";
