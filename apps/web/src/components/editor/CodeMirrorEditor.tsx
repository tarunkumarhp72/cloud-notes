import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import styles from "./editor.module.css";

export interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, col: number, charCount: number) => void;
  wordWrap?: boolean;
  fontFamily?: string;
  fontSize?: number;
  readOnly?: boolean;
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  onCursorChange,
  wordWrap = false,
  fontFamily = "Consolas",
  fontSize = 14,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const wrapCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCursorChangeRef = useRef(onCursorChange);
  onCursorChangeRef.current = onCursorChange;

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
        keymap.of([...defaultKeymap, ...historyKeymap]),
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

  return (
    <div className={styles.editorWrapper}>
      <div
        ref={containerRef}
        className={styles.cmContainer}
        style={{
          fontFamily: `${fontFamily}, Consolas, monospace`,
          fontSize: `${fontSize}px`,
        }}
      />
    </div>
  );
};
