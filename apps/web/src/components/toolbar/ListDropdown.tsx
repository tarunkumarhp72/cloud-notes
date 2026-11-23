import React, { useState, useRef, useEffect } from "react";
import styles from "./Toolbar.module.css";
import { Tooltip } from "../ui/Tooltip";

export interface ListDropdownProps {
  activeList?: "bullet" | "number" | null;
  canIndent?: boolean;
  canOutdent?: boolean;
  onToggleBullet?: () => void;
  onToggleNumber?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  disabled?: boolean;
}

const BulletListIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="2.5" cy="4" r="1.5" />
    <path d="M6 3.25h8.5v1.5H6z" />
    <circle cx="2.5" cy="8" r="1.5" />
    <path d="M6 7.25h8.5v1.5H6z" />
    <circle cx="2.5" cy="12" r="1.5" />
    <path d="M6 11.25h8.5v1.5H6z" />
  </svg>
);

const ChevronDownIcon: React.FC = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 3.5L5 6.5L8 3.5" />
  </svg>
);

export const ListDropdown: React.FC<ListDropdownProps> = ({
  canIndent = false,
  canOutdent = false,
  onToggleBullet,
  onToggleNumber,
  onIndent,
  onOutdent,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className={styles.dropdownWrapper} ref={containerRef}>
      <Tooltip content="Lists" position="top">
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isOpen ? styles.active : ""}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Lists"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <BulletListIcon />
          <span className={styles.chevron}>
            <ChevronDownIcon />
          </span>
        </button>
      </Tooltip>

      {isOpen && (
        <div className={styles.dropdown} role="menu" aria-label="Lists menu" style={{ minWidth: "150px" }}>
          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onClick={() => {
              onToggleBullet?.();
              setIsOpen(false);
            }}
          >
            <span style={{ fontSize: "13px" }}>Bulleted list</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            onClick={() => {
              onToggleNumber?.();
              setIsOpen(false);
            }}
          >
            <span style={{ fontSize: "13px" }}>Numbered list</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            disabled={!canIndent}
            style={{ opacity: canIndent ? 1 : 0.4, cursor: canIndent ? "pointer" : "default" }}
            onClick={() => {
              if (canIndent) {
                onIndent?.();
                setIsOpen(false);
              }
            }}
          >
            <span style={{ fontSize: "13px" }}>Increase indent</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.headingItem}
            disabled={!canOutdent}
            style={{ opacity: canOutdent ? 1 : 0.4, cursor: canOutdent ? "pointer" : "default" }}
            onClick={() => {
              if (canOutdent) {
                onOutdent?.();
                setIsOpen(false);
              }
            }}
          >
            <span style={{ fontSize: "13px" }}>Decrease indent</span>
          </button>
        </div>
      )}
    </div>
  );
};
