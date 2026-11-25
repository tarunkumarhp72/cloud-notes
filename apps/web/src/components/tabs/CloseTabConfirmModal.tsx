import React, { useEffect } from "react";
import styles from "./CloseTabConfirmModal.module.css";

export interface CloseTabConfirmModalProps {
  isOpen: boolean;
  tabTitle: string;
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

export const CloseTabConfirmModal: React.FC<CloseTabConfirmModalProps> = ({
  isOpen,
  tabTitle,
  onSave,
  onDontSave,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.scrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-tab-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 id="close-tab-confirm-title" className={styles.title}>
            Notepad
          </h2>
          <p className={styles.message}>
            Do you want to save changes to {tabTitle || "Untitled"}?
          </p>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={onSave}>
            Save
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onDontSave}>
            Don&apos;t save
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
