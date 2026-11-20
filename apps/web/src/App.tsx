import React, { useState, useRef, lazy, Suspense } from "react";
import { SignInModal } from "./components/auth/SignInModal";
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
import { TipTapEditorRef } from "./components/editor/TipTapEditor";
import { FindReplaceBar } from "./components/editor/FindReplaceBar";
import { GoToDialog } from "./components/editor/GoToDialog";
import { StatusBar } from "./components/statusbar/StatusBar";
import { CodeMirrorEditorRef } from "./components/editor/CodeMirrorEditor";
import { useNotepadShortcuts } from "./shortcuts/shortcutsDispatcher";
import { useLocalAutoSave } from "./sync/localAutoSave";
import { exportNoteToFile, readFileAsText, useFileDragAndDrop } from "./components/file/fileIo";
import { OpenNotesDialog } from "./components/file/OpenNotesDialog";
import { useTabsStore } from "./stores/tabsStore";
import { useSettingsStore } from "./stores/settingsStore";

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
  const [wordWrap, setWordWrap] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>("title");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, charCount: 0 });
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [isGoToOpen, setIsGoToOpen] = useState(false);
  const [findMatches, setFindMatches] = useState({ current: 0, total: 0 });
  const tipTapRef = useRef<TipTapEditorRef>(null);
  const codeMirrorRef = useRef<CodeMirrorEditorRef>(null);

  const { fontFamily, fontSize, wordWrap: settingsWordWrap } = useSettingsStore();
  const effectiveWordWrap = wordWrap || settingsWordWrap;

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

  // Local auto-save to IndexedDB (1s debounce, 10s forced flush)
  useLocalAutoSave(activeTab, (savedId) => {
    setTabDirty(savedId, false);
  });

  const [user, setUser] = useState<UserProfile | null>({
    id: "user-tarun",
    displayName: "Tarun Kumar",
    email: "tarunkumar@csdevhub.com",
    avatarUrl: null,
  });

  // Native drag-and-drop file import (.txt, .md, etc.)
  useFileDragAndDrop((imported) => {
    createTab(imported.filename, imported.content, imported.isMarkdown);
  });

  // Windows Notepad Global Shortcuts Dispatcher
  useNotepadShortcuts({
    onNewTab: () => createTab(),
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
    onCloseTab: () => closeTab(activeTabId),
    onFind: () => {
      setIsFindOpen(true);
      setIsReplaceOpen(false);
    },
    onReplace: () => {
      setIsFindOpen(true);
      setIsReplaceOpen(true);
    },
    onGoTo: () => setIsGoToOpen(true),
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

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-app)" }}>
      {/* Line 1: Title Bar with TabStrip and Window Controls */}
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={selectTab}
        onCloseTab={closeTab}
        onNewTab={() => createTab()}
        onReorderTabs={reorderTabs}
      />

      {/* Line 2: Menu Bar with File, Edit, View, Formatting Tools, Account & Settings */}
      <MenuBar
        renderFileDropdown={() => (
          <FileMenu
            onNewTab={() => createTab()}
            onNewWindow={() => window.open(window.location.href, "_blank")}
            onNewMarkdownTab={() => createTab("Untitled.md", "", true)}
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
            onCloseTab={() => closeTab(activeTabId)}
            onPrint={() => window.print()}
          />
        )}
        renderEditDropdown={() => (
          <EditMenu
            canUndo={true}
            canCut={false}
            canCopy={false}
            canPaste={true}
            canDelete={false}
            onFind={() => {
              setIsFindOpen(true);
              setIsReplaceOpen(false);
            }}
            onReplace={() => {
              setIsFindOpen(true);
              setIsReplaceOpen(true);
            }}
            onGoTo={() => setIsGoToOpen(true)}
            onTimeDate={() => {
              const now = new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString();
              console.warn("Time/Date inserted:", now);
            }}
          />
        )}
        renderViewDropdown={() => (
          <ViewMenu
            statusBarVisible={statusBarVisible}
            wordWrap={wordWrap}
            markdownMode={markdownMode}
            zoomLevel={zoomLevel}
            onToggleStatusBar={() => setStatusBarVisible((v) => !v)}
            onToggleWordWrap={() => setWordWrap((w) => !w)}
            onToggleMarkdown={() => setMarkdownMode((m) => !m)}
            onZoomIn={() => setZoomLevel((z) => Math.min(500, z + 10))}
            onZoomOut={() => setZoomLevel((z) => Math.max(10, z - 10))}
            onResetZoom={() => setZoomLevel(100)}
          />
        )}
        childrenToolbar={
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <HeadingDropdown
              activeLevel={headingLevel}
              onSelectLevel={(level) => {
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
                  tipTapRef.current?.setHeading(levelMap[level] || 1);
                }
              }}
            />
            <ListDropdown
              onToggleBullet={() => tipTapRef.current?.toggleBulletList()}
              onToggleNumber={() => tipTapRef.current?.toggleOrderedList()}
            />
            <FormatButtons
              isBold={isBold}
              isItalic={isItalic}
              isStrikethrough={isStrikethrough}
              showClearFormatting={false}
              onToggleBold={() => {
                tipTapRef.current?.toggleBold();
                setIsBold((b) => !b);
              }}
              onToggleItalic={() => {
                tipTapRef.current?.toggleItalic();
                setIsItalic((i) => !i);
              }}
              onToggleStrikethrough={() => {
                tipTapRef.current?.toggleStrike();
                setIsStrikethrough((s) => !s);
              }}
            />
            <LinkButton onClick={() => setShowLinkModal(true)} />
            <TableDropdown
              onInsertTable={(rows, cols) => {
                tipTapRef.current?.insertTable(rows, cols);
              }}
            />
            <ClearFormattingButton
              onClick={() => {
                tipTapRef.current?.clearFormatting();
                setIsBold(false);
                setIsItalic(false);
                setIsStrikethrough(false);
              }}
            />
          </div>
        }
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
                background: isSettingsOpen ? "var(--bg-active)" : "none",
                border: "none",
                borderRadius: "4px",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
              aria-label="Settings"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zM5.75 8a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0z" />
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34z" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Body: Settings or Editor Surface */}
      {isSettingsOpen ? (
        <SettingsPage onBack={() => setIsSettingsOpen(false)} />
      ) : (
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <FindReplaceBar
            isOpen={isFindOpen}
            isReplaceOpen={isReplaceOpen}
            onClose={() => setIsFindOpen(false)}
            onToggleReplace={() => setIsReplaceOpen((v) => !v)}
            onQueryChange={(query, matchCase) => {
              if (codeMirrorRef.current) {
                const info = codeMirrorRef.current.getMatchesInfo(query, matchCase);
                setFindMatches(info);
              }
            }}
            onFindNext={(query, matchCase, wrapAround) => {
              if (codeMirrorRef.current) {
                const info = codeMirrorRef.current.findNext(query, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onFindPrevious={(query, matchCase, wrapAround) => {
              if (codeMirrorRef.current) {
                const info = codeMirrorRef.current.findPrevious(query, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onReplace={(query, replacement, matchCase, wrapAround) => {
              if (codeMirrorRef.current) {
                const info = codeMirrorRef.current.replace(query, replacement, matchCase, wrapAround);
                setFindMatches(info);
              }
            }}
            onReplaceAll={(query, replacement, matchCase) => {
              if (codeMirrorRef.current) {
                codeMirrorRef.current.replaceAll(query, replacement, matchCase);
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
            maxLine={codeMirrorRef.current?.getTotalLines() || 1}
            onGoTo={(line) => {
              codeMirrorRef.current?.goToLine(line);
            }}
          />

          {activeTab?.isMarkdown || markdownMode ? (
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
                wordWrap={effectiveWordWrap}
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
        mode={markdownMode ? "markdown" : "plain"}
        zoomLevel={zoomLevel}
        lineEnding="Windows (CRLF)"
        encoding="UTF-8"
        onGoToClick={() => setIsGoToOpen(true)}
        onZoomClick={() => setZoomLevel(100)}
      />

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

      <OpenNotesDialog
        isOpen={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
        onSelectNote={(saved) => {
          createTab(saved.title, saved.content, saved.isMarkdown);
        }}
        onOpenFileFromDisk={async (file) => {
          const imported = await readFileAsText(file);
          createTab(imported.filename, imported.content, imported.isMarkdown);
        }}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={(_text, url) => {
          tipTapRef.current?.setLink(url);
        }}
      />
    </div>
  );
};
