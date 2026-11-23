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

    const handleResizeOrScroll = () => {
      options.onViewportChange?.(vv.height, vv.offsetTop);

      // Scroll active editor or caret into visible viewport if active
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
              behavior: "smooth",
            });
          } catch {
            activeEl.scrollIntoView();
          }
        });
      }
    };

    vv.addEventListener("resize", handleResizeOrScroll);
    vv.addEventListener("scroll", handleResizeOrScroll);

    return () => {
      vv.removeEventListener("resize", handleResizeOrScroll);
      vv.removeEventListener("scroll", handleResizeOrScroll);
    };
  }, [options.activeElementSelector, options.onViewportChange]);
}
