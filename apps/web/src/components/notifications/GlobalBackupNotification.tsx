import React from "react";
import { useBackupProgressStore } from "../../stores/backupProgressStore";
import { getValidAccessToken } from "../../auth/tokenManager";
import styles from "./GlobalBackupNotification.module.css";

export interface GlobalBackupNotificationProps {
  accessToken?: string;
}

export const GlobalBackupNotification: React.FC<GlobalBackupNotificationProps> = ({ accessToken }) => {
  const {
    isVisible,
    isToastOnly,
    status,
    customTitle,
    phase,
    totalNotes,
    processedNotes,
    percent,
    errorMessage,
    dismiss,
    cancelBackup,
  } = useBackupProgressStore();

  if (!isVisible) return null;

  const handleCancel = async () => {
    const token = accessToken || (await getValidAccessToken());
    if (token) {
      await cancelBackup(token);
    } else {
      dismiss();
    }
  };

  const getStatusTitle = () => {
    if (customTitle) return customTitle;
    switch (status) {
      case "in_progress":
        return "Backup in progress";
      case "success":
        return "Backup completed";
      case "failed":
        return "Backup failed";
      case "cancelled":
        return "Backup cancelled";
      default:
        return "Google Drive Backup";
    }
  };

  const getProgressFillClass = () => {
    switch (status) {
      case "success":
        return `${styles.progressBarFill} ${styles.progressBarFillSuccess}`;
      case "failed":
        return `${styles.progressBarFill} ${styles.progressBarFillFailed}`;
      case "cancelled":
        return `${styles.progressBarFill} ${styles.progressBarFillCancelled}`;
      default:
        return styles.progressBarFill;
    }
  };

  return (
    <aside
      className={`${styles.container} ${isToastOnly ? styles.containerCompact : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Google Drive Backup Status"
    >
      <div className={`${styles.header} ${isToastOnly ? styles.headerCompact : ""}`}>
        <div className={styles.headerLeft}>
          <div className={styles.appIconBadge}>
            {/* Google Drive / Cloud Shield SVG icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <span className={styles.appTitle}>Google Drive Backup</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusPill}>
            {status === "in_progress" ? "In progress" : "Just now"}
          </span>
          <button
            className={styles.closeButton}
            onClick={dismiss}
            title="Close notification"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <h4 className={styles.title}>{getStatusTitle()}</h4>
        <div className={styles.subtitle}>
          <span>{phase || (status === "success" ? "All notes backed up safely" : "")}</span>
          {!isToastOnly && status === "in_progress" && (
            <span style={{ fontWeight: 600, color: "var(--accent-primary, #0078d4)" }}>{Math.round(percent)}%</span>
          )}
        </div>

        {!isToastOnly && totalNotes > 0 && status === "in_progress" && (
          <div className={styles.fileCount}>
            {processedNotes} / {totalNotes} files backed up
          </div>
        )}

        {!isToastOnly && (
          <div className={styles.progressBarContainer}>
            <div
              className={getProgressFillClass()}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        )}

        {errorMessage && (
          <div className={styles.errorMessage} role="alert">
            {errorMessage}
          </div>
        )}
      </div>

      {!isToastOnly && (
        <div className={styles.footer}>
          {status === "in_progress" ? (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className={styles.dismissBtn}
              onClick={dismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
