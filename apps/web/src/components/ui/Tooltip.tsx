import React, { useState, useRef, useEffect, ReactElement } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "center" | "start" | "end";
  children: ReactElement;
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = "top",
  align = "center",
  children,
  delay = 250,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
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

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClickCapture={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`${styles.tooltip} ${styles[position]} ${styles[`align_${align}`]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
