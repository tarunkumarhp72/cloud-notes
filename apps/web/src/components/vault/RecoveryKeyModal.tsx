import React, { useState, useEffect, useRef } from "react";
import { useVaultStore } from "../../stores/vaultStore";
import styles from "./vault.module.css";

export interface RecoveryKeyModalProps {
  isOpen: boolean;
  mode: "display" | "recover";
  recoveryKey?: string;
  onClose: () => void;
  onSuccess?: () => void;
  customRecoverHandler?: (recoveryKey: string) => Promise<unknown>;
}

export const RecoveryKeyModal: React.FC<RecoveryKeyModalProps> = ({
  isOpen,
  mode,
  recoveryKey = "",
  onClose,
  onSuccess,
  customRecoverHandler,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { recoverVault } = useVaultStore();

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setConfirmedSaved(false);
      setRecoveryInput("");
      setError(null);
      setLoading(false);
      if (mode === "recover") {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!recoveryKey) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(recoveryKey);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput.trim()) {
      setError("Please enter your emergency recovery key");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (customRecoverHandler) {
        await customRecoverHandler(recoveryInput.trim());
      } else {
        await recoverVault(recoveryInput.trim());
      }
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Invalid recovery key. Unable to recover vault.";
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
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-modal-title"
      >
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11.5 1a3.5 3.5 0 0 0-3.5 3.5V6H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h1v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h.5a3.5 3.5 0 0 0 3.5-3.5v-6A3.5 3.5 0 0 0 11.5 1zm1.5 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            </svg>
          </div>
          <div className={styles.titleArea}>
            <h2 id="recovery-modal-title" className={styles.title}>
              {mode === "display" ? "Emergency Recovery Key" : "Recover Your Vault"}
            </h2>
            <p className={styles.description}>
              {mode === "display"
                ? "Save this 256-bit emergency recovery key in a safe place. If you ever forget your passphrase, this is the only way to recover your notes."
                : "Enter your 64-character recovery key to unlock your encrypted notes and regain access."}
            </p>
          </div>
        </div>

        {mode === "display" ? (
          <div className={styles.form}>
            <div className={styles.warningBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                className={styles.warningIcon}
                aria-hidden="true"
              >
                <path d="M7.56 1.37a1 1 0 0 1 1.76 0l6.5 12A1 1 0 0 1 14.94 15H1.94a1 1 0 0 1-.88-1.48l6.5-12zM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
              <span>
                <strong>Keep this key secure!</strong> It will never be shown again and cannot be retrieved if lost.
              </span>
            </div>

            <div className={styles.recoveryCard}>
              <div className={styles.recoveryCode} data-testid="recovery-code">
                {recoveryKey}
              </div>
              <div className={styles.copyRow}>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={handleCopy}
                  aria-label="Copy recovery key"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: "6px" }} aria-hidden="true">
                    <path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z" />
                    <path d="M2 5a1 1 0 0 0-1 1v8a2 2 0 0 0 2 2h6a1 1 0 0 0 0-2H3a1 1 0 0 1-1-1V6a1 1 0 0 0-1-1z" />
                  </svg>
                  {copied ? "Copied to clipboard!" : "Copy recovery key"}
                </button>
                {copied && <span className={styles.copyFeedback}>✓ Copied</span>}
              </div>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                data-testid="recovery-confirm-checkbox"
              />
              <span>I have securely saved this recovery key</span>
            </label>

            <div className={styles.actions}>
              <div className={styles.buttonsRight}>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  disabled={!confirmedSaved}
                  onClick={() => {
                    onSuccess?.();
                    onClose();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRecoverSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBanner} role="alert">
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="recovery-key-input" className={styles.label}>
                Recovery Key
              </label>
              <textarea
                id="recovery-key-input"
                ref={inputRef}
                className={styles.textarea}
                placeholder="Paste your 64-character recovery key (e.g. A1B2-C3D4-...)"
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.buttonPrimary}
                disabled={loading || !recoveryInput.trim()}
              >
                {loading ? "Restoring..." : "Restore Access"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
