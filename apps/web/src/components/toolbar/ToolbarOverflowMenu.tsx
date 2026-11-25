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

const iconBoxStyle: React.CSSProperties = {
  width: "20px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "6px",
  flexShrink: 0,
};

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
            <span style={{ ...iconBoxStyle, fontWeight: 700, fontSize: "13px" }}>B</span>
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
            <span style={{ ...iconBoxStyle, fontStyle: "italic", fontFamily: "serif", fontSize: "13px" }}>I</span>
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
            <span style={{ ...iconBoxStyle, textDecoration: "line-through", fontSize: "13px" }}>S</span>
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
            <span style={iconBoxStyle} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="3" cy="4" r="1.2" />
                <path d="M6 3.5h8v1H6z" />
                <circle cx="3" cy="8" r="1.2" />
                <path d="M6 7.5h8v1H6z" />
                <circle cx="3" cy="12" r="1.2" />
                <path d="M6 11.5h8v1H6z" />
              </svg>
            </span>
            <span>Bulleted list</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(onToggleNumber)}
          >
            <span style={iconBoxStyle} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <text x="1.5" y="5.5" fontSize="5.5" fontFamily="sans-serif" fontWeight="600">1</text>
                <path d="M6 3.5h8v1H6z" />
                <text x="1.5" y="9.5" fontSize="5.5" fontFamily="sans-serif" fontWeight="600">2</text>
                <path d="M6 7.5h8v1H6z" />
                <text x="1.5" y="13.5" fontSize="5.5" fontFamily="sans-serif" fontWeight="600">3</text>
                <path d="M6 11.5h8v1H6z" />
              </svg>
            </span>
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
                <span style={iconBoxStyle} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 3h12v1.2H2zm4 3.5h8v1.2H6zm0 3.5h8v1.2H6zM2 13h12v1.2H2zM2 6l3 2-3 2V6z" />
                  </svg>
                </span>
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
                <span style={iconBoxStyle} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 3h12v1.2H2zm4 3.5h8v1.2H6zm0 3.5h8v1.2H6zM2 13h12v1.2H2zM5 6l-3 2 3 2V6z" />
                  </svg>
                </span>
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
            <span style={iconBoxStyle} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.88 9.12a3 3 0 0 1 0-4.24l2.12-2.12a3 3 0 0 1 4.24 4.24l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a1.5 1.5 0 1 0-2.12-2.12L7.94 5.94a1.5 1.5 0 0 0 0 2.12.75.75 0 0 1-1.06 1.06zm2.24-2.24a3 3 0 0 1 0 4.24l-2.12 2.12a3 3 0 1 1-4.24-4.24l1.06-1.06a.75.75 0 0 1 1.06 1.06L3.82 11.06a1.5 1.5 0 1 0 2.12 2.12l2.12-2.12a1.5 1.5 0 0 0 0-2.12.75.75 0 0 1 1.06-1.06z" />
              </svg>
            </span>
            <span>Insert link</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runAction(() => onInsertTable(3, 3))}
          >
            <span style={iconBoxStyle} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="2" y="2.5" width="12" height="11" rx="1" />
                <path d="M2 6h12M2 9.5h12M6 2.5v11M10 2.5v11" />
              </svg>
            </span>
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
            <span style={iconBoxStyle} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.2 2h2.5l3.2 9H7.3l-.7-2.1H3.3l-.7 2.1H1.1L3.2 2zm1.4 2.3L3.7 7.5h2.2l-.9-3.2z" />
                <path d="M10.8 7.2l3.5 3.5c.3.3.3.8 0 1.1l-2.2 2.2c-.3.3-.8.3-1.1 0l-3.5-3.5 3.3-3.3z" opacity="0.8" />
                <path d="M9 13.5h6v1H9z" />
              </svg>
            </span>
            <span>Clear formatting</span>
          </button>
        </div>
      )}
    </div>
  );
};
