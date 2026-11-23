import React, { useState } from "react";
import styles from "./DeleteAccountModal.module.css";
import { clearAllLocalData } from "@notepad/core";
import { useTabsStore } from "../../stores/tabsStore";
import { useVaultStore } from "../../stores/vaultStore";

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  accessToken?: string;
  apiBaseUrl?: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
  accessToken,
  apiBaseUrl = "",
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      // 1. Send DELETE request to API if accessToken is provided
      if (accessToken) {
        const res = await fetch(`${apiBaseUrl}/account`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to delete account (status ${res.status})`);
        }
      }

      // 2. Clear local IndexedDB stores (notes, vault, outbox)
      await clearAllLocalData();

      // 3. Reset application stores and memory
      useTabsStore.getState().resetTabs();
      useVaultStore.getState().resetVault();

      // 4. Clear credentials from localStorage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("notepad_access_token");
        window.localStorage.removeItem("notepad_user");
      }

      onDeleted?.();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to purge account data");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={styles.scrim}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.dangerIcon}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
          </div>
          <h2 id="delete-account-title" className={styles.title}>
            Delete Account & Purge Data
          </h2>
        </div>

        <div className={styles.warningBox}>
          <p className={styles.warningText}>
            <strong>Irreversible Action:</strong> Deleting your account will permanently wipe all
            end-to-end encrypted notes, your recovery keys, and your vault from both this device and
            the cloud servers.
          </p>
        </div>

        <div>
          <p className={styles.instruction}>
            Please type <strong>DELETE</strong> below to confirm:
          </p>
          <input
            type="text"
            className={styles.input}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={isDeleting}
            aria-label="Confirm delete by typing DELETE"
          />
        </div>

        {errorMessage && (
          <p style={{ color: "#e81123", fontSize: "13px", margin: 0 }}>{errorMessage}</p>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Purging..." : "Permanently Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
