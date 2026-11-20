import React from "react";
import styles from "./StatusBar.module.css";

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
        <button
          type="button"
          className={styles.clickableItem}
          onClick={onGoToClick}
          title="Go to line (Ctrl+G)"
          aria-label={`Line ${line}, Column ${col}`}
        >
          Ln {line}, Col {col}
        </button>
        <span className={styles.staticItem}>{charactersLabel}</span>
      </div>

      <div className={styles.rightGroup}>
        <span className={styles.staticItem}>{modeLabel}</span>
        <button
          type="button"
          className={styles.clickableItem}
          onClick={onZoomClick}
          title="Zoom level"
          aria-label={`Zoom ${zoomLevel}%`}
        >
          {zoomLevel}%
        </button>
        <span className={styles.staticItem}>{lineEnding}</span>
        <span className={styles.staticItem}>{encoding}</span>
      </div>
    </footer>
  );
};
