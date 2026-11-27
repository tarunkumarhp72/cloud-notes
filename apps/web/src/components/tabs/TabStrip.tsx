import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkOverflow = useCallback(() => {
    const container = tabsContainerRef.current;
    const leftSection = leftSectionRef.current;
    if (!container) return;

    // Fixed spacing in leftSection: appIcon (~28px) + tabActions (~88px) + padding-right (20px) = ~136px
    const leftWidth = leftSection ? leftSection.clientWidth : container.clientWidth;
    const availableForTabs = leftWidth > 0 ? leftWidth - 80 : 0;

    let overflowing = false;
    if (leftWidth > 0) {
      overflowing = container.scrollWidth > availableForTabs;
    } else {
      // In testing environments without layout engines (jsdom), estimate based on tab count
      overflowing = tabs.length > 8;
    }

    setIsOverflowing(overflowing);

    if (!overflowing) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 2);
  }, [tabs.length]);

  const handleScroll = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkOverflow();
    const container = tabsContainerRef.current;
    const leftSection = leftSectionRef.current;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => checkOverflow());
      if (leftSection) observer.observe(leftSection);
      if (container) observer.observe(container);
    }
    window.addEventListener("resize", checkOverflow);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [tabs, checkOverflow]);

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
    setTimeout(handleScroll, 350);
  }, [tabs.length, activeTabId, handleScroll]);

  const handleScrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (tabsContainerRef.current && isOverflowing) {
      tabsContainerRef.current.scrollLeft += e.deltaY || e.deltaX;
      handleScroll();
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
      <div ref={leftSectionRef} className={styles.leftSection}>
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
          className={`${styles.tabsContainer} ${isOverflowing ? styles.overflowing : styles.notOverflowing}`}
          role="tablist"
          aria-label="Note tabs"
          onScroll={handleScroll}
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

        {/* When overflowing: Fixed scroll navigation buttons */}
        {isOverflowing && (canScrollLeft || canScrollRight) && (
          <div className={styles.tabActionsFixed}>
            <Tooltip content="Scroll tabs left" position="bottom" align="center" disabled={!canScrollLeft}>
              <button
                type="button"
                className={styles.scrollBtn}
                onClick={handleScrollLeft}
                disabled={!canScrollLeft}
                aria-label="Scroll tabs left"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M7 1.5L2.5 5L7 8.5V1.5Z" />
                </svg>
              </button>
            </Tooltip>

            <Tooltip content="Scroll tabs right" position="bottom" align="center" disabled={!canScrollRight}>
              <button
                type="button"
                className={styles.scrollBtn}
                onClick={handleScrollRight}
                disabled={!canScrollRight}
                aria-label="Scroll tabs right"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M3 1.5L7.5 5L3 8.5V1.5Z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        )}
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
