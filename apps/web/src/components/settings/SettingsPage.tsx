import React, { useState } from "react";
import styles from "./SettingsPage.module.css";
import { useSettingsStore, AppTheme } from "../../stores/settingsStore";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { GoogleDriveBackup } from "./GoogleDriveBackup";

export interface SettingsPageProps {
  onBack: () => void;
  accessToken?: string;
  isGuest?: boolean;
  onSignInClick?: () => void;
  onAccountDeleted?: () => void;
}

const BackArrowIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M12.5 8a.5.5 0 0 1-.5.5H4.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L4.707 7.5H12a.5.5 0 0 1 .5.5z" />
  </svg>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  accessToken: propToken,
  isGuest,
  onSignInClick,
  onAccountDeleted,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const token = isGuest
    ? undefined
    : (propToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("notepad_token") || undefined
          : undefined));
  const {
    theme,
    fontFamily,
    fontSize,
    wordWrap,
    spellCheck,
    autoCorrect,
    setTheme,
    setFontFamily,
    setFontSize,
    setWordWrap,
    setSpellCheck,
    setAutoCorrect,
  } = useSettingsStore();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Back to editor"
        >
          <BackArrowIcon />
        </button>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <div className={styles.content}>
        {/* App theme */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>App theme</h2>
              <p className={styles.cardDescription}>
                Select which app theme to display
              </p>
            </div>
            <select
              className={styles.select}
              value={theme}
              aria-label="App theme"
              onChange={(e) => setTheme(e.target.value as AppTheme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Use system setting</option>
            </select>
          </div>
        </section>

        {/* Font settings */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>Font family</h2>
              <p className={styles.cardDescription}>
                Choose font family for note editing
              </p>
            </div>
            <select
              className={styles.select}
              value={fontFamily}
              aria-label="Font family"
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="Consolas">Consolas</option>
              <option value="Segoe UI Variable">Segoe UI Variable</option>
              <option value="Cascadia Code">Cascadia Code</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>

          <div className={styles.cardRow} style={{ marginTop: "12px" }}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>Font size</h2>
              <p className={styles.cardDescription}>
                Adjust the editor font size
              </p>
            </div>
            <select
              className={styles.select}
              value={fontSize}
              aria-label="Font size"
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              <option value="11">11 pt</option>
              <option value="12">12 pt</option>
              <option value="14">14 pt</option>
              <option value="16">16 pt</option>
              <option value="18">18 pt</option>
              <option value="20">20 pt</option>
              <option value="24">24 pt</option>
            </select>
          </div>
        </section>

        {/* Word wrap */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>Word wrap</h2>
              <p className={styles.cardDescription}>
                Wrap lines to fit the window width
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                aria-label="Word wrap switch"
                checked={wordWrap}
                onChange={(e) => setWordWrap(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </section>

        {/* Spell check */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>Spelling</h2>
              <p className={styles.cardDescription}>
                Check spelling while typing
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                aria-label="Spelling check switch"
                checked={spellCheck}
                onChange={(e) => setSpellCheck(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </section>

        {/* Autocorrect */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle}>Autocorrect</h2>
              <p className={styles.cardDescription}>
                Automatically correct misspelled words
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                aria-label="Autocorrect switch"
                checked={autoCorrect}
                onChange={(e) => setAutoCorrect(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>
        </section>

        {/* About */}
        <section className={styles.card}>
          <div className={styles.cardMeta}>
            <h2 className={styles.cardTitle}>About Notepad Cloud</h2>
            <p className={styles.cardDescription}>
              Version 1.0.0 • Client-side End-to-End Encrypted Notepad
            </p>
            <p className={styles.cardDescription} style={{ marginTop: "4px" }}>
              Pixel-perfect Windows 11 replica running anywhere.
            </p>
          </div>
        </section>

        {/* Google Drive Backup & Restore */}
        <GoogleDriveBackup
          accessToken={token}
          isGuest={isGuest}
          onSignInClick={onSignInClick}
          onRestored={onBack}
        />

        {/* Account & Data */}
        <section className={styles.card}>
          <div className={styles.cardRow}>
            <div className={styles.cardMeta}>
              <h2 className={styles.cardTitle} style={{ color: "#e81123" }}>
                Account & Privacy
              </h2>
              <p className={styles.cardDescription}>
                Permanently purge all cloud notes, encryption keys, and account records.
              </p>
            </div>
            <button
              type="button"
              className={styles.select}
              style={{
                width: "auto",
                backgroundColor: "rgba(232, 17, 35, 0.1)",
                color: "#e81123",
                borderColor: "rgba(232, 17, 35, 0.3)",
                fontWeight: 600,
                cursor: "pointer",
                padding: "6px 14px",
              }}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          setIsDeleteModalOpen(false);
          onAccountDeleted?.();
          onBack();
        }}
        accessToken={token}
      />
    </div>
  );
};
