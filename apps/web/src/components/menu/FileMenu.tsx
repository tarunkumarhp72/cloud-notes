import React from "react";
import styles from "./MenuDropdown.module.css";

export interface FileMenuProps {
  isDesktop?: boolean;
  isSignedIn?: boolean;
  onNewTab?: () => void;
  onNewWindow?: () => void;
  onNewMarkdownTab?: () => void;
  onOpen?: () => void;
  onRecent?: () => void;
  onRecycleBin?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onSaveAll?: () => void;
  onPageSetup?: () => void;
  onPrint?: () => void;
  onCloseTab?: () => void;
  onCloseWindow?: () => void;
  onExit?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  isDesktop = false,
  isSignedIn = false,
  onNewTab,
  onNewWindow,
  onNewMarkdownTab,
  onOpen,
  onRecent,
  onRecycleBin,
  onSave,
  onSaveAs,
  onSaveAll,
  onPageSetup,
  onPrint,
  onCloseTab,
  onCloseWindow,
  onExit,
}) => {
  return (
    <div className={styles.dropdown} role="menu" aria-label="File menu">
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onNewTab}
      >
        <span className={styles.label}>New tab</span>
        <span className={styles.shortcut}>Ctrl+N</span>
      </button>

      {isDesktop && (
        <button
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={onNewWindow}
        >
          <span className={styles.label}>New window</span>
          <span className={styles.shortcut}>Ctrl+Shift+N</span>
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onNewMarkdownTab}
      >
        <span className={styles.label}>New Markdown tab</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onOpen}
      >
        <span className={styles.label}>Open</span>
        <span className={styles.shortcut}>Ctrl+O</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onRecent}
      >
        <span className={styles.label}>Recent / History</span>
        <span className={styles.chevron}>›</span>
      </button>

      {isSignedIn && (
        <button
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={onRecycleBin}
        >
          <span className={styles.label}>Recycle Bin</span>
          <span className={styles.chevron}>›</span>
        </button>
      )}

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onSave}
      >
        <span className={styles.label}>Save</span>
        <span className={styles.shortcut}>Ctrl+S</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onSaveAs}
      >
        <span className={styles.label}>Save as</span>
        <span className={styles.shortcut}>Ctrl+Shift+S</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onSaveAll}
      >
        <span className={styles.label}>Save all</span>
        <span className={styles.shortcut}>Ctrl+Alt+S</span>
      </button>

      <hr className={styles.divider} />

      {isDesktop && (
        <button
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={onPageSetup}
        >
          <span className={styles.label}>Page setup</span>
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onPrint}
      >
        <span className={styles.label}>Print</span>
        <span className={styles.shortcut}>Ctrl+P</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onCloseTab}
      >
        <span className={styles.label}>Close tab</span>
        <span className={styles.shortcut}>Ctrl+W</span>
      </button>

      {isDesktop && (
        <>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={onCloseWindow}
          >
            <span className={styles.label}>Close window</span>
            <span className={styles.shortcut}>Ctrl+Shift+W</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={onExit}
          >
            <span className={styles.label}>Exit</span>
          </button>
        </>
      )}
    </div>
  );
};
