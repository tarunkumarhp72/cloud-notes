import React, { useState, useEffect, useRef } from "react";
import styles from "./TabStrip.module.css";
import { TabItem } from "./TabItem";
import { Tooltip } from "../ui/Tooltip";

export interface Tab {
  id: string;
  title: string;
  isDirty?: boolean;
  hasUnsavedChanges?: boolean;
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
  showCaptionControls?: boolean;
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
  showCaptionControls,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll new tab & plus button into view when tabs are added or selected
  const prevTabCountRef = useRef(tabs.length);
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    if (tabs.length > prevTabCountRef.current) {
      // Smoothly scroll container all the way to the right so both the new tab and the '+' button are fully visible
      setTimeout(() => {
        if (container) {
          container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
        }
      }, 50);
    } else {
      const activeEl = container.querySelector(`[aria-selected="true"]`) as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
    prevTabCountRef.current = tabs.length;
  }, [tabs.length, activeTabId]);

  const handleWheel = (e: React.WheelEvent) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollLeft += e.deltaY || e.deltaX;
    }
  };

  const isDesktopEnv =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }).__TAURI__ ||
        (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    );

  const shouldShowCaption =
    showCaptionControls !== undefined
      ? showCaptionControls
      : isDesktopEnv || onMinimize !== undefined || onMaximize !== undefined || onCloseWindow !== undefined;

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
        <div
          ref={tabsContainerRef}
          className={styles.tabsContainer}
          role="tablist"
          aria-label="Note tabs"
          onWheel={handleWheel}
        >
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

          {/* '+' button placed immediately after the last tab, moving right as tabs are added */}
          <Tooltip content="New tab (Ctrl+N)" position="bottom" align="start">
            <button
              type="button"
              className={styles.newTabBtn}
              onClick={onNewTab}
              aria-label="New tab (Ctrl+N)"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 1v10M1 6h10" strokeLinecap="round" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Right side items (e.g. AccountMenu, Settings) */}
        {childrenRight}

        {/* Windows Caption Controls (rendered only for desktop shells) */}
        {shouldShowCaption && (
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
        )}
      </div>
    </header>
  );
};
