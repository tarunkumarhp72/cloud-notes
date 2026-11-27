import React, { useState, useEffect, useCallback } from "react";
import styles from "./GoogleDriveBackup.module.css";
import { webConfig } from "../../config";
import { fetchWithAuth, getValidAccessToken } from "../../auth/tokenManager";
import { useBackupProgressStore } from "../../stores/backupProgressStore";
import { DisconnectDriveModal } from "./DisconnectDriveModal";
import { Tooltip } from "../ui/Tooltip";

export interface GoogleDriveBackupProps {
  accessToken?: string;
  isGuest?: boolean;
  onSignInClick?: () => void;
  onRestored?: () => void;
}

export interface BackupStatus {
  connected: boolean;
  googleEmail: string | null;
  autoBackupEnabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "disabled";
  lastBackupAt: string | null;
  nextBackupAt: string | null;
}

export interface BackupHistoryEntry {
  id: string;
  drive_file_id: string;
  folder_path: string;
  backup_type: string;
  status: string;
  notes_count: number;
  file_size_bytes: number;
  error_message?: string | null;
  created_at: string;
}

const GoogleDriveLogo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <svg className={className} style={style} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

export const GoogleDriveBackup: React.FC<GoogleDriveBackupProps> = ({
  accessToken: propToken,
  isGuest,
  onSignInClick,
  onRestored,
}) => {
  const [hasUserSession, setHasUserSession] = useState<boolean>(() => {
    if (isGuest) return false;
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("notepad_user"));
    }
    return false;
  });

  const [effectiveToken, setEffectiveToken] = useState<string | undefined>(() => {
    if (isGuest) return undefined;
    if (typeof window !== "undefined" && !localStorage.getItem("notepad_user") && !propToken) {
      return undefined;
    }
    return (
      propToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("notepad_token") || undefined
        : undefined)
    );
  });

  useEffect(() => {
    if (isGuest) {
      setEffectiveToken(undefined);
      setHasUserSession(false);
      return;
    }
    const hasUser = typeof window !== "undefined" && Boolean(localStorage.getItem("notepad_user"));
    setHasUserSession(hasUser);
    if (!hasUser && !propToken) {
      setEffectiveToken(undefined);
      return;
    }
    getValidAccessToken().then((tok) => {
      if (tok) {
        setEffectiveToken(tok);
      } else if (propToken) {
        setEffectiveToken(propToken);
      }
    });
  }, [propToken, isGuest]);

  const isUserSignedIn = !isGuest && (hasUserSession || Boolean(propToken)) && Boolean(effectiveToken);
  const accessToken = isUserSignedIn ? effectiveToken : undefined;
  const { startBackup, status: backupProgressStatus } = useBackupProgressStore();
  const [status, setStatus] = useState<BackupStatus | null>(() => {
    if (isGuest) return null;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("notepad_drive_status");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [statusLoading, setStatusLoading] = useState<boolean>(() => {
    if (isGuest) return false;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("notepad_drive_status");
        if (cached) return false;
      } catch {}
    }
    return true;
  });
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [restoreModalFile, setRestoreModalFile] = useState<BackupHistoryEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (isGuest) {
      setStatusLoading(false);
      return;
    }
    let token = accessToken;
    if (!token && typeof window !== "undefined") {
      token = (await getValidAccessToken()) || undefined;
    }
    if (!token) {
      setStatusLoading(false);
      return;
    }
    if (!status) {
      setStatusLoading(true);
    }
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (typeof window !== "undefined") {
          try {
            if (data.connected) {
              localStorage.setItem("notepad_drive_status", JSON.stringify(data));
            } else {
              localStorage.removeItem("notepad_drive_status");
            }
          } catch {}
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setStatusLoading(false);
    }
  }, [accessToken, isGuest, status]);

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // Ignore
    }
  }, [accessToken]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();

    // If store is stuck in "in_progress" without an active network controller, reset to idle
    const store = useBackupProgressStore.getState();
    if (store.status === "in_progress" && !store.activeAbortController) {
      store.dismiss();
    }
  }, [fetchStatus, fetchHistory]);

  const handleConnect = async () => {
    if (!isUserSignedIn || !accessToken) return;
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/drive-callback`;
      const res = await fetchWithAuth(
        `${webConfig.apiBaseUrl}/api/backup/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Could not initialize Google Drive authorization");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      useBackupProgressStore.getState().notifyMessage({
        title: "Connection Failed",
        phase: err instanceof Error ? err.message : "Failed to connect to Google Drive",
        status: "failed",
        autoDismissMs: 4000,
      });
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (!accessToken) return;
    setIsDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("notepad_drive_status");
          } catch {}
        }
        setStatus((prev) => (prev ? { ...prev, connected: false } : null));
        setIsDisconnectModalOpen(false);
        await fetchStatus();
        useBackupProgressStore.getState().notifyMessage({
          title: "Google Drive Disconnected",
          phase: "Google Drive was disconnected successfully.",
          status: "success",
          autoDismissMs: 4000,
        });
      } else {
        throw new Error("Failed to disconnect Google Drive");
      }
    } catch (err) {
      useBackupProgressStore.getState().notifyMessage({
        title: "Disconnection Failed",
        phase: err instanceof Error ? err.message : "Failed to disconnect Google Drive.",
        status: "failed",
        autoDismissMs: 4000,
      });
    } finally {
      setLoading(false);
      setIsDisconnectModalOpen(false);
    }
  };

  const handleToggleAutoBackup = async (enabled: boolean) => {
    if (!accessToken || !status) return;
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          autoBackupEnabled: enabled,
          frequency: status.frequency,
        }),
      });
      if (res.ok) {
        setStatus((prev) => (prev ? { ...prev, autoBackupEnabled: enabled } : null));
        await fetchStatus();
      }
    } catch {
      useBackupProgressStore.getState().notifyMessage({
        title: "Settings Update Failed",
        phase: "Failed to update backup settings.",
        status: "failed",
        autoDismissMs: 4000,
      });
    }
  };

  const handleFrequencyChange = async (frequency: "daily" | "weekly" | "monthly") => {
    if (!accessToken || !status) return;
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          autoBackupEnabled: status.autoBackupEnabled,
          frequency,
        }),
      });
      if (res.ok) {
        setStatus((prev) => (prev ? { ...prev, frequency } : null));
        await fetchStatus();
      }
    } catch {
      useBackupProgressStore.getState().notifyMessage({
        title: "Frequency Update Failed",
        phase: "Failed to update backup frequency.",
        status: "failed",
        autoDismissMs: 4000,
      });
    }
  };

  const handleBackupNow = async () => {
    if (!accessToken) return;
    setBackingUp(true);
    try {
      await startBackup(accessToken, async () => {
        await fetchStatus();
        await fetchHistory();
      });
    } catch (err) {
      useBackupProgressStore.getState().notifyMessage({
        title: "Backup Failed",
        phase: err instanceof Error ? err.message : "Manual backup failed",
        status: "failed",
        autoDismissMs: 4000,
      });
    } finally {
      setBackingUp(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!accessToken || !restoreModalFile) return;
    setRestoring(true);
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driveFileId: restoreModalFile.drive_file_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");

      useBackupProgressStore.getState().notifyMessage({
        title: "Restore Completed",
        phase: `Restored ${data.restore?.restoredCount || 0} notes (${data.restore?.skippedCount || 0} already up-to-date).`,
        status: "success",
        autoDismissMs: 4000,
      });
      setRestoreModalFile(null);
      onRestored?.();
    } catch (err) {
      useBackupProgressStore.getState().notifyMessage({
        title: "Restore Failed",
        phase: err instanceof Error ? err.message : "Restore operation failed",
        status: "failed",
        autoDismissMs: 4000,
      });
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString?: string | null): string => {
    if (!isoString) return "Never";
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? "Never" : d.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <GoogleDriveLogo className={styles.driveIcon} />
            <div>
              <h2 className={styles.cardTitle}>Google Drive Backup</h2>
              <p className={styles.cardDescription}>
                Encrypted backup
              </p>
            </div>
          </div>
          <Tooltip
            content={status?.connected ? "Connected" : "Not Connected"}
            position="top"
            align="end"
          >
            <span
              role="img"
              aria-label={status?.connected ? "Connected" : "Not Connected"}
              style={{ display: "inline-flex", alignItems: "center", cursor: "default", flexShrink: 0 }}
            >
              <svg width="28" height="22" viewBox="0 0 36 28" fill="none" aria-hidden="true">
                <path
                  d="M21.5 4C17.1 4 13.4 6.9 12.1 10.9C11.4 10.6 10.6 10.4 9.8 10.4C6.6 10.4 4 13 4 16.2C4 19.3 6.5 21.8 9.6 22H23.8C27.5 22 30.5 19 30.5 15.3C30.5 12 28.1 9.2 24.9 8.7C24 5.9 22.9 4 21.5 4Z"
                  fill="#0078D4"
                />
                <path
                  d="M9.8 10.4C6.6 10.4 4 13 4 16.2C4 19.3 6.5 21.8 9.6 22H18.5L13.6 11.4C12.5 10.7 11.2 10.4 9.8 10.4Z"
                  fill="#0364B8"
                />
                <path
                  d="M9.6 22H23.8C25.8 22 27.6 21.1 28.8 19.7L20.5 14.5L9.6 22Z"
                  fill="#28A8EA"
                />
                {status?.connected ? (
                  <>
                    <circle cx="27" cy="20" r="6.5" fill="#107C10" stroke="#FFFFFF" strokeWidth="1.5" />
                    <path
                      d="M24.2 20.1L26.1 22L29.9 18.2"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  <>
                    <circle cx="27" cy="20" r="6.5" fill="#D13438" stroke="#FFFFFF" strokeWidth="1.5" />
                    <path
                      d="M24.8 17.8L29.2 22.2M29.2 17.8L24.8 22.2"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </span>
          </Tooltip>
        </div>

        {statusLoading ? (
          <div className={styles.skeletonContainer}>
            <div className={styles.row}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className={styles.skeletonShimmer} style={{ width: "160px", height: "18px" }} />
                <div className={styles.skeletonShimmer} style={{ width: "220px", height: "14px" }} />
              </div>
              <div className={styles.skeletonShimmer} style={{ width: "80px", height: "32px", borderRadius: "4px" }} />
            </div>
            <div className={styles.row}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className={styles.skeletonShimmer} style={{ width: "140px", height: "18px" }} />
                <div className={styles.skeletonShimmer} style={{ width: "280px", height: "14px" }} />
              </div>
              <div className={styles.skeletonShimmer} style={{ width: "40px", height: "22px", borderRadius: "12px" }} />
            </div>
            <div className={styles.row}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className={styles.skeletonShimmer} style={{ width: "180px", height: "14px" }} />
              </div>
              <div className={styles.skeletonShimmer} style={{ width: "110px", height: "32px", borderRadius: "4px" }} />
            </div>
          </div>
        ) : !status?.connected ? (
          <div className={styles.connectRow}>
            <div className={styles.connectMeta}>
              <h3 className={styles.label}>Link Google Drive</h3>
              <p className={styles.cardDescription} style={{ lineHeight: "1.45" }}>
                Schedule automatic end-to-end encrypted backups to your Google Drive.
              </p>
              {!isUserSignedIn && (
                <p
                  className={styles.sublabel}
                  style={{
                    color: "var(--text-secondary, #64748b)",
                    marginTop: "6px",
                    fontSize: "12px",
                  }}
                >
                  {onSignInClick ? (
                    <button
                      type="button"
                      onClick={onSignInClick}
                      className={styles.signInLink}
                      style={{ marginRight: "4px" }}
                    >
                      Sign in
                    </button>
                  ) : null}
                  <span>to connect Google Drive.</span>
                </p>
              )}
            </div>
            <button
              type="button"
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={loading || !isUserSignedIn}
              title={
                !isUserSignedIn
                  ? "Sign in to your Notepad Cloud account to connect Google Drive"
                  : undefined
              }
            >
              <GoogleDriveLogo style={{ width: "14px", height: "14px", flexShrink: 0 }} />
              <span>{loading ? "Connecting..." : "Connect Google Drive"}</span>
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "12px" }}>
            {/* Account Info */}
            <div className={styles.row}>
              <div className={styles.meta}>
                <h3 className={styles.label}>Connected Account</h3>
                <p className={styles.sublabel}>{status.googleEmail || "Active Google Account"}</p>
              </div>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDisconnect}
                disabled={loading}
              >
                Disconnect
              </button>
            </div>

            {/* Auto-backup toggle */}
            <div className={styles.row}>
              <div className={styles.meta}>
                <h3 className={styles.label}>Automatic Backup</h3>
                <p className={styles.sublabel}>
                  Autonomously backs up notes in the background (even when browser is closed)
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  aria-label="Toggle automatic backup"
                  checked={status.autoBackupEnabled}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {/* Backup frequency */}
            {status.autoBackupEnabled && (
              <div className={styles.row}>
                <div className={styles.meta}>
                  <h3 className={styles.label}>Backup Frequency</h3>
                  <p className={styles.sublabel}>Choose how frequently your notes are archived</p>
                </div>
                <select
                  className={styles.select}
                  value={status.frequency === "disabled" ? "daily" : status.frequency}
                  aria-label="Backup frequency"
                  onChange={(e) => handleFrequencyChange(e.target.value as "daily" | "weekly" | "monthly")}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            {/* Timestamps & Manual Trigger */}
            <div className={styles.row}>
              <div className={styles.meta}>
                <p className={styles.sublabel}>
                  <strong>Last Backup:</strong> {formatDate(status.lastBackupAt)}
                </p>
                {status.autoBackupEnabled && (
                  <p className={styles.sublabel}>
                    <strong>Next Backup:</strong> {formatDate(status.nextBackupAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleBackupNow}
                disabled={backingUp || backupProgressStatus === "in_progress"}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V10.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                </svg>
                {backingUp || backupProgressStatus === "in_progress" ? "Backing up..." : "Backup Now"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Backup History Table */}
      {status?.connected && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle} style={{ fontSize: "14px" }}>
            Backup History
          </h3>
          <p className={styles.cardDescription}>
            Past encrypted backups uploaded to Google Drive. Click Restore to recover notes.
          </p>

          {history.length === 0 ? (
            <div className={styles.emptyHistory}>No backups recorded yet. Click "Backup Now" to create your first backup.</div>
          ) : (
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 1).map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.created_at)}</td>
                    <td style={{ textTransform: "capitalize" }}>{entry.backup_type}</td>
                    <td>{entry.notes_count}</td>
                    <td>{formatFileSize(entry.file_size_bytes)}</td>
                    <td>
                      {entry.status === "success" && entry.drive_file_id ? (
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => setRestoreModalFile(entry)}
                        >
                          Restore
                        </button>
                      ) : (
                        <span style={{ color: "#e81123", fontSize: "11px" }}>Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Restore Confirmation Modal */}
      {restoreModalFile && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.cardTitle} style={{ fontSize: "16px" }}>
              Restore from Google Drive?
            </h3>
            <p className={styles.cardDescription} style={{ marginTop: "8px", lineHeight: "1.5" }}>
              This will safely restore <strong>{restoreModalFile.notes_count} notes</strong> created on{" "}
              <strong>{formatDate(restoreModalFile.created_at)}</strong>.
            </p>
            <p className={styles.cardDescription} style={{ marginTop: "6px", lineHeight: "1.5" }}>
              Notes will be merged into your local app. Newer versions will not be overwritten.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setRestoreModalFile(null)}
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleConfirmRestore}
                disabled={restoring}
              >
                {restoring ? "Restoring..." : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Disconnect Confirmation Dialog */}
      <DisconnectDriveModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
        isDisconnecting={loading}
        googleEmail={status?.googleEmail}
      />
    </div>
  );
};
