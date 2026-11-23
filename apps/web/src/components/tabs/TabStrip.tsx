import React, { useState, useEffect } from "react";
import styles from "./TabStrip.module.css";
import { TabItem } from "./TabItem";

export interface Tab {
  id: string;
  title: string;
  isDirty?: boolean;
}

export interface TabStripProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onReorderTabs?: (sourceIndex: number, destinationIndex: number) => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onCloseWindow?: () => void;
  childrenRight?: React.ReactNode;
}

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs,
  onMinimize,
  onMaximize,
  onCloseWindow,
  childrenRight,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleClose = () => {
    if (onCloseWindow) {
      onCloseWindow();
    } else {
      window.close();
    }
  };

  return (
    <header className={styles.titleBar} role="banner">
      <div className={styles.leftSection}>
        {/* Windows Notepad App Icon */}
        <div className={styles.appIcon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#FFFFFF" />
            <path d="M16 16H28" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 22H32" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 28H28" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 34H24" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Tab List */}
        <div className={styles.tabsContainer} role="tablist" aria-label="Note tabs">
          {tabs.map((tab, idx) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              index={idx}
              onSelect={() => onSelectTab(tab.id)}
              onClose={() => onCloseTab(tab.id)}
              onReorder={onReorderTabs}
            />
          ))}

          {/* New Tab (+) Button */}
          <button
            type="button"
            className={styles.newTabBtn}
            onClick={onNewTab}
            aria-label="New tab (Ctrl+N)"
            title="New tab (Ctrl+N)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 1v10M1 6h10" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Right side items (e.g. AccountMenu, Settings) */}
        {childrenRight}

        {/* Windows Caption Controls */}
        <div className={styles.captionControls}>
          <button
            type="button"
            className={styles.captionBtn}
            onClick={handleMinimize}
            aria-label="Minimize"
            title="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.captionBtn}
            onClick={handleMaximize}
            aria-label={isFullscreen ? "Restore down" : "Maximize"}
            title={isFullscreen ? "Restore down" : "Maximize"}
          >
            {isFullscreen ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                <rect x="0.5" y="2.5" width="7" height="7" strokeWidth="1" />
                <path d="M2.5 2.5V0.5H9.5V7.5H7.5" strokeWidth="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                <rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className={`${styles.captionBtn} ${styles.closeCaption}`}
            onClick={handleClose}
            aria-label="Close"
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
