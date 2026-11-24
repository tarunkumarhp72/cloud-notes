import React from "react";
import styles from "./NoteLimitModal.module.css";
import { webConfig } from "../../config";

export interface NoteLimitModalProps {
  isOpen: boolean;
  isGuest: boolean;
  limit: number;
  userLimit?: number;
  currentCount: number;
  onClose: () => void;
  onSignIn?: () => void;
}

export const NoteLimitModal: React.FC<NoteLimitModalProps> = ({
  isOpen,
  isGuest,
  limit,
  userLimit = webConfig.userNoteLimit,
  currentCount,
  onClose,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-limit-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconContainer} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div>
            <h2 id="note-limit-title" className={styles.title}>
              {isGuest ? "Guest Note Limit Reached" : "Maximum Note Limit Reached"}
            </h2>
            <span className={styles.badge}>
              {currentCount} / {limit} Notes
            </span>
          </div>
        </div>

        <p className={styles.bodyText}>
          {isGuest
            ? `Guest mode allows up to ${limit} notes stored locally in this browser. Sign in with your Google account to unlock up to ${userLimit} notes with zero-knowledge encrypted cloud sync.`
            : `You have reached the maximum limit of ${limit} active notes for your account. To create a new note, please close, delete, or export an existing note.`}
        </p>

        {isGuest && (
          <div className={styles.limitsComparison}>
            <div className={styles.limitRow}>
              <span className={styles.limitLabel}>Guest Mode:</span>
              <span className={styles.limitValue}>{limit} notes (local only)</span>
            </div>
            <div className={styles.limitRow}>
              <span className={styles.limitLabel}>Signed In Account:</span>
              <span className={styles.limitValue}>{userLimit} notes (E2EE cloud sync)</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {isGuest && onSignIn ? (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  onClose();
                  onSignIn();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Sign in with Google
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onClose}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
