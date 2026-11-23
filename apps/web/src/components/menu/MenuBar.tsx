import React, { useState, useRef, useEffect } from "react";
import styles from "./MenuBar.module.css";
import { CollapsedMenu } from "./CollapsedMenu";

export type ActiveMenu = "file" | "edit" | "view" | null;

export interface MenuBarProps {
  activeMenu?: ActiveMenu;
  onMenuChange?: (menu: ActiveMenu) => void;
  renderFileDropdown?: () => React.ReactNode;
  renderEditDropdown?: () => React.ReactNode;
  renderViewDropdown?: () => React.ReactNode;
  childrenToolbar?: React.ReactNode;
  childrenRight?: React.ReactNode;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  activeMenu: controlledActiveMenu,
  onMenuChange,
  renderFileDropdown,
  renderEditDropdown,
  renderViewDropdown,
  childrenToolbar,
  childrenRight,
}) => {
  const [internalActiveMenu, setInternalActiveMenu] = useState<ActiveMenu>(null);
  const isControlled = controlledActiveMenu !== undefined;
  const activeMenu = isControlled ? controlledActiveMenu : internalActiveMenu;

  const barRef = useRef<HTMLDivElement>(null);

  const setActive = (menu: ActiveMenu) => {
    if (!isControlled) {
      setInternalActiveMenu(menu);
    }
    if (onMenuChange) {
      onMenuChange(menu);
    }
  };

  const handleMenuClick = (menu: "file" | "edit" | "view") => {
    setActive(activeMenu === menu ? null : menu);
  };

  const handleMouseEnter = (menu: "file" | "edit" | "view") => {
    // If any menu is already open, hovering over another opens it seamlessly
    if (activeMenu !== null && activeMenu !== menu) {
      setActive(menu);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };

    if (activeMenu !== null) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [activeMenu]);

  // Keyboard navigation across top menus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeMenu) return;

    const menus: ("file" | "edit" | "view")[] = ["file", "edit", "view"];
    const currentIndex = menus.indexOf(activeMenu);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % menus.length;
      setActive(menus[nextIndex]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + menus.length) % menus.length;
      setActive(menus[prevIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActive(null);
    }
  };

  return (
    <nav className={styles.menuBar} ref={barRef} onKeyDown={handleKeyDown} aria-label="Menu bar">
      {/* Left Menu Items: File, Edit, View */}
      <div className={styles.leftGroup} role="menubar">
        <div style={{ position: "relative" }}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={activeMenu === "file"}
            className={`${styles.menuBtn} ${activeMenu === "file" ? styles.active : ""}`}
            onClick={() => handleMenuClick("file")}
            onMouseEnter={() => handleMouseEnter("file")}
          >
            File
          </button>
          {activeMenu === "file" && renderFileDropdown && renderFileDropdown()}
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={activeMenu === "edit"}
            className={`${styles.menuBtn} ${activeMenu === "edit" ? styles.active : ""}`}
            onClick={() => handleMenuClick("edit")}
            onMouseEnter={() => handleMouseEnter("edit")}
          >
            Edit
          </button>
          {activeMenu === "edit" && renderEditDropdown && renderEditDropdown()}
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={activeMenu === "view"}
            className={`${styles.menuBtn} ${activeMenu === "view" ? styles.active : ""}`}
            onClick={() => handleMenuClick("view")}
            onMouseEnter={() => handleMouseEnter("view")}
          >
            View
          </button>
          {activeMenu === "view" && renderViewDropdown && renderViewDropdown()}
        </div>
      </div>

      {/* Collapsed menu for mobile viewports (<600px) */}
      <div className={styles.collapsedMenuWrapper}>
        <CollapsedMenu
          renderFileDropdown={renderFileDropdown}
          renderEditDropdown={renderEditDropdown}
          renderViewDropdown={renderViewDropdown}
        />
      </div>

      {/* Formatting Toolbar in Center / Middle */}
      <div className={styles.toolbarGroup}>{childrenToolbar}</div>

      {/* Right side items: Account Menu, Settings */}
      <div className={styles.rightGroup}>{childrenRight}</div>
    </nav>
  );
};
