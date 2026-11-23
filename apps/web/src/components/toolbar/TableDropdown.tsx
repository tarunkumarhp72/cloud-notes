import React, { useState, useRef, useEffect } from "react";
import styles from "./TableDropdown.module.css";
import toolbarStyles from "./Toolbar.module.css";
import { Tooltip } from "../ui/Tooltip";

export interface TableDropdownProps {
  onInsertTable?: (rows: number, cols: number) => void;
  canEditTable?: boolean;
  disabled?: boolean;
}

const TableIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M2.5 2h11c.28 0 .5.22.5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11c0-.28.22-.5.5-.5zm.5 4.5v3h4.5v-3H3zm5.5 0v3H13v-3H8.5zm4.5-1V3H8.5v2.5H13zM7.5 3H3v2.5h4.5V3zm-4.5 7.5V13h4.5v-2.5H3zm5.5 2.5H13v-2.5H8.5V13z" />
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

const ChevronRightIcon: React.FC = () => (
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
    <path d="M3.5 2L6.5 5L3.5 8" />
  </svg>
);

export const TableDropdown: React.FC<TableDropdownProps> = ({
  onInsertTable,
  canEditTable = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);
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

  const handleCellClick = (r: number, c: number) => {
    onInsertTable?.(r, c);
    setIsOpen(false);
  };

  return (
    <div className={toolbarStyles.dropdownWrapper} ref={containerRef}>
      <Tooltip content="Insert table" position="top">
        <button
          type="button"
          className={`${toolbarStyles.toolbarBtn} ${isOpen ? toolbarStyles.active : ""}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Table"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <TableIcon />
          <span className={toolbarStyles.chevron}>
            <ChevronDownIcon />
          </span>
        </button>
      </Tooltip>

      {isOpen && (
        <div className={styles.dropdown} role="menu" aria-label="Table menu">
          <div className={styles.gridHeader}>
            {hoveredRow > 0 && hoveredCol > 0
              ? `${hoveredRow} × ${hoveredCol} Table`
              : "Insert table"}
          </div>

          <div
            className={styles.grid}
            onMouseLeave={() => {
              setHoveredRow(0);
              setHoveredCol(0);
            }}
          >
            {Array.from({ length: 5 }, (_, rowIndex) =>
              Array.from({ length: 5 }, (_, colIndex) => {
                const r = rowIndex + 1;
                const c = colIndex + 1;
                const isHighlighted = r <= hoveredRow && c <= hoveredCol;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`${styles.cell} ${isHighlighted ? styles.cellHighlighted : ""}`}
                    aria-label={`${r} by ${c} table`}
                    onMouseEnter={() => {
                      setHoveredRow(r);
                      setHoveredCol(c);
                    }}
                    onClick={() => handleCellClick(r, c)}
                  />
                );
              })
            )}
          </div>

          <hr className={styles.divider} />

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => handleCellClick(2, 2)}
          >
            Insert table
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled={!canEditTable}
          >
            <span>Edit table</span>
            <span className={styles.chevron}>
              <ChevronRightIcon />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
