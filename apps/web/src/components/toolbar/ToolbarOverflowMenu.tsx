import React, { useState, useRef, useEffect } from "react";
import styles from "./Toolbar.module.css";
import { Tooltip } from "../ui/Tooltip";

export interface ToolbarOverflowMenuProps {
  isBold?: boolean;
  isItalic?: boolean;
  isStrikethrough?: boolean;
  canIndent?: boolean;
  canOutdent?: boolean;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleStrikethrough: () => void;
  onToggleBullet: () => void;
  onToggleNumber: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onInsertLink: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onClearFormatting: () => void;
  disabled?: boolean;
}

export const ToolbarOverflowMenu: React.FC<ToolbarOverflowMenuProps> = ({
  isBold = false,
  isItalic = false,
  isStrikethrough = false,
  canIndent = false,
  canOutdent = false,
  onToggleBold,
  onToggleItalic,
  onToggleStrikethrough,
  onToggleBullet,
  onToggleNumber,
  onIndent,
  onOutdent,
  onInsertLink,
  onInsertTable,
  onClearFormatting,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const runAction = (fn?: () => void) => {
    fn?.();
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`${styles.dropdownWrapper} ${styles.overflowToolTrigger}`}>
      <Tooltip content="More formatting" position="top">
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isOpen ? styles.active : ""}`}
          aria-label="More formatting"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{ width: "28px", justifyContent: "center" }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="8" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="13" cy="8" r="1.4" />
          </svg>
        </button>
      </Tooltip>

      {isOpen && (
        <div
          role="menu"
          aria-label="More formatting options"
          className={`${styles.dropdown} ${styles.overflowDropdown}`}
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isBold}
            className={`${styles.headingItem} ${styles.foldOnlyItem} ${isBold ? styles.selected : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleBold)}
          >
            <span style={{ fontWeight: 700, width: "20px", display: "inline-block" }}>B</span>
            <span>Bold</span>
          </button>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isItalic}
            className={`${styles.headingItem} ${styles.foldOnlyItem} ${isItalic ? styles.selected : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleItalic)}
          >
            <span style={{ fontStyle: "italic", fontFamily: "serif", width: "20px", display: "inline-block" }}>I</span>
            <span>Italic</span>
          </button>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isStrikethrough}
            className={`${styles.headingItem} ${isStrikethrough ? styles.selected : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleStrikethrough)}
          >
            <span style={{ textDecoration: "line-through", width: "20px", display: "inline-block" }}>S</span>
            <span>Strikethrough</span>
          </button>

          <div className={styles.menuDivider} />

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleBullet)}
          >
            <span>Bulleted list</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleNumber)}
          >
            <span>Numbered list</span>
          </button>

          {(canIndent || canOutdent) && (
            <>
              <button
                type="button"
                role="menuitem"
                className={styles.headingItem}
                disabled={!canIndent}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runAction(onIndent)}
              >
                <span>Increase indent</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.headingItem}
                disabled={!canOutdent}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runAction(onOutdent)}
              >
                <span>Decrease indent</span>
              </button>
            </>
          )}

          <div className={styles.menuDivider} />

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onInsertLink)}
          >
            <span>Insert link</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(() => onInsertTable(3, 3))}
          >
            <span>Insert table (3×3)</span>
          </button>

          <div className={styles.menuDivider} />

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onClearFormatting)}
          >
            <span>Clear formatting</span>
          </button>
        </div>
      )}
    </div>
  );
};
