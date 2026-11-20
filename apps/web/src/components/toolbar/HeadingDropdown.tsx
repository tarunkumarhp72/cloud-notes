import React, { useState, useRef, useEffect } from "react";
import styles from "./Toolbar.module.css";

export type HeadingLevel =
  | "title"
  | "subtitle"
  | "heading"
  | "subheading"
  | "section"
  | "subsection"
  | "body";

export interface HeadingOption {
  id: HeadingLevel;
  label: string;
  shortLabel: string;
  fontSize: string;
  fontWeight: number | string;
}

export const HEADING_OPTIONS: HeadingOption[] = [
  { id: "title", label: "Title", shortLabel: "H1", fontSize: "22px", fontWeight: 600 },
  { id: "subtitle", label: "Subtitle", shortLabel: "H2", fontSize: "18px", fontWeight: 600 },
  { id: "heading", label: "Heading", shortLabel: "H3", fontSize: "16px", fontWeight: 600 },
  { id: "subheading", label: "Subheading", shortLabel: "H4", fontSize: "14px", fontWeight: 600 },
  { id: "section", label: "Section", shortLabel: "H5", fontSize: "13px", fontWeight: 600 },
  { id: "subsection", label: "Subsection", shortLabel: "H6", fontSize: "12px", fontWeight: 600 },
  { id: "body", label: "Body", shortLabel: "Body", fontSize: "13px", fontWeight: 400 },
];

export interface HeadingDropdownProps {
  activeLevel?: HeadingLevel;
  onSelectLevel?: (level: HeadingLevel) => void;
  disabled?: boolean;
}

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

export const HeadingDropdown: React.FC<HeadingDropdownProps> = ({
  activeLevel = "title",
  onSelectLevel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    HEADING_OPTIONS.find((opt) => opt.id === activeLevel) || HEADING_OPTIONS[0];

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

  const handleSelect = (level: HeadingLevel) => {
    onSelectLevel?.(level);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownWrapper} ref={containerRef}>
      <button
        type="button"
        className={`${styles.toolbarBtn} ${isOpen ? styles.active : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Style"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{activeOption.shortLabel}</span>
        <span className={styles.chevron}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu" aria-label="Style menu">
          {HEADING_OPTIONS.map((opt) => {
            const isSelected = opt.id === activeLevel;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                className={`${styles.headingItem} ${isSelected ? styles.selected : ""}`}
                onClick={() => handleSelect(opt.id)}
              >
                {isSelected && <span className={styles.activeIndicator} aria-hidden="true" />}
                <span
                  style={{
                    fontSize: opt.fontSize,
                    fontWeight: opt.fontWeight,
                  }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
