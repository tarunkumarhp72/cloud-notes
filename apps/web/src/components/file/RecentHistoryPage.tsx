import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./RecentHistoryPage.module.css";
import { useRecentHistoryStore, RecentHistoryItem } from "../../stores/recentHistoryStore";
import { defaultNotesLoader, SavedNoteSummary } from "./OpenNotesDialog";

export interface RecentHistoryPageProps {
  mode?: "history" | "open";
  onBack: () => void;
  onNewDocument: () => void;
  onOpenFileFromDisk: (file: File) => void;
  onReopenNote: (note: {
    id: string;
    title: string;
    content: string;
    isMarkdown: boolean;
    isCustomTitle: boolean;
  }) => void;
  onDeleteNote?: (id: string) => Promise<void> | void;
  onClearAll?: () => Promise<void> | void;
  notesLoader?: () => Promise<SavedNoteSummary[]>;
}

type FilterMode = "all" | "closed" | "saved";

export const RecentHistoryPage: React.FC<RecentHistoryPageProps> = ({
  mode = "history",
  onBack,
  onNewDocument,
  onOpenFileFromDisk,
  onReopenNote,
  onDeleteNote,
  onClearAll,
  notesLoader = defaultNotesLoader,
}) => {
  const { items: historyItems, removeHistoryItem, clearHistory } = useRecentHistoryStore();
  const [savedNotes, setSavedNotes] = useState<SavedNoteSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(mode === "open" ? "saved" : "all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilterMode(mode === "open" ? "saved" : "all");
  }, [mode]);

  useEffect(() => {
    notesLoader()
      .then((data) => setSavedNotes(data))
      .catch(() => setSavedNotes([]));
  }, [notesLoader]);

  const combinedItems = useMemo(() => {
    const map = new Map<string, RecentHistoryItem>();

    for (const item of historyItems) {
      map.set(item.id, item);
    }

    for (const saved of savedNotes) {
      if (!map.has(saved.id)) {
        map.set(saved.id, {
          id: saved.id,
          title: saved.title,
          content: saved.content,
          isMarkdown: saved.isMarkdown,
          status: "saved",
          timestamp: saved.updatedAt || new Date().toISOString(),
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [historyItems, savedNotes]);

  const filteredItems = useMemo(() => {
    return combinedItems.filter((item) => {
      if (filterMode !== "all" && item.status !== filterMode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedItems, filterMode, searchQuery]);

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDeleteItem = async (id: string) => {
    removeHistoryItem(id);
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    if (onDeleteNote) {
      await onDeleteNote(id);
    }
  };

  const handleClearAll = async () => {
    clearHistory();
    setSavedNotes([]);
    if (onClearAll) {
      await onClearAll();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
              aria-label="Back to editor"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M12.5 8a.5.5 0 0 1-.5.5H4.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L4.707 7.5H12a.5.5 0 0 1 .5.5z" />
              </svg>
            </button>
            <div>
              <h1 className={styles.title}>
                {mode === "open" ? "Open Document" : "Recent & History"}
              </h1>
              <p className={styles.subtitle}>
                {mode === "open"
                  ? "Browse your saved notes or import a file from your computer."
                  : "Reopen closed tabs, manage saved notes, or import files from your computer."}
              </p>
            </div>
          </div>
          <span className={styles.savedStatus}>
            {combinedItems.length} {combinedItems.length === 1 ? "note" : "notes"}
          </span>
        </header>

        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search your documents and closed tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search recent documents"
          />
        </div>

        {/* Quick Actions Grid */}
        <div className={styles.quickGrid}>
          <button type="button" className={styles.quickCard} onClick={onNewDocument}>
            <div className={styles.quickIcon}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" />
              </svg>
            </div>
            <div className={styles.quickText}>
              <strong>New Document</strong>
              <span>Create a new note</span>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onOpenFileFromDisk(file);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            className={`${styles.quickCard} ${mode === "open" ? styles.quickCardPrimary : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.quickIcon}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zM2.5 3a.5.5 0 0 0-.5.5V6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5zM14 7H2v5.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V7z" />
              </svg>
            </div>
            <div className={styles.quickText}>
              <strong>Open File from Computer</strong>
              <span>Import .txt or .md from disk</span>
            </div>
          </button>
        </div>

        {/* Section Header + Filter Pills */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {mode === "open" ? "Your Documents" : "Recent Documents"}
          </h2>
          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterPill} ${filterMode === "all" ? styles.filterActive : ""}`}
              onClick={() => setFilterMode("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${filterMode === "closed" ? styles.filterActive : ""}`}
              onClick={() => setFilterMode("closed")}
            >
              Recently Closed
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${filterMode === "saved" ? styles.filterActive : ""}`}
              onClick={() => setFilterMode("saved")}
            >
              Saved Notes
            </button>
            {combinedItems.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClearAll}
              >
                Clear history
              </button>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className={styles.listCard}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No recent or closed notes found.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className={styles.docRow}>
                <button
                  type="button"
                  className={styles.docMainBtn}
                  onClick={() =>
                    onReopenNote({
                      id: item.id,
                      title: item.title,
                      content: item.content,
                      isMarkdown: item.isMarkdown,
                      isCustomTitle: item.status === "saved",
                    })
                  }
                >
                  <div className={styles.docIcon}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z" />
                      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
                    </svg>
                  </div>
                  <div className={styles.docMeta}>
                    <span className={styles.docTitle}>{item.title || "Untitled"}</span>
                    <span className={styles.docSub}>
                      {item.status === "closed" ? "Closed" : "Saved"} · {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      item.status === "closed" ? styles.badgeClosed : styles.badgeSaved
                    }`}
                  >
                    {item.status === "closed" ? "Closed Tab" : item.isMarkdown ? "Markdown" : "Plain text"}
                  </span>
                </button>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.reopenBtn}
                    onClick={() =>
                      onReopenNote({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        isMarkdown: item.isMarkdown,
                        isCustomTitle: item.status === "saved",
                      })
                    }
                  >
                    {mode === "open" ? "Open" : "Reopen"}
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete note"
                    aria-label={`Delete ${item.title || "note"}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
