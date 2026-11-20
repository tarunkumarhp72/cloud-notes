import React, { useState, useEffect, useRef } from "react";
import styles from "./GoToDialog.module.css";

export interface GoToDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoTo: (lineNumber: number) => void;
  currentLine?: number;
  maxLine?: number;
}

export const GoToDialog: React.FC<GoToDialogProps> = ({
  isOpen,
  onClose,
  onGoTo,
  currentLine = 1,
  maxLine = 1,
}) => {
  const [lineValue, setLineValue] = useState<string>(String(currentLine));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLineValue(String(currentLine));
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentLine]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsed = parseInt(lineValue.trim(), 10);
    if (isNaN(parsed) || parsed < 1 || (maxLine > 0 && parsed > maxLine)) {
      setError("The line number is beyond the total number of lines");
      return;
    }
    setError(null);
    onGoTo(parsed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goto-title"
    >
      <div className={styles.dialog}>
        <h2 id="goto-title" className={styles.title}>
          Go to line
        </h2>

        <form onSubmit={handleSubmit} className={styles.field}>
          <label htmlFor="goto-line-input" className={styles.label}>
            Line number:
          </label>
          <input
            id="goto-line-input"
            ref={inputRef}
            type="number"
            min={1}
            className={styles.input}
            value={lineValue}
            onChange={(e) => {
              setLineValue(e.target.value);
              if (error) setError(null);
            }}
          />
          {error && <span className={styles.error}>{error}</span>}

          <div className={styles.actions}>
            <button type="submit" className={styles.buttonPrimary}>
              Go to
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
