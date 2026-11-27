import { useEffect } from "react";

export interface VisualViewportOptions {
  activeElementSelector?: string;
  onViewportChange?: (height: number, offsetTop: number) => void;
}

/**
 * useVisualViewport prevents virtual keyboard caret occlusion on mobile devices
 * by listening to window.visualViewport resize/scroll events and scrolling
 * the focused editor caret or active element into visible view.
 */
export function useVisualViewport(options: VisualViewportOptions = {}): void {
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      // Keep outer document pinned at (0, 0) so titlebar and toolbar never scroll off-screen
      if (typeof window.scrollTo === "function") {
        window.scrollTo(0, 0);
      }
      options.onViewportChange?.(vv.height, vv.offsetTop);
    };

    const handleResize = () => {
      handleViewportChange();

      // Only scroll active editor into view on keyboard resize
      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      const isEditable =
        activeEl.isContentEditable ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "INPUT" ||
        activeEl.closest(".cm-editor") !== null ||
        activeEl.closest(".tiptap") !== null;

      if (isEditable) {
        requestAnimationFrame(() => {
          try {
            activeEl.scrollIntoView({
              block: "nearest",
              inline: "nearest",
              behavior: "auto",
            });
          } catch {
            activeEl.scrollIntoView();
          }
        });
      }
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, [options.activeElementSelector, options.onViewportChange]);
}
