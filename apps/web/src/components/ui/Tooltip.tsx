import React, { useState, useRef, useEffect, useCallback, ReactElement } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "center" | "start" | "end";
  children: ReactElement;
  delay?: number;
  disabled?: boolean;
}

interface TooltipCoords {
  top: number;
  left: number;
  transform: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = "top",
  align = "center",
  children,
  delay = 200,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;

    // Auto-flip if top tooltip would clip above the viewport
    let effectivePos = position;
    if (effectivePos === "top" && rect.top > 0 && rect.top < 32) {
      effectivePos = "bottom";
    }

    let top = 0;
    let left = 0;
    let tx = "0";
    let ty = "0";

    if (effectivePos === "top" || effectivePos === "bottom") {
      if (effectivePos === "top") {
        top = rect.top - gap;
        ty = "-100%";
      } else {
        top = rect.bottom + gap;
        ty = "0";
      }

      if (align === "center") {
        left = rect.left + rect.width / 2;
        tx = "-50%";
      } else if (align === "start") {
        left = rect.left;
        tx = "0";
      } else {
        left = rect.right;
        tx = "-100%";
      }
    } else if (effectivePos === "left") {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
      tx = "-100%";
      ty = "-50%";
    } else {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
      tx = "0";
      ty = "-50%";
    }

    setCoords({
      top,
      left,
      transform: `translate(${tx}, ${ty})`,
    });
  }, [position, align]);

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateCoords();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const tooltipNode = isVisible ? (
    <div
      role="tooltip"
      className={styles.tooltip}
      style={
        coords
          ? {
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.transform,
            }
          : undefined
      }
    >
      {content}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={styles.tooltipContainer}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClickCapture={hideTooltip}
    >
      {children}
      {tooltipNode &&
        (typeof document !== "undefined" ? createPortal(tooltipNode, document.body) : tooltipNode)}
    </div>
  );
};
