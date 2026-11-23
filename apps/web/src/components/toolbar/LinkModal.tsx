import React, { useState, useEffect, useRef } from "react";
import styles from "./LinkModal.module.css";
import toolbarStyles from "./Toolbar.module.css";
import { sanitizeUrl } from "../../security/sanitize";
import { Tooltip } from "../ui/Tooltip";

export interface LinkModalProps {
  isOpen: boolean;
  initialText?: string;
  initialUrl?: string;
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
}

export const LinkButton: React.FC<{ onClick?: () => void; disabled?: boolean }> = ({
  onClick,
  disabled = false,
}) => (
  <Tooltip content="Insert link" position="top">
    <button
      type="button"
      className={toolbarStyles.toolbarBtn}
      aria-label="Link"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{ width: "28px", justifyContent: "center" }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M6.88 9.12a3 3 0 0 1 0-4.24l2.12-2.12a3 3 0 0 1 4.24 4.24l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a1.5 1.5 0 1 0-2.12-2.12L7.94 5.94a1.5 1.5 0 0 0 0 2.12.75.75 0 0 1-1.06 1.06zm2.24-2.24a3 3 0 0 1 0 4.24l-2.12 2.12a3 3 0 1 1-4.24-4.24l1.06-1.06a.75.75 0 0 1 1.06 1.06L3.82 11.06a1.5 1.5 0 1 0 2.12 2.12l2.12-2.12a1.5 1.5 0 0 0 0-2.12.75.75 0 0 1 1.06-1.06z" />
      </svg>
    </button>
  </Tooltip>
);

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  initialText = "",
  initialUrl = "",
  onInsert,
  onClose,
}) => {
  const [displayText, setDisplayText] = useState(initialText);
  const [address, setAddress] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayText(initialText);
      setAddress(initialUrl);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialText, initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    const cleanUrl = sanitizeUrl(address.trim());
    if (!cleanUrl) return;
    onInsert(displayText.trim() || cleanUrl, cleanUrl);
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="link-modal-title" className={styles.title}>
            Link
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label htmlFor="link-display-text" className={styles.label}>
                Display text
              </label>
              <input
                id="link-display-text"
                ref={inputRef}
                type="text"
                className={styles.input}
                placeholder="Text for the link (optional)"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="link-address" className={styles.label}>
                Address
              </label>
              <input
                id="link-address"
                type="text"
                className={styles.input}
                placeholder="Link to an existing webpage"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="submit"
              className={`${styles.btn} ${styles.primaryBtn}`}
              disabled={!address.trim()}
            >
              Insert
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.cancelBtn}`}
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
