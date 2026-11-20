import React, { useState } from "react";
import { SignInModal } from "./components/auth/SignInModal";
import { AccountMenu, UserProfile } from "./components/header/AccountMenu";

export const App: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>({
    id: "user-tarun",
    displayName: "Tarun Kumar",
    email: "tarunkumar@csdevhub.com",
    avatarUrl: null,
  });

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)" }}>
      {/* Windows 11 Title Bar / Tab Bar matching reference */}
      <header
        style={{
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 0 12px",
          backgroundColor: "var(--bg-app)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%" }}>
          {/* Notepad Icon */}
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#FFFFFF" />
            <path d="M16 16H28" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 22H32" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 28H28" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 34H24" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Active Tab */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "6px 6px 0 0",
              fontSize: "12px",
              color: "var(--text-primary)",
              height: "32px",
              marginTop: "8px",
              border: "1px solid var(--border-subtle)",
              borderBottom: "none",
            }}
          >
            <span>Untitled</span>
            <span style={{ fontSize: "14px", cursor: "pointer", opacity: 0.7 }}>×</span>
          </div>

          {/* New Tab Button */}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
            aria-label="New tab"
          >
            +
          </button>
        </div>

        {/* Right Toolbar Area: AccountMenu and Settings (NO Copilot, NO Feedback per unwanted.png) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <AccountMenu
            user={user}
            onSignInClick={() => setShowSignIn(true)}
            onSignOut={() => setUser(null)}
          />

          {/* Settings Button */}
          <button
            type="button"
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              borderRadius: "4px",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zM5.75 8a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0z" />
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Editor Body Surface */}
      <main style={{ flex: 1, backgroundColor: "var(--bg-surface)", padding: "16px" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {/* Note content placeholder */}
        </div>
      </main>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onGoogleSignIn={() => {
          setUser({
            id: "user-tarun",
            displayName: "Tarun Kumar",
            email: "tarunkumar@csdevhub.com",
            avatarUrl: null,
          });
          setShowSignIn(false);
        }}
      />
    </div>
  );
};
