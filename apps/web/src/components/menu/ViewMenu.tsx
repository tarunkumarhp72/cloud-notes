import React, { useState } from "react";
import styles from "./MenuDropdown.module.css";

export interface ViewMenuProps {
  isDesktop?: boolean;
  statusBarVisible?: boolean;
  wordWrap?: boolean;
  markdownMode?: boolean;
  zoomLevel?: number;
  onToggleStatusBar?: () => void;
  onToggleWordWrap?: () => void;
  onToggleMarkdown?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

const CheckIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 6L4.8 8.5L9.5 3.5" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 2L6.5 5L3.5 8" />
  </svg>
);

export const ViewMenu: React.FC<ViewMenuProps> = ({
  statusBarVisible = true,
  wordWrap = false,
  markdownMode = false,
  onToggleStatusBar,
  onToggleWordWrap,
  onToggleMarkdown,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const [isZoomSubmenuOpen, setIsZoomSubmenuOpen] = useState(false);

  return (
    <div className={styles.dropdown} role="menu" aria-label="View menu">
      {/* Zoom with Submenu */}
      <div
        className={styles.itemWrapper}
        onMouseEnter={() => setIsZoomSubmenuOpen(true)}
        onMouseLeave={() => setIsZoomSubmenuOpen(false)}
      >
        <button
          type="button"
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={isZoomSubmenuOpen}
          className={styles.item}
          onClick={() => setIsZoomSubmenuOpen((prev) => !prev)}
        >
          <span className={styles.label}>
            <span className={styles.gutter} />
            Zoom
          </span>
          <span className={styles.chevron}>
            <ChevronRightIcon />
          </span>
        </button>

        {isZoomSubmenuOpen && (
          <div
            className={styles.submenu}
            role="menu"
            aria-label="Zoom submenu"
            onMouseEnter={() => setIsZoomSubmenuOpen(true)}
          >
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                onZoomIn?.();
                setIsZoomSubmenuOpen(false);
              }}
            >
              <span className={styles.label}>
                <span className={styles.gutter} />
                Zoom in
              </span>
              <span className={styles.shortcut}>Ctrl+Plus</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                onZoomOut?.();
                setIsZoomSubmenuOpen(false);
              }}
            >
              <span className={styles.label}>
                <span className={styles.gutter} />
                Zoom out
              </span>
              <span className={styles.shortcut}>Ctrl+Minus</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                onResetZoom?.();
                setIsZoomSubmenuOpen(false);
              }}
            >
              <span className={styles.label}>
                <span className={styles.gutter} />
                Restore default zoom
              </span>
              <span className={styles.shortcut}>Ctrl+0</span>
            </button>
          </div>
        )}
      </div>

      {/* Status bar toggle */}
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={statusBarVisible}
        className={styles.item}
        onClick={onToggleStatusBar}
      >
        <span className={styles.label}>
          <span className={styles.gutter}>
            {statusBarVisible && <CheckIcon />}
          </span>
          Status bar
        </span>
      </button>

      {/* Word wrap toggle */}
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={wordWrap}
        className={styles.item}
        onClick={onToggleWordWrap}
      >
        <span className={styles.label}>
          <span className={styles.gutter}>
            {wordWrap && <CheckIcon />}
          </span>
          Word wrap
        </span>
      </button>

      {/* Markdown toggle */}
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={markdownMode}
        className={styles.item}
        onClick={onToggleMarkdown}
      >
        <span className={styles.label}>
          <span className={styles.gutter}>
            {markdownMode && <CheckIcon />}
          </span>
          Markdown
        </span>
        <span className={styles.chevron}>
          <ChevronRightIcon />
        </span>
      </button>
    </div>
  );
};
