import React, { useState, useEffect, useMemo } from "react";
import styles from "./RecentHistoryPage.module.css";
import {
  useRecycleBinStore,
  getDaysRemaining,
  RECYCLE_BIN_RETENTION_DAYS,
  RecycleBinItem,
} from "../../stores/recycleBinStore";

export interface RecycleBinPageProps {
  onBack: () => void;
  onRestoreNote: (item: RecycleBinItem) => void;
}

export const RecycleBinPage: React.FC<RecycleBinPageProps> = ({
  onBack,
  onRestoreNote,
}) => {
  const {
    items,
    restoreFromRecycleBin,
    deletePermanently,
    emptyRecycleBin,
    purgeExpired,
  } = useRecycleBinStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    purgeExpired();
  }, [purgeExpired]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleRestore = (id: string) => {
    const restored = restoreFromRecycleBin(id);
    if (restored) {
      onRestoreNote(restored);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
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
              <h1 className={styles.title}>Recycle Bin</h1>
              <p className={styles.subtitle}>
                Deleted notes are kept for {RECYCLE_BIN_RETENTION_DAYS} days before automatic permanent removal.
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={emptyRecycleBin}
            >
              Empty Recycle Bin
            </button>
          )}
        </header>

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
            placeholder="Search deleted notes in Recycle Bin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search Recycle Bin"
          />
        </div>

        <div className={styles.listCard}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Recycle Bin is empty.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const daysLeft = getDaysRemaining(item.deletedAt);
              return (
                <div key={item.id} className={styles.docRow}>
                  <div className={styles.docMainBtn} style={{ cursor: "default" }}>
                    <div className={styles.docIcon}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                        <path
                          fillRule="evenodd"
                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                        />
                      </svg>
                    </div>
                    <div className={styles.docMeta}>
                      <span className={styles.docTitle}>{item.title || "Untitled"}</span>
                      <span className={styles.docSub}>
                        Deleted {new Date(item.deletedAt).toLocaleDateString()} ·{" "}
                        {daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                      </span>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeClosed}`}>
                      {daysLeft}d remaining
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.reopenBtn}
                      onClick={() => handleRestore(item.id)}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => deletePermanently(item.id)}
                      title="Delete permanently"
                      aria-label={`Delete ${item.title || "note"} permanently`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
