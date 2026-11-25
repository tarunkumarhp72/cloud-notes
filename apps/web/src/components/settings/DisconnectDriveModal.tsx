import React, { useEffect } from "react";
import styles from "./DisconnectDriveModal.module.css";

export interface DisconnectDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisconnecting?: boolean;
  googleEmail?: string | null;
}

export const DisconnectDriveModal: React.FC<DisconnectDriveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting,
  googleEmail,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDisconnecting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDisconnecting]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDisconnecting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disconnect-drive-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.dangerIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 id="disconnect-drive-title" className={styles.title}>
              Disconnect Google Drive?
            </h2>
            <p className={styles.subtitle}>Automatic backup schedule will stop</p>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.text}>
            Are you sure you want to disconnect{" "}
            <strong>{googleEmail || "your Google Drive account"}</strong>?
          </p>
          <p className={styles.textSecondary}>
            Any active backup will be safely stopped and automatic scheduled backups will be cancelled. Your notes will remain securely stored in Notepad Cloud.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isDisconnecting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.disconnectBtn}
            onClick={onConfirm}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  );
};
