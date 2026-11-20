import React, { useState } from "react";
import { SignInModal } from "./components/auth/SignInModal";
import { AccountMenu, UserProfile } from "./components/header/AccountMenu";
import { TabStrip, Tab } from "./components/tabs/TabStrip";

export const App: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "note-1", title: "Untitled", isDirty: false },
  ]);
  const [activeTabId, setActiveTabId] = useState("note-1");

  const [user, setUser] = useState<UserProfile | null>({
    id: "user-tarun",
    displayName: "Tarun Kumar",
    email: "tarunkumar@csdevhub.com",
    avatarUrl: null,
  });

  const handleNewTab = () => {
    const newId = `note-${Date.now()}`;
    const newTab: Tab = { id: newId, title: "Untitled", isDirty: false };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return prev;
      const nextTabs = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(nextTabs[nextTabs.length - 1].id);
      }
      return nextTabs;
    });
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)" }}>
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        childrenRight={
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
        }
      />

      {/* Editor Body Surface */}
      <main style={{ flex: 1, backgroundColor: "var(--bg-surface)", padding: "16px" }}>
        {/* Editor surface placeholder */}
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
