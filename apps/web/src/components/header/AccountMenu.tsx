import React, { useState, useRef, useEffect } from "react";
import styles from "./AccountMenu.module.css";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AccountMenuProps {
  user: UserProfile | null;
  onSignInClick?: () => void;
  onSignOut?: () => Promise<void> | void;
  onManageVault?: () => void;
  isVaultLocked?: boolean;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  onSignInClick,
  onSignOut,
  onManageVault,
  isVaultLocked = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!user) {
      if (onSignInClick) onSignInClick();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    if (onSignOut) {
      await onSignOut();
    }
  };

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : "";

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={handleToggle}
        aria-label={user ? `Account: ${user.displayName}` : "Sign in"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.avatarCircle}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
          ) : user ? (
            <span>{initial}</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 8.68 10.05 8 8 8c-2.05 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
            </svg>
          )}
        </div>
      </button>

      {isOpen && user && (
        <div className={styles.flyout} role="dialog" aria-label="Account details">
          <div className={styles.profileRow}>
            <div className={styles.profileAvatar}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.displayName}>{user.displayName}</div>
              <div className={styles.email}>{user.email}</div>
            </div>
          </div>

          <hr className={styles.divider} />

          {onManageVault && (
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                onManageVault();
              }}
              aria-label="Vault & Encryption"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1zm2 5H6V4.5a2 2 0 1 1 4 0V6z" />
              </svg>
              <span>{isVaultLocked ? "Unlock Vault" : "Vault Settings"}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.menuItem}
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 12.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-7A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
              />
              <path
                fillRule="evenodd"
                d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
              />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
