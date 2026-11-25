import React, { useState, useEffect, useCallback } from "react";
import styles from "./GoogleDriveBackup.module.css";
import { webConfig } from "../../config";
import { fetchWithAuth, getValidAccessToken } from "../../auth/tokenManager";

export interface GoogleDriveBackupProps {
  accessToken?: string;
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

const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
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
  onRestored,
}) => {
  const [effectiveToken, setEffectiveToken] = useState<string | undefined>(() => {
    return (
      propToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("notepad_token") || undefined
        : undefined)
    );
  });

  useEffect(() => {
    getValidAccessToken().then((tok) => {
      if (tok) {
        setEffectiveToken(tok);
      } else if (propToken) {
        setEffectiveToken(propToken);
      }
    });
  }, [propToken]);

  const accessToken = effectiveToken;
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restoreModalFile, setRestoreModalFile] = useState<BackupHistoryEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore network errors
    }
  }, [accessToken]);

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
  }, [fetchStatus, fetchHistory]);

  const handleConnect = async () => {
    if (!accessToken) return;
    setLoading(true);
    setMessage(null);
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
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to connect to Google Drive",
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;
    if (!window.confirm("Are you sure you want to disconnect Google Drive? Automatic backups will stop.")) return;

    setLoading(true);
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Google Drive disconnected successfully." });
        await fetchStatus();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to disconnect Google Drive." });
    } finally {
      setLoading(false);
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
      setMessage({ type: "error", text: "Failed to update backup settings." });
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
      setMessage({ type: "error", text: "Failed to update backup frequency." });
    }
  };

  const handleBackupNow = async () => {
    if (!accessToken) return;
    setBackingUp(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth(`${webConfig.apiBaseUrl}/api/backup/now`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backup failed");

      setMessage({
        type: "success",
        text: `Backup created successfully (${data.backup?.notesCount || 0} notes backed up).`,
      });
      await fetchStatus();
      await fetchHistory();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Manual backup failed",
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

      setMessage({
        type: "success",
        text: `Successfully restored ${data.restore?.restoredCount || 0} notes (${data.restore?.skippedCount || 0} already up-to-date).`,
      });
      setRestoreModalFile(null);
      onRestored?.();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Restore operation failed",
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
                Automatic end-to-end encrypted cloud backup
              </p>
            </div>
          </div>
          <span
            className={`${styles.statusBadge} ${
              status?.connected ? styles.connectedBadge : styles.disconnectedBadge
            }`}
          >
            <span className={styles.statusDot} />
            {status?.connected ? "Connected" : "Not Connected"}
          </span>
        </div>

        {message && (
          <div
            className={`${styles.alert} ${
              message.type === "success" ? styles.alertSuccess : styles.alertError
            }`}
          >
            {message.text}
          </div>
        )}

        {!status?.connected ? (
          <div style={{ marginTop: "14px" }}>
            <p className={styles.cardDescription} style={{ marginBottom: "14px", lineHeight: "1.5" }}>
              Link your personal Google Drive to schedule automatic encrypted backups. Your notes are protected with
              end-to-end encryption before upload. Even Google cannot view your notes.
            </p>
            <button
              type="button"
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={loading || !accessToken}
            >
              <GoogleDriveLogo style={{ width: "16px", height: "16px" }} />
              {loading ? "Connecting..." : "Connect Google Drive"}
            </button>
            {!accessToken && (
              <p className={styles.sublabel} style={{ color: "#e81123", marginTop: "8px" }}>
                Sign in to your Notepad Cloud account to connect Google Drive.
              </p>
            )}
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
                disabled={backingUp}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V10.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                </svg>
                {backingUp ? "Backing up..." : "Backup Now"}
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
                {history.map((entry) => (
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
    </div>
  );
};
