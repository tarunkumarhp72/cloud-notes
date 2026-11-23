import React, { useState, useRef, useEffect } from "react";
import styles from "./CollapsedMenu.module.css";

export type CollapsedCategory = "file" | "edit" | "view";

export interface CollapsedMenuProps {
  renderFileDropdown?: () => React.ReactNode;
  renderEditDropdown?: () => React.ReactNode;
  renderViewDropdown?: () => React.ReactNode;
}

export const CollapsedMenu: React.FC<CollapsedMenuProps> = ({
  renderFileDropdown,
  renderEditDropdown,
  renderViewDropdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CollapsedCategory>("file");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.menuWrapper} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`${styles.menuBtn} ${isOpen ? styles.active : ""}`}
        aria-label="Application menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>Menu</span>
        <span aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownFlyout} role="dialog" aria-label="Mobile Navigation Menu">
          {/* Grouped Hierarchical Categories */}
          <div className={styles.categoryNav} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "file"}
              className={`${styles.categoryBtn} ${activeCategory === "file" ? styles.activeCategory : ""}`}
              onClick={() => setActiveCategory("file")}
            >
              File
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "edit"}
              className={`${styles.categoryBtn} ${activeCategory === "edit" ? styles.activeCategory : ""}`}
              onClick={() => setActiveCategory("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "view"}
              className={`${styles.categoryBtn} ${activeCategory === "view" ? styles.activeCategory : ""}`}
              onClick={() => setActiveCategory("view")}
            >
              View
            </button>
          </div>

          {/* Sub-item Content Container */}
          <div className={styles.subItemWrapper}>
            {activeCategory === "file" && renderFileDropdown?.()}
            {activeCategory === "edit" && renderEditDropdown?.()}
            {activeCategory === "view" && renderViewDropdown?.()}
          </div>
        </div>
      )}
    </div>
  );
};
