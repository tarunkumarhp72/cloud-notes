import React, { useState } from "react";
import styles from "./SignInModal.module.css";
import { buildGoogleAuthUrl } from "../../auth/googleAuth";
import { webConfig } from "../../config";

export interface SignInModalProps {
  isOpen: boolean;
  onClose?: () => void;
  error?: string | null;
  onGoogleSignIn?: () => Promise<void> | void;
  clientId?: string;
  redirectUri?: string;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  error: externalError,
  onGoogleSignIn,
  clientId,
  redirectUri,
}) => {
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayError = externalError || internalError;

  const handleSignIn = async () => {
    setInternalError(null);
    setLoading(true);
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
        return;
      }

      const activeClientId = clientId || webConfig.googleClientId;
      const activeRedirectUri = redirectUri || webConfig.googleRedirectUri;

      if (!activeClientId) {
        throw new Error("Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env.");
      }

      const { url } = await buildGoogleAuthUrl({
        clientId: activeClientId,
        redirectUri: activeRedirectUri,
      });

      // Redirect to Google OAuth consent
      window.location.href = url;
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : "Failed to initiate Google sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className={styles.modal}>
        {/* Close Button on top right */}
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Windows Notepad App Brand Icon */}
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#FFFFFF" />
            <path d="M16 16H28" stroke="#0078D4" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 22H32" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 28H28" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 34H24" stroke="#A0A0A0" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 id="signin-modal-title" className={styles.title}>
          Sign in to Notepad
        </h1>
        <p className={styles.description}>
          Sync your end-to-end encrypted notes seamlessly across all your devices.
        </p>

        {/* Security & Feature Badges */}
        <div className={styles.featureList} role="list">
          <div className={styles.featureItem} role="listitem">
            <span className={styles.featureIcon}>🔒</span>
            <div className={styles.featureText}>
              <strong>End-to-End Encrypted</strong>
              <span>Encrypted on your device with AES-256 before syncing</span>
            </div>
          </div>
          <div className={styles.featureItem} role="listitem">
            <span className={styles.featureIcon}>⚡</span>
            <div className={styles.featureText}>
              <strong>Multi-Device Sync</strong>
              <span>Instant real-time sync across web and desktop</span>
            </div>
          </div>
          <div className={styles.featureItem} role="listitem">
            <span className={styles.featureIcon}>🛡️</span>
            <div className={styles.featureText}>
              <strong>Zero-Knowledge Privacy</strong>
              <span>Only you hold your keys — nobody else can read your notes</span>
            </div>
          </div>
        </div>

        {displayError && (
          <div className={styles.errorBanner} role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        {/* Official Google Sign-In Button */}
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleSignIn}
          disabled={loading}
          aria-label="Sign in with Google"
        >
          {loading ? (
            <div className={styles.spinner} aria-hidden="true" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>{loading ? "Connecting to Google..." : "Sign in with Google"}</span>
        </button>

        {/* Continue Offline Option */}
        {onClose && (
          <div className={styles.skipWrapper}>
            <button type="button" className={styles.skipBtn} onClick={onClose}>
              Continue offline without signing in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
