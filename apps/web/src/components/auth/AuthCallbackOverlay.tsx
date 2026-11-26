import React from "react";
import styles from "./AuthCallbackOverlay.module.css";

export interface AuthCallbackOverlayProps {
  mode: "signin" | "drive" | null;
}

/**
 * Full-page loading overlay shown while completing Google OAuth or Drive callback exchange.
 */
export const AuthCallbackOverlay: React.FC<AuthCallbackOverlayProps> = ({ mode }) => {
  if (!mode) return null;

  const isDrive = mode === "drive";

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label={isDrive ? "Connecting Google Drive" : "Signing you in"}
    >
      <div className={styles.card}>
        <div className={styles.iconRing}>
          <span className={styles.spinner} aria-hidden="true" />
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#FFFFFF" />
            <path d="M16 16H28" stroke="#0078D4" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 22H32" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 28H28" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className={styles.title}>
          {isDrive ? "Connecting Google Drive..." : "Signing you in..."}
        </h2>
        <p className={styles.subtitle}>
          {isDrive
            ? "Completing authorization and syncing your Drive backup status."
            : "Verifying your Google account and preparing your workspace."}
        </p>
      </div>
    </div>
  );
};
