import React, { useState, useEffect, useRef } from "react";
import { useVaultStore } from "../../stores/vaultStore";
import styles from "./vault.module.css";

export interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
  onSuccess?: () => void;
  onForgotPassphrase?: () => void;
  customSetupHandler?: (passphrase: string) => Promise<unknown>;
  customUnlockHandler?: (passphrase: string) => Promise<unknown>;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  isInitialSetup = false,
  onSuccess,
  onForgotPassphrase,
  customSetupHandler,
  customUnlockHandler,
}) => {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setupVault, unlockVault } = useVaultStore();

  useEffect(() => {
    if (isOpen) {
      setPassphrase("");
      setConfirmPassphrase("");
      setError(null);
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isInitialSetup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 6) {
      setError("Passphrase must be at least 6 characters");
      return;
    }

    if (isInitialSetup && passphrase !== confirmPassphrase) {
      setError("Passphrases do not match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isInitialSetup) {
        if (customSetupHandler) {
          await customSetupHandler(passphrase);
        } else {
          await setupVault(passphrase);
        }
      } else {
        if (customUnlockHandler) {
          await customUnlockHandler(passphrase);
        } else {
          await unlockVault(passphrase);
        }
      }

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !loading) {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconWrapper} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1zm2 5H6V4.5a2 2 0 1 1 4 0V6z" />
            </svg>
          </div>
          <div className={styles.titleArea}>
            <h2 id="vault-modal-title" className={styles.title}>
              {isInitialSetup
                ? "Protect your notes with encryption"
                : "Unlock your encrypted notes"}
            </h2>
            <p className={styles.description}>
              {isInitialSetup
                ? "Set a master passphrase to encrypt your notes using zero-knowledge AES-256-GCM. Your passphrase never leaves this device."
                : "Enter your master passphrase to decrypt and edit your notes."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="vault-passphrase-input" className={styles.label}>
              {isInitialSetup ? "Choose a passphrase" : "Master passphrase"}
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="vault-passphrase-input"
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Enter passphrase"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755l.191.195zm-9.08-9.08l-.707.708 11.314 11.314.707-.708L4.28 2.158zM8 5.5a2.5 2.5 0 0 1 2.5 2.5c0 .285-.05.558-.14.811L8.81 7.26A2.5 2.5 0 0 0 8 5.5zm-5.076 2.3A13.133 13.133 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.88 12.5 8 12.5c.716 0 1.39-.133 2.02-.366l-.776-.777a5.955 5.955 0 0 1-1.244.143c-2.12 0-3.879-1.168-5.168-2.457a13.133 13.133 0 0 1-.908-1.243z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7 8a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {isInitialSetup && (
            <div className={styles.field}>
              <label htmlFor="vault-confirm-passphrase" className={styles.label}>
                Confirm passphrase
              </label>
              <input
                id="vault-confirm-passphrase"
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Confirm passphrase"
                value={confirmPassphrase}
                onChange={(e) => {
                  setConfirmPassphrase(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.actions}>
            {!isInitialSetup && onForgotPassphrase && (
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={onForgotPassphrase}
                disabled={loading}
              >
                Forgot passphrase?
              </button>
            )}

            <div className={styles.buttonsRight}>
              <button
                type="submit"
                className={styles.buttonPrimary}
                disabled={loading}
              >
                {loading
                  ? "Deriving key..."
                  : isInitialSetup
                  ? "Set passphrase"
                  : "Unlock"}
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
