import React from "react";
import type { SyncStatus } from "../../sync/syncEngine";
import styles from "./SyncIndicator.module.css";

export interface SyncIndicatorProps {
  status: SyncStatus;
  onRetry?: () => void;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, onRetry }) => {
  if (status === "saving") {
    return (
      <span className={styles.syncItem} role="status" aria-label="Saving changes to cloud">
        <svg
          className={styles.spinner}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
          <path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round" />
        </svg>
        <span>Saving</span>
      </span>
    );
  }

  if (status === "offline") {
    return (
      <span className={styles.syncItem} role="status" aria-label="Working offline">
        <svg
          className={styles.offlineIcon}
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2.5 5a3.5 3.5 0 0 1 6.88-1.002A4.5 4.5 0 0 1 15 8.5a4.5 4.5 0 0 1-4.5 4.5H3a3 3 0 0 1-.5-5.958V5z" opacity="0.4" />
          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Offline</span>
      </span>
    );
  }

  if (status === "sync_failed") {
    return (
      <button
        type="button"
        className={styles.clickable}
        onClick={onRetry}
        title="Sync failed. Click to retry."
        aria-label="Sync failed. Click to retry."
      >
        <svg
          className={styles.failedIcon}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7.25a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
        </svg>
        <span>Sync failed</span>
      </button>
    );
  }

  // "saved" or "idle"
  return (
    <span className={styles.syncItem} role="status" aria-label="All changes saved to cloud">
      <svg
        className={styles.savedIcon}
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
      </svg>
      <span>Saved</span>
    </span>
  );
};
