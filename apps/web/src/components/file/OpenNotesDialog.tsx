import React, { useState, useEffect, useRef } from "react";
import { listNotes } from "@notepad/core";
import styles from "./OpenNotesDialog.module.css";

export interface SavedNoteSummary {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  updatedAt?: string;
}

export interface OpenNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: SavedNoteSummary) => void;
  onOpenFileFromDisk: (file: File) => void;
  notesLoader?: () => Promise<SavedNoteSummary[]>;
}

export const defaultNotesLoader = async (): Promise<SavedNoteSummary[]> => {
  try {
    const rawNotes = await listNotes();
    return rawNotes.map((n) => {
      let title = "Untitled";
      let content = "";
      let isMarkdown = false;
      try {
        const parsed = JSON.parse(n.encryptedEnvelope);
        title = parsed.title || "Untitled";
        content = parsed.content || "";
        isMarkdown = !!parsed.isMarkdown;
      } catch {
        content = n.encryptedEnvelope;
      }

      return {
        id: n.id,
        title,
        content,
        isMarkdown,
        updatedAt: n.clientUpdatedAt,
      };
    });
  } catch (err) {
    console.error("Failed to load notes from IndexedDB:", err);
    return [];
  }
};

export const OpenNotesDialog: React.FC<OpenNotesDialogProps> = ({
  isOpen,
  onClose,
  onSelectNote,
  onOpenFileFromDisk,
  notesLoader = defaultNotesLoader,
}) => {
  const [notes, setNotes] = useState<SavedNoteSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      notesLoader()
        .then((data) => setNotes(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, notesLoader]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onOpenFileFromDisk(files[0]);
      e.target.value = "";
      onClose();
    }
  };

  return (
    <div
      className={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-dialog-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="open-dialog-title" className={styles.title}>
            Open note
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search saved notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search saved notes"
        />

        <div className={styles.notesList}>
          {loading ? (
            <div className={styles.emptyState}>Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" opacity={0.4}>
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <span>{notes.length === 0 ? "No saved notes found" : "No matching notes"}</span>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={styles.noteItem}
                onClick={() => {
                  onSelectNote(note);
                  onClose();
                }}
              >
                <div className={styles.noteInfo}>
                  <span className={styles.noteTitle}>{note.title}</span>
                  {note.updatedAt && (
                    <span className={styles.noteDate}>
                      {new Date(note.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <span className={styles.noteBadge}>
                  {note.isMarkdown ? "Markdown" : "Plain text"}
                </span>
              </button>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V10.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
            </svg>
            Open file from computer...
          </button>

          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
