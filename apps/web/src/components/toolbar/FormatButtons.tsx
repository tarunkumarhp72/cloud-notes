import React from "react";
import styles from "./Toolbar.module.css";
import { Tooltip } from "../ui/Tooltip";

export interface ClearFormattingButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export const ClearFormattingButton: React.FC<ClearFormattingButtonProps> = ({
  onClick,
  disabled = false,
}) => (
  <Tooltip content="Clear formatting" position="top">
    <button
      type="button"
      className={styles.toolbarBtn}
      aria-label="Clear formatting"
      disabled={disabled}
      onClick={onClick}
      style={{ width: "28px", justifyContent: "center" }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3.2 2h2.5l3.2 9H7.3l-.7-2.1H3.3l-.7 2.1H1.1L3.2 2zm1.4 2.3L3.7 7.5h2.2l-.9-3.2z" />
        <path d="M10.8 7.2l3.5 3.5c.3.3.3.8 0 1.1l-2.2 2.2c-.3.3-.8.3-1.1 0l-3.5-3.5 3.3-3.3z" opacity="0.8" />
        <path d="M9 13.5h6v1H9z" />
      </svg>
    </button>
  </Tooltip>
);

export interface FormatButtonsProps {
  isBold?: boolean;
  isItalic?: boolean;
  isStrikethrough?: boolean;
  showClearFormatting?: boolean;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleStrikethrough?: () => void;
  onClearFormatting?: () => void;
  disabled?: boolean;
}

export const FormatButtons: React.FC<FormatButtonsProps> = ({
  isBold = false,
  isItalic = false,
  isStrikethrough = false,
  showClearFormatting = true,
  onToggleBold,
  onToggleItalic,
  onToggleStrikethrough,
  onClearFormatting,
  disabled = false,
}) => {
  return (
    <>
      {/* Bold */}
      <Tooltip content="Bold (Ctrl+B)" position="top">
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isBold ? styles.active : ""}`}
          aria-label="Bold"
          aria-pressed={isBold}
          disabled={disabled}
          onClick={onToggleBold}
          style={{ fontWeight: 700, fontSize: "14px", width: "28px", justifyContent: "center" }}
        >
          B
        </button>
      </Tooltip>

      {/* Italic */}
      <Tooltip content="Italic (Ctrl+I)" position="top">
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isItalic ? styles.active : ""}`}
          aria-label="Italic"
          aria-pressed={isItalic}
          disabled={disabled}
          onClick={onToggleItalic}
          style={{ fontStyle: "italic", fontFamily: "serif", fontSize: "14px", width: "28px", justifyContent: "center" }}
        >
          I
        </button>
      </Tooltip>

      {/* Strikethrough */}
      <Tooltip content="Strikethrough" position="top">
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isStrikethrough ? styles.active : ""}`}
          aria-label="Strikethrough"
          aria-pressed={isStrikethrough}
          disabled={disabled}
          onClick={onToggleStrikethrough}
          style={{ textDecoration: "line-through", fontSize: "14px", width: "28px", justifyContent: "center" }}
        >
          S
        </button>
      </Tooltip>

      {/* Optional inline Clear formatting */}
      {showClearFormatting && (
        <ClearFormattingButton onClick={onClearFormatting} disabled={disabled} />
      )}
    </>
  );
};
