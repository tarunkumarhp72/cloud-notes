import React from "react";
import styles from "./MenuDropdown.module.css";

export interface EditMenuProps {
  canUndo?: boolean;
  canRedo?: boolean;
  canCut?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  canDelete?: boolean;
  hasSelection?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onClearFormatting?: () => void;
  onSearchWithBing?: () => void;
  onFind?: () => void;
  onFindNext?: () => void;
  onFindPrevious?: () => void;
  onReplace?: () => void;
  onGoTo?: () => void;
  onSelectAll?: () => void;
  onTimeDate?: () => void;
  onFont?: () => void;
}

export const EditMenu: React.FC<EditMenuProps> = ({
  canUndo = true,
  canCut = false,
  canCopy = false,
  canPaste = true,
  canDelete = false,
  onUndo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onClearFormatting,
  onSearchWithBing,
  onFind,
  onFindNext,
  onFindPrevious,
  onReplace,
  onGoTo,
  onSelectAll,
  onTimeDate,
  onFont,
}) => {
  return (
    <div className={styles.dropdown} role="menu" aria-label="Edit menu">
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={!canUndo}
        onClick={onUndo}
      >
        <span className={styles.label}>Undo</span>
        <span className={styles.shortcut}>Ctrl+Z</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={!canCut}
        onClick={onCut}
      >
        <span className={styles.label}>Cut</span>
        <span className={styles.shortcut}>Ctrl+X</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={!canCopy}
        onClick={onCopy}
      >
        <span className={styles.label}>Copy</span>
        <span className={styles.shortcut}>Ctrl+C</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={!canPaste}
        onClick={onPaste}
      >
        <span className={styles.label}>Paste</span>
        <span className={styles.shortcut}>Ctrl+V</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        disabled={!canDelete}
        onClick={onDelete}
      >
        <span className={styles.label}>Delete</span>
        <span className={styles.shortcut}>Del</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onClearFormatting}
      >
        <span className={styles.label}>Clear formatting</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onSearchWithBing}
      >
        <span className={styles.label}>Search with Bing</span>
        <span className={styles.shortcut}>Ctrl+E</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onFind}
      >
        <span className={styles.label}>Find</span>
        <span className={styles.shortcut}>Ctrl+F</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onFindNext}
      >
        <span className={styles.label}>Find next</span>
        <span className={styles.shortcut}>F3</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onFindPrevious}
      >
        <span className={styles.label}>Find previous</span>
        <span className={styles.shortcut}>Shift+F3</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onReplace}
      >
        <span className={styles.label}>Replace</span>
        <span className={styles.shortcut}>Ctrl+H</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onGoTo}
      >
        <span className={styles.label}>Go to</span>
        <span className={styles.shortcut}>Ctrl+G</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onSelectAll}
      >
        <span className={styles.label}>Select all</span>
        <span className={styles.shortcut}>Ctrl+A</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onTimeDate}
      >
        <span className={styles.label}>Time/Date</span>
        <span className={styles.shortcut}>F5</span>
      </button>

      <hr className={styles.divider} />

      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={onFont}
      >
        <span className={styles.label}>Font</span>
      </button>
    </div>
  );
};
