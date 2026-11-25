import React from "react";
import styles from "./NotFoundPage.module.css";

export interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        <div className={styles.illustrationWrap} aria-hidden="true">
          <div className={styles.pulseRing} />
          <span className={styles.sparkleOne} />
          <span className={styles.sparkleTwo} />
          <svg
            className={styles.floatingDoc}
            width="68"
            height="68"
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect
              x="12"
              y="8"
              width="40"
              height="48"
              rx="6"
              fill="var(--bg-app)"
              stroke="var(--accent-primary, #0078d4)"
              strokeWidth="2.5"
            />
            <path d="M22 22H42" stroke="var(--border-strong, #94a3b8)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 31H36" stroke="var(--border-strong, #94a3b8)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="44" cy="44" r="11" fill="var(--accent-primary, #0078d4)" />
            <path
              d="M44 39.5V44.5M44 48V48.5"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <span className={styles.codeBadge}>404 • NOT FOUND</span>
        <h1 id="not-found-title" className={styles.title}>
          This page is not found
        </h1>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onGoHome}>
            Back to Notes
          </button>
        </div>
      </div>
    </main>
  );
};
