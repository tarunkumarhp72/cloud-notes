import React, { useState, useEffect, useRef } from "react";
import styles from "./SaveNoteModal.module.css";

export interface SaveNoteModalProps {
  isOpen: boolean;
  initialTitle: string;
  isSaveAs?: boolean;
  isMarkdown?: boolean;
  onSave: (title: string, alsoDownload: boolean) => void;
  onCancel: () => void;
}

export const SaveNoteModal: React.FC<SaveNoteModalProps> = ({
  isOpen,
  initialTitle,
  isSaveAs = false,
  isMarkdown = true,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [alsoDownload, setAlsoDownload] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || "Untitled");
      setAlsoDownload(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
    }
  }, [isOpen, initialTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const trimmed = title.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onSave(trimmed, alsoDownload);
  };

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-note-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form className={styles.modal} onSubmit={handleSubmit}>
        <div className={styles.body}>
          <h2 id="save-note-modal-title" className={styles.title}>
            {isSaveAs ? "Save As" : "Save"}
          </h2>
          <p className={styles.subtitle}>
            Choose a name for your note. It will be saved to your Notepad library.
          </p>

          <label className={styles.label} htmlFor="save-note-title-input">
            Note name
          </label>
          <input
            ref={inputRef}
            id="save-note-title-input"
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            maxLength={120}
          />

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={alsoDownload}
              onChange={(e) => setAlsoDownload(e.target.checked)}
            />
            <span>
              Also download a copy ({isMarkdown ? ".md" : ".txt"})
            </span>
          </label>
        </div>

        <div className={styles.footer}>
          <button type="submit" className={styles.saveBtn} disabled={!trimmed}>
            Save
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
