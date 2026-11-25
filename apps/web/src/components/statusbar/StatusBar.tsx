import React from "react";
import { SyncIndicator } from "./SyncIndicator";
import type { SyncStatus } from "../../sync/syncEngine";
import styles from "./StatusBar.module.css";
import { Tooltip } from "../ui/Tooltip";

export interface StatusBarProps {
  line: number;
  col: number;
  charCount: number;
  selectedCount?: number;
  mode?: "plain" | "markdown";
  zoomLevel?: number;
  lineEnding?: "Windows (CRLF)" | "Unix (LF)" | "Macintosh (CR)";
  encoding?: string;
  onGoToClick?: () => void;
  onZoomClick?: () => void;
  visible?: boolean;
  syncStatus?: SyncStatus;
  onRetrySync?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  line = 1,
  col = 1,
  charCount = 0,
  selectedCount = 0,
  mode = "plain",
  zoomLevel = 100,
  lineEnding = "Windows (CRLF)",
  encoding = "UTF-8",
  onGoToClick,
  onZoomClick,
  visible = true,
  syncStatus = "saved",
  onRetrySync,
}) => {
  if (!visible) return null;

  const charactersLabel =
    selectedCount > 0
      ? `${selectedCount} selected, ${charCount} characters`
      : `${charCount} characters`;

  const modeLabel = mode === "markdown" ? "Markdown" : "Plain text";

  return (
    <footer className={styles.statusBar} role="status" aria-label="Status bar">
      <div className={styles.leftGroup}>
        <Tooltip content="Go to line (Ctrl+G)" position="top" align="start">
          <button
            type="button"
            className={styles.clickableItem}
            onClick={onGoToClick}
            aria-label={`Line ${line}, Column ${col}`}
          >
            Ln {line}, Col {col}
          </button>
        </Tooltip>
        <span className={styles.staticItem}>{charactersLabel}</span>
      </div>

      <div className={styles.rightGroup}>
        {syncStatus && <SyncIndicator status={syncStatus} onRetry={onRetrySync} />}
        <span className={styles.staticItem}>{modeLabel}</span>
        <Tooltip content="Zoom" position="top">
          <button
            type="button"
            className={styles.clickableItem}
            onClick={onZoomClick}
            aria-label={`Zoom ${zoomLevel}%`}
          >
            {zoomLevel}%
          </button>
        </Tooltip>
        <span className={`${styles.staticItem} ${styles.secondaryMeta}`}>{lineEnding}</span>
        <span className={`${styles.staticItem} ${styles.secondaryMeta}`}>{encoding}</span>
      </div>
    </footer>
  );
};
