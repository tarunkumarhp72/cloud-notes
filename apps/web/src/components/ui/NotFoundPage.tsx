import React from "react";
import styles from "./NotFoundPage.module.css";

export interface NotFoundPageProps {
  path?: string;
  onGoHome: () => void;
  onGoHistory?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  path = "/",
  onGoHome,
  onGoHistory,
}) => {
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
          Page not found
        </h1>
        <p className={styles.description}>
          The route <span className={styles.pathChip}>{path}</span> does not exist in Notepad Cloud.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onGoHome}>
            Back to Editor
          </button>
          {onGoHistory && (
            <button type="button" className={styles.secondaryBtn} onClick={onGoHistory}>
              Recent Notes
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export interface ProtectedRoutePageProps {
  routeName?: string;
  onSignIn: () => void;
  onBack: () => void;
}

export const ProtectedRoutePage: React.FC<ProtectedRoutePageProps> = ({
  routeName = "Recycle Bin",
  onSignIn,
  onBack,
}) => {
  return (
    <main className={styles.page} aria-labelledby="protected-route-title">
      <div className={styles.card}>
        <div className={styles.illustrationWrap} aria-hidden="true">
          <div className={styles.pulseRing} />
          <svg
            className={styles.floatingDoc}
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect
              x="14"
              y="28"
              width="36"
              height="26"
              rx="6"
              fill="var(--bg-app)"
              stroke="var(--accent-primary, #0078d4)"
              strokeWidth="2.5"
            />
            <path
              d="M22 28V20C22 14.4772 26.4772 10 32 10C37.5228 10 42 14.4772 42 20V28"
              stroke="var(--accent-primary, #0078d4)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="40" r="3.5" fill="var(--accent-primary, #0078d4)" />
          </svg>
        </div>

        <span className={styles.codeBadge}>PROTECTED ROUTE</span>
        <h1 id="protected-route-title" className={styles.title}>
          Sign in required
        </h1>
        <p className={styles.description}>
          {routeName} is only available for signed-in users. Sign in to access your deleted notes and cloud features.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onSignIn}>
            Sign in
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onBack}>
            Back to Editor
          </button>
        </div>
      </div>
    </main>
  );
};
