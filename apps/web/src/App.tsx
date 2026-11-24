import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { SignInModal } from "./components/auth/SignInModal";
import { validateGoogleCallback } from "./auth/googleAuth";
import { AccountMenu, UserProfile } from "./components/header/AccountMenu";
import { TabStrip } from "./components/tabs/TabStrip";
import { MenuBar } from "./components/menu/MenuBar";
import { FileMenu } from "./components/menu/FileMenu";
import { EditMenu } from "./components/menu/EditMenu";
import { ViewMenu } from "./components/menu/ViewMenu";
import { HeadingDropdown, HeadingLevel } from "./components/toolbar/HeadingDropdown";
import { ListDropdown } from "./components/toolbar/ListDropdown";
import { FormatButtons, ClearFormattingButton } from "./components/toolbar/FormatButtons";
import { LinkModal, LinkButton } from "./components/toolbar/LinkModal";
import { TableDropdown } from "./components/toolbar/TableDropdown";
import { SettingsPage } from "./components/settings/SettingsPage";
import { Tooltip } from "./components/ui/Tooltip";
import { SettingsIcon } from "./components/icons/SettingsIcon";
import { TipTapEditorRef } from "./components/editor/TipTapEditor";
import { FindReplaceBar } from "./components/editor/FindReplaceBar";
import { GoToDialog } from "./components/editor/GoToDialog";
import { StatusBar } from "./components/statusbar/StatusBar";
import { CodeMirrorEditorRef } from "./components/editor/CodeMirrorEditor";
import { listNotes, createNoteEnvelope, openNoteEnvelope } from "@notepad/core";
import { useNotepadShortcuts } from "./shortcuts/shortcutsDispatcher";
import { useLocalAutoSave } from "./sync/localAutoSave";
import { SyncEngine, type SyncStatus } from "./sync/syncEngine";
import { TabBroadcastSync } from "./sync/broadcast";
import { networkMonitor } from "./sync/networkStatus";
import { useVisualViewport } from "./hooks/useVisualViewport";
import { exportNoteToFile, readFileAsText, useFileDragAndDrop } from "./components/file/fileIo";
import { OpenNotesDialog } from "./components/file/OpenNotesDialog";
import { VaultUnlockModal } from "./components/vault/VaultUnlockModal";
import { RecoveryKeyModal } from "./components/vault/RecoveryKeyModal";
import { NoteLimitModal } from "./components/tabs/NoteLimitModal";
import { useVaultStore } from "./stores/vaultStore";
import { useTabsStore } from "./stores/tabsStore";
import { useSettingsStore } from "./stores/settingsStore";

const GUEST_NOTE_LIMIT = 10;
const USER_NOTE_LIMIT = 50;

const CodeMirrorEditor = lazy(() =>
  import("./components/editor/CodeMirrorEditor").then((m) => ({
    default: m.CodeMirrorEditor,
  }))
);

const TipTapEditor = lazy(() =>
  import("./components/editor/TipTapEditor").then((m) => ({
    default: m.TipTapEditor,
  }))
);

export const App: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [markdownMode, setMarkdownMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>("title");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [canIndent, setCanIndent] = useState(false);
  const [canOutdent, setCanOutdent] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [recoveryModalMode, setRecoveryModalMode] = useState<"display" | "recover">("display");
  const [activeRecoveryKey, setActiveRecoveryKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, charCount: 0 });
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [isGoToOpen, setIsGoToOpen] = useState(false);
  const [findMatches, setFindMatches] = useState({ current: 0, total: 0 });
  const [findQuery, setFindQuery] = useState("");
  const [findMatchCase, setFindMatchCase] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const tipTapRef = useRef<TipTapEditorRef>(null);
  const codeMirrorRef = useRef<CodeMirrorEditorRef>(null);
  const syncEngineRef = useRef<SyncEngine | null>(null);
  const broadcastRef = useRef<TabBroadcastSync | null>(null);

  useEffect(() => {
    const apiBaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
    syncEngineRef.current = new SyncEngine({
      pushUrl: apiBaseUrl ? `${apiBaseUrl}/api/sync/push` : "/api/sync/push",
      getAccessToken: () => localStorage.getItem("notepad_token") || null,
    });

    const unsubscribe = syncEngineRef.current.subscribe((status) => {
      setSyncStatus(status);
    });

    const broadcast = new TabBroadcastSync();
    broadcastRef.current = broadcast;

    const unsubBroadcast = broadcast.subscribe((event) => {
      if (event.type === "NOTE_UPDATED") {
        const existing = useTabsStore.getState().tabs.find((t) => t.id === event.payload.noteId);
        if (existing && existing.content !== event.payload.content) {
          useTabsStore.getState().updateTabContent(event.payload.noteId, event.payload.content);
          if (event.payload.title && existing.title !== event.payload.title) {
            useTabsStore.getState().setTabTitle(event.payload.noteId, event.payload.title);
          }
        }
      } else if (event.type === "TAB_CREATED") {
        const existing = useTabsStore.getState().tabs.some((t) => t.id === event.payload.noteId);
        if (!existing) {
          useTabsStore.getState().createTab(event.payload.title, event.payload.content, event.payload.isMarkdown);
        }
      } else if (event.type === "TAB_CLOSED") {
        const currentTabs = useTabsStore.getState().tabs;
        const exists = currentTabs.some((t) => t.id === event.payload.noteId);
        if (exists && currentTabs.length > 1) {
          useTabsStore.getState().closeTab(event.payload.noteId);
        }
      } else if (event.type === "VAULT_STATUS_CHANGED") {
        useVaultStore.getState().checkVaultStatus();
      }
    });

    const unsubNetwork = networkMonitor.subscribe((online) => {
      if (!online) {
        setSyncStatus("offline");
      }
    });

    async function initLocalNotes() {
      try {
        const stored = await listNotes();
        if (stored && stored.length > 0) {
          const currentTabs = useTabsStore.getState().tabs;
          const isInitialOnly =
            currentTabs.length === 1 &&
            currentTabs[0].title === "Untitled" &&
            currentTabs[0].content === "" &&
            !currentTabs[0].isDirty;

          if (isInitialOnly) {
            const sorted = [...stored].sort(
              (a, b) => new Date(b.clientUpdatedAt).getTime() - new Date(a.clientUpdatedAt).getTime()
            );
            const first = sorted[0];
            let title = "Untitled";
            let content = "";
            let isMarkdown = true;
            try {
              const parsed = JSON.parse(first.encryptedEnvelope);
              title = parsed.title || "Untitled";
              content = parsed.content || "";
              isMarkdown = true; // Always default to rich text WYSIWYG
            } catch {
              content = first.encryptedEnvelope;
              isMarkdown = true;
            }
            useTabsStore.getState().updateTabContent(currentTabs[0].id, content);
            useTabsStore.getState().setTabTitle(currentTabs[0].id, title);
            useTabsStore.getState().setTabDirty(currentTabs[0].id, false);
            useTabsStore.getState().setTabMarkdown(currentTabs[0].id, isMarkdown);
            setMarkdownMode(isMarkdown);
          }
        }
      } catch (err) {
        console.warn("Could not load local notes on boot:", err);
      }
    }

    initLocalNotes();

    return () => {
      unsubscribe();
      unsubBroadcast();
      unsubNetwork();
      syncEngineRef.current?.destroy();
      broadcast.destroy();
    };
  }, []);

  const { isInitialized: isVaultInitialized, isLocked: isVaultLocked, checkVaultStatus } = useVaultStore();

  useEffect(() => {
    checkVaultStatus();
  }, [checkVaultStatus]);

  const { fontFamily, fontSize, wordWrap, setWordWrap } = useSettingsStore();

  const {
    tabs,
    activeTabId,
    createTab,
    closeTab,
    selectTab,
    updateTabContent,
    setTabDirty,
    reorderTabs,
    cycleNextTab,
    cyclePreviousTab,
  } = useTabsStore();

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const isMarkdownActive = activeTab ? activeTab.isMarkdown : markdownMode;

  const getActiveEditor = useCallback(() => {
    if (isMarkdownActive) {
      return tipTapRef.current;
    }
    return codeMirrorRef.current;
  }, [isMarkdownActive]);

  const handleNewTab = (title?: string, content?: string, isMarkdown = true) => {
    const maxLimit = user ? USER_NOTE_LIMIT : GUEST_NOTE_LIMIT;
    if (tabs.length >= maxLimit) {
      setShowLimitModal(true);
      return null;
    }
    const newId = createTab(title, content, isMarkdown);
    broadcastRef.current?.broadcast({
      type: "TAB_CREATED",
      payload: { noteId: newId, title: title || "Untitled", content: content || "", isMarkdown: isMarkdown },
    });
    return newId;
  };

  const handleCloseTab = (id: string) => {
    closeTab(id);
    broadcastRef.current?.broadcast({
      type: "TAB_CLOSED",
      payload: { noteId: id },
    });
  };

  // Local auto-save to IndexedDB (1s debounce, 10s forced flush)
  useLocalAutoSave(activeTab, async (savedId) => {
    setTabDirty(savedId, false);
    setSyncStatus("saved");

    let envelopePayload = JSON.stringify({
      title: activeTab?.title,
      content: activeTab?.content,
      isMarkdown: activeTab?.isMarkdown,
    });

    const vKey = useVaultStore.getState().vaultKey;
    if (vKey && activeTab) {
      try {
        const envelope = await createNoteEnvelope(vKey, {
          id: savedId,
          title: activeTab.title,
          content: activeTab.content,
          isMarkdown: activeTab.isMarkdown,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        envelopePayload = JSON.stringify(envelope);
      } catch (err) {
        console.error("Failed to encrypt note envelope with vault key:", err);
      }
    }

    syncEngineRef.current?.onLocalNoteSaved(savedId, envelopePayload);
    if (activeTab) {
      broadcastRef.current?.broadcast({
        type: "NOTE_UPDATED",
        payload: {
          noteId: savedId,
          content: activeTab.content,
          title: activeTab.title,
        },
      });
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("notepad_user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Automatically refresh profile on mount to load freshest avatarUrl and displayName
  useEffect(() => {
    const token = localStorage.getItem("notepad_token");
    if (!token) return;

    const apiBaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
    fetch(`${apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser((prev) => {
            const updated = { ...prev, ...data.user };
            localStorage.setItem("notepad_user", JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to auto-refresh user profile:", err);
      });
  }, []);

  // Handle Google OAuth callback (?code=...&state=... or ?token=...&user=...)
  useEffect(() => {
    async function handleOAuthCallback() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const token = searchParams.get("token");
      const userJson = searchParams.get("user");
      const errorParam = searchParams.get("error");

      // Flow 1: Backend redirect (from http://localhost:3001/auth/callback)
      if (token && userJson) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userJson));
          setUser(parsedUser);
          localStorage.setItem("notepad_user", JSON.stringify(parsedUser));
          localStorage.setItem("notepad_token", token);
          setShowSignIn(false);
        } catch (e) {
          console.error("Failed to parse user from query:", e);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname.replace(/\/auth\/callback\/?$/, "/") || "/");
        }
        return;
      }

      if (errorParam) {
        console.error("OAuth error:", errorParam);
        window.history.replaceState({}, document.title, window.location.pathname.replace(/\/auth\/callback\/?$/, "/") || "/");
        return;
      }

      // Flow 2: Frontend PKCE redirect (from http://localhost:3000/auth/callback)
      if (code && state) {
        try {
          const redirectUri =
            (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_REDIRECT_URI) ||
            `${window.location.origin}/auth/callback`;

          const { verifier } = validateGoogleCallback(searchParams, state);

          const apiBaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
          const res = await fetch(`${apiBaseUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              codeVerifier: verifier,
              redirectUri,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Google authentication failed");
          }

          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("notepad_user", JSON.stringify(data.user));
            if (data.accessToken) {
              localStorage.setItem("notepad_token", data.accessToken);
            }
            setShowSignIn(false);
          }
        } catch (err) {
          console.error("Google sign in callback error:", err);
        } finally {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname.replace(/\/auth\/callback\/?$/, "/") || "/"
          );
        }
      }
    }

    handleOAuthCallback();
  }, []);

  // Native drag-and-drop file import (.txt, .md, etc.)
  useFileDragAndDrop((imported) => {
    handleNewTab(imported.filename, imported.content, imported.isMarkdown);
  });

  const isDesktop =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }).__TAURI__ ||
        (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    );

  const handleSelectAll = useCallback(() => {
    if (activeTab?.isMarkdown || markdownMode) {
      tipTapRef.current?.selectAll();
    } else {
      codeMirrorRef.current?.selectAll();
    }
  }, [activeTab?.isMarkdown, markdownMode]);

  const ensureRichText = useCallback(() => {
    if (!activeTab?.isMarkdown || !markdownMode) {
      setMarkdownMode(true);
      if (activeTabId) {
        useTabsStore.getState().setTabMarkdown(activeTabId, true);
      }
    }
  }, [activeTab?.isMarkdown, markdownMode, activeTabId]);

  const handleToggleBold = useCallback(() => {
    ensureRichText();
    tipTapRef.current?.toggleBold();
  }, [ensureRichText]);

  const handleToggleItalic = useCallback(() => {
    ensureRichText();
    tipTapRef.current?.toggleItalic();
  }, [ensureRichText]);

  const handleToggleStrike = useCallback(() => {
    ensureRichText();
    tipTapRef.current?.toggleStrike();
  }, [ensureRichText]);

  // Windows Notepad Global Shortcuts Dispatcher
  useNotepadShortcuts({
    isDesktop,
    onNewTab: () => handleNewTab(),
    onNewWindow: () => window.open(window.location.href, "_blank"),
    onOpen: () => setShowOpenDialog(true),
    onSave: () => {
      if (activeTab) {
        exportNoteToFile(activeTab.title, activeTab.content, activeTab.isMarkdown);
      }
    },
    onSaveAs: () => {
      if (activeTab) {
        exportNoteToFile(activeTab.title, activeTab.content, activeTab.isMarkdown);
      }
    },
    onCloseTab: () => handleCloseTab(activeTabId),
    onFind: () => {
      setIsFindOpen(true);
      setIsReplaceOpen(false);
    },
    onReplace: () => {
      setIsFindOpen(true);
      setIsReplaceOpen(true);
    },
    onGoTo: () => setIsGoToOpen(true),
    onSelectAll: handleSelectAll,
    onToggleBold: handleToggleBold,
    onToggleItalic: handleToggleItalic,
    onTimeDate: () => {
      const now = new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString();
      if (activeTabId) {
        updateTabContent(activeTabId, (activeTab?.content || "") + " " + now);
      }
    },
    onZoomIn: () => setZoomLevel((z) => Math.min(500, z + 10)),
    onZoomOut: () => setZoomLevel((z) => Math.max(10, z - 10)),
    onResetZoom: () => setZoomLevel(100),
    onNextTab: () => cycleNextTab(),
    onPrevTab: () => cyclePreviousTab(),
    onSelectTabByIndex: (index) => {
      if (tabs[index]) {
        selectTab(tabs[index].id);
      }
    },
  });

  useVisualViewport();

  return (
    <div className="appContainer" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Line 1: Title Bar with TabStrip and Window Controls */}
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={selectTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => handleNewTab()}
        onReorderTabs={reorderTabs}
        showCaptionControls={isDesktop}
      />

      {/* Line 2: Menu Bar with File, Edit, View, Formatting Tools, Account & Settings */}
      <MenuBar
        renderFileDropdown={() => (
          <FileMenu
            isDesktop={isDesktop}
            onNewTab={() => handleNewTab()}
            onNewWindow={() => window.open(window.location.href, "_blank")}
            onNewMarkdownTab={() => handleNewTab("Untitled.md", "", true)}
            onOpen={() => setShowOpenDialog(true)}
            onSave={() => {
              if (activeTab) {
                exportNoteToFile(activeTab.title, activeTab.content, activeTab.isMarkdown);
              }
            }}
            onSaveAs={() => {
              if (activeTab) {
                exportNoteToFile(activeTab.title, activeTab.content, activeTab.isMarkdown);
              }
            }}
            onSaveAll={() => {
              tabs.forEach((tab) => {
                exportNoteToFile(tab.title, tab.content, tab.isMarkdown);
              });
            }}
            onCloseTab={() => handleCloseTab(activeTabId)}
            onPrint={() => window.print()}
          />
        )}
        renderEditDropdown={() => (
          <EditMenu
            isDesktop={isDesktop}
            canUndo={true}
            canCut={true}
            canCopy={true}
            canPaste={true}
            canDelete={true}
            onUndo={() => {
              getActiveEditor()?.undo();
            }}
            onCut={() => {
              getActiveEditor()?.cut();
            }}
            onCopy={() => {
              getActiveEditor()?.copy();
            }}
            onPaste={async () => {
              await getActiveEditor()?.paste();
            }}
            onDelete={() => {
              getActiveEditor()?.deleteSelection();
            }}
            onClearFormatting={() => {
              getActiveEditor()?.clearFormatting();
              setIsBold(false);
              setIsItalic(false);
              setIsStrikethrough(false);
              setHeadingLevel("body");
            }}
            onFind={() => {
              setIsFindOpen(true);
              setIsReplaceOpen(false);
            }}
            onFindNext={() => {
              setIsFindOpen(true);
              const editor = getActiveEditor();
              if (editor && findQuery) {
                const info = editor.findNext(findQuery, findMatchCase, true);
                setFindMatches(info);
              }
            }}
            onFindPrevious={() => {
              setIsFindOpen(true);
              const editor = getActiveEditor();
              if (editor && findQuery) {
                const info = editor.findPrevious(findQuery, findMatchCase, true);
                setFindMatches(info);
              }
            }}
            onReplace={() => {
              setIsFindOpen(true);
              setIsReplaceOpen(true);
            }}
            onGoTo={() => setIsGoToOpen(true)}
            onSelectAll={handleSelectAll}
            onTimeDate={() => {
              const now =
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                " " +
                new Date().toLocaleDateString();
              getActiveEditor()?.insertText(now);
            }}
            onFont={() => setIsSettingsOpen(true)}
          />
        )}
        renderViewDropdown={() => (
          <ViewMenu
            isDesktop={isDesktop}
            statusBarVisible={statusBarVisible}
            wordWrap={wordWrap}
            markdownMode={isMarkdownActive}
            zoomLevel={zoomLevel}
            onToggleStatusBar={() => setStatusBarVisible((v) => !v)}
            onToggleWordWrap={() => setWordWrap(!wordWrap)}
            onToggleMarkdown={() => {
              const next = !isMarkdownActive;
              setMarkdownMode(next);
              if (activeTabId) {
                useTabsStore.getState().setTabMarkdown(activeTabId, next);
              }
            }}
            onZoomIn={() => setZoomLevel((z) => Math.min(500, z + 10))}
            onZoomOut={() => setZoomLevel((z) => Math.max(10, z - 10))}
            onResetZoom={() => setZoomLevel(100)}
          />
        )}
        childrenToolbar={
          <div
            className="responsiveToolbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              overflow: "visible",
              maxWidth: "100%",
            }}
          >
            <HeadingDropdown
              activeLevel={headingLevel}
              onSelectLevel={(level) => {
                ensureRichText();
                setHeadingLevel(level);
                if (level === "body") {
                  tipTapRef.current?.setParagraph();
                } else {
                  const levelMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
                    title: 1,
                    subtitle: 2,
                    heading: 3,
                    subheading: 4,
                    section: 5,
                    subsection: 6,
                  };
                  const num = levelMap[level] || 1;
                  tipTapRef.current?.setHeading(num);
                }
              }}
            />
            <ListDropdown
              canIndent={canIndent}
              canOutdent={canOutdent}
              onToggleBullet={() => {
                ensureRichText();
                tipTapRef.current?.toggleBulletList();
              }}
              onToggleNumber={() => {
                ensureRichText();
                tipTapRef.current?.toggleOrderedList();
              }}
              onIndent={() => {
                tipTapRef.current?.indent?.();
              }}
              onOutdent={() => {
                tipTapRef.current?.outdent?.();
              }}
            />
            <FormatButtons
              isBold={isBold}
              isItalic={isItalic}
              isStrikethrough={isStrikethrough}
              showClearFormatting={false}
              onToggleBold={handleToggleBold}
              onToggleItalic={handleToggleItalic}
              onToggleStrikethrough={handleToggleStrike}
            />
            <LinkButton onClick={() => setShowLinkModal(true)} />
            <TableDropdown
              onInsertTable={(rows, cols) => {
                ensureRichText();
                tipTapRef.current?.insertTable(rows, cols);
              }}
            />
            <ClearFormattingButton
              onClick={() => {
                ensureRichText();
                tipTapRef.current?.clearFormatting();
                setIsBold(false);
                setIsItalic(false);
                setIsStrikethrough(false);
                setHeadingLevel("body");
              }}
            />
          </div>
        }
        childrenRight={
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AccountMenu
              user={user}
              onSignInClick={() => setShowSignIn(true)}
              onSignOut={() => {
                setUser(null);
                try {
                  localStorage.removeItem("notepad_user");
                  localStorage.removeItem("notepad_token");
                } catch {}
              }}
              onManageVault={() => setShowVaultModal(true)}
              isVaultLocked={isVaultLocked}
            />

            {/* Settings Button */}
            <Tooltip content="Settings" position="bottom" align="end">
              <button
                type="button"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSettingsOpen ? "var(--bg-active)" : "none",
                  border: "none",
                  borderRadius: "4px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
                aria-label="Settings"
                onClick={() => setIsSettingsOpen((prev) => !prev)}
              >
                <SettingsIcon size={16} />
              </button>
            </Tooltip>
          </div>
        }
      />

      {/* Body: Settings or Editor Surface */}
      {isSettingsOpen ? (
        <SettingsPage onBack={() => setIsSettingsOpen(false)} />
      ) : (
        <div
          className="editorAreaContainer"
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--bg-surface)",
            width: "100%",
            maxWidth: "100%",
            zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
          }}
        >
          <FindReplaceBar
            isOpen={isFindOpen}
            isReplaceOpen={isReplaceOpen}
            onClose={() => setIsFindOpen(false)}
            onToggleReplace={() => setIsReplaceOpen((v) => !v)}
            onQueryChange={(query, matchCase) => {
              setFindQuery(query);
              setFindMatchCase(matchCase);
              const editor = getActiveEditor();
              if (editor) {
                const info = editor.getMatchesInfo(query, matchCase);
                setFindMatches(info);
              }
            }}
            onFindNext={(query, matchCase, wrapAround) => {
              setFindQuery(query);
              setFindMatchCase(matchCase);
              const editor = getActiveEditor();
              if (editor) {
                const info = editor.findNext(query, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onFindPrevious={(query, matchCase, wrapAround) => {
              setFindQuery(query);
              setFindMatchCase(matchCase);
              const editor = getActiveEditor();
              if (editor) {
                const info = editor.findPrevious(query, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onReplace={(query, replacement, matchCase, wrapAround) => {
              const editor = getActiveEditor();
              if (editor) {
                const info = editor.replace(query, replacement, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onReplaceAll={(query, replacement, matchCase) => {
              const editor = getActiveEditor();
              if (editor) {
                editor.replaceAll(query, replacement, matchCase);
                setFindMatches({ current: 0, total: 0 });
              }
            }}
            currentMatch={findMatches.current}
            totalMatches={findMatches.total}
          />

          <GoToDialog
            isOpen={isGoToOpen}
            onClose={() => setIsGoToOpen(false)}
            currentLine={cursorPos.line}
            maxLine={getActiveEditor()?.getTotalLines() || 1}
            onGoTo={(line) => {
              getActiveEditor()?.goToLine(line);
            }}
          />

          {isMarkdownActive ? (
            <Suspense fallback={<div style={{ flex: 1, backgroundColor: "var(--bg-surface)" }} />}>
              <TipTapEditor
                ref={tipTapRef}
                value={activeTab?.content || ""}
                onChange={(val) => {
                  if (activeTabId) {
                    updateTabContent(activeTabId, val);
                  }
                }}
                onCursorChange={(line, col, charCount) => {
                  setCursorPos({ line, col, charCount });
                }}
                onActiveFormatsChange={({ isBold, isItalic, isStrikethrough, headingLevel, canIndent, canOutdent }) => {
                  setIsBold(isBold);
                  setIsItalic(isItalic);
                  setIsStrikethrough(isStrikethrough);
                  setHeadingLevel(headingLevel);
                  setCanIndent(canIndent);
                  setCanOutdent(canOutdent);
                }}
                wordWrap={wordWrap}
                fontFamily={fontFamily}
                fontSize={fontSize}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div style={{ flex: 1, backgroundColor: "var(--bg-surface)" }} />}>
              <CodeMirrorEditor
                ref={codeMirrorRef}
                value={activeTab?.content || ""}
                onChange={(val) => {
                  if (activeTabId) {
                    updateTabContent(activeTabId, val);
                  }
                }}
                onCursorChange={(line, col, charCount) => {
                  setCursorPos({ line, col, charCount });
                }}
                wordWrap={wordWrap}
                fontFamily={fontFamily}
                fontSize={fontSize}
              />
            </Suspense>
          )}
        </div>
      )}

      {/* Line 3: Bottom Status Bar */}
      <StatusBar
        visible={statusBarVisible}
        line={cursorPos.line}
        col={cursorPos.col}
        charCount={cursorPos.charCount}
        mode={isMarkdownActive ? "markdown" : "plain"}
        zoomLevel={zoomLevel}
        lineEnding="Windows (CRLF)"
        encoding="UTF-8"
        syncStatus={syncStatus === "sync_failed" ? "saved" : syncStatus}
        onRetrySync={() => syncEngineRef.current?.push()}
        onGoToClick={() => setIsGoToOpen(true)}
        onZoomClick={() => setZoomLevel(100)}
      />

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
      />

      <OpenNotesDialog
        isOpen={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
        onSelectNote={(saved) => {
          const maxLimit = user ? USER_NOTE_LIMIT : GUEST_NOTE_LIMIT;
          if (tabs.length >= maxLimit) {
            setShowLimitModal(true);
            return;
          }
          createTab(saved.title, saved.content, saved.isMarkdown);
        }}
        onOpenFileFromDisk={async (file) => {
          const maxLimit = user ? USER_NOTE_LIMIT : GUEST_NOTE_LIMIT;
          if (tabs.length >= maxLimit) {
            setShowLimitModal(true);
            return;
          }
          const imported = await readFileAsText(file);
          createTab(imported.filename, imported.content, imported.isMarkdown);
        }}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={(text, url) => {
          ensureRichText();
          tipTapRef.current?.setLink(url, text);
          setShowLinkModal(false);
        }}
      />

      <VaultUnlockModal
        isOpen={showVaultModal}
        isInitialSetup={!isVaultInitialized}
        onClose={() => setShowVaultModal(false)}
        onSetupSuccess={(key) => {
          if (key) {
            setActiveRecoveryKey(key);
            setRecoveryModalMode("display");
            setShowRecoveryModal(true);
          }
        }}
        onForgotPassphrase={() => {
          setShowVaultModal(false);
          setRecoveryModalMode("recover");
          setShowRecoveryModal(true);
        }}
        onSuccess={() => {
          setShowVaultModal(false);
        }}
      />

      <RecoveryKeyModal
        isOpen={showRecoveryModal}
        mode={recoveryModalMode}
        recoveryKey={activeRecoveryKey}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          setShowRecoveryModal(false);
        }}
      />

      <NoteLimitModal
        isOpen={showLimitModal}
        isGuest={!user}
        limit={user ? USER_NOTE_LIMIT : GUEST_NOTE_LIMIT}
        currentCount={tabs.length}
        onClose={() => setShowLimitModal(false)}
        onSignIn={() => {
          setShowLimitModal(false);
          setShowSignIn(true);
        }}
      />
    </div>
  );
};
