import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./RecentHistoryPage.module.css";
import { useRecentHistoryStore, RecentHistoryItem } from "../../stores/recentHistoryStore";
import { defaultNotesLoader, SavedNoteSummary } from "./OpenNotesDialog";

export interface RecentHistoryPageProps {
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
  notesLoader?: () => Promise<SavedNoteSummary[]>;
}

type FilterMode = "all" | "closed" | "saved";

export const RecentHistoryPage: React.FC<RecentHistoryPageProps> = ({
  onBack,
  onNewDocument,
  onOpenFileFromDisk,
  onReopenNote,
  notesLoader = defaultNotesLoader,
}) => {
  const { items: historyItems, removeHistoryItem, clearHistory } = useRecentHistoryStore();
  const [savedNotes, setSavedNotes] = useState<SavedNoteSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              <h1 className={styles.title}>Recent & History</h1>
              <p className={styles.subtitle}>
                Reopen closed tabs, manage saved notes, or import files from your computer.
              </p>
            </div>
          </div>
          <span className={styles.savedStatus}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            All changes saved
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
            className={styles.quickCard}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.quickIcon}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M.5 3l.04.87a1.99 1.99 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2z" />
              </svg>
            </div>
            <div className={styles.quickText}>
              <strong>Open File</strong>
              <span>Import from computer</span>
            </div>
          </button>
        </div>

        {/* Section Header + Filter Pills */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Documents</h2>
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
            {historyItems.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearHistory}
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
                    Reopen
                  </button>
                  {historyItems.some((h) => h.id === item.id) && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeHistoryItem(item.id)}
                      title="Remove from history"
                      aria-label={`Remove ${item.title} from history`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
