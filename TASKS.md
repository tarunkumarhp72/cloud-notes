# TASKS: Notepad Cloud

## Phase 1: Foundations

- ID: T-001
- Title: Monorepo workspace configuration
- Scope line: B6
- Goal: Initialize pnpm workspace with strict TypeScript, Vite, ESLint, Prettier, and shared package boundaries.
- Reference images: none
- Files to create or change: pnpm-workspace.yaml, package.json, tsconfig.base.json, .prettierrc, eslint.config.js, packages/core/package.json, apps/web/package.json, apps/desktop/package.json, apps/api/package.json
- Acceptance criteria:
  1. `pnpm install` installs cleanly across all workspace packages.
  2. `pnpm -r build` or stub build runs with zero errors.
  3. Strict TypeScript configuration active with `noImplicitAny: true`.
- Tests to run: `pnpm typecheck`, `pnpm lint`
- Viewports to screenshot: none
- Depends on: none
- Status: done [Evidence](qa/evidence/T-001/summary.md)

- ID: T-002
- Title: Supabase Postgres database migration
- Scope line: B3
- Goal: Create PostgreSQL migrations for users, vaults, notes, and outbox sync tables with UUIDv7 and UTC timestamps.
- Reference images: none
- Files to create or change: supabase/migrations/20261120000001_initial_schema.sql
- Acceptance criteria:
  1. Migration applies cleanly against the dev database.
  2. Row Level Security is enabled on all tables without public access policies.
  3. Tables created: users, vaults, encrypted_notes, sync_log.
- Tests to run: `pnpm test:db`
- Viewports to screenshot: none
- Depends on: T-001
- Status: done [Evidence](qa/evidence/T-002/summary.md)

- ID: T-003
- Title: Hono API server boilerplate
- Scope line: B3
- Goal: Establish Hono API server deployed on Vercel Functions connecting to Postgres pooler.
- Reference images: none
- Files to create or change: apps/api/src/index.ts, apps/api/src/db.ts, apps/api/vercel.json
- Acceptance criteria:
  1. `GET /health` endpoint returns status 200 and database connectivity status.
  2. Database queries use parameterized postgres connections.
  3. Vercel function configuration correctly maps API routes.
- Tests to run: `pnpm --filter api test`
- Viewports to screenshot: none
- Depends on: T-002
- Status: done [Evidence](qa/evidence/T-003/summary.md)

- ID: T-004
- Title: Core cryptographic primitives
- Scope line: B2
- Goal: Implement Web Crypto AES-256-GCM encryption and hash-wasm Argon2id key derivation in packages/core.
- Reference images: none
- Files to create or change: packages/core/src/crypto/aes.ts, packages/core/src/crypto/argon2.ts, packages/core/src/crypto/index.ts, packages/core/src/crypto/crypto.test.ts
- Acceptance criteria:
  1. AES-256-GCM encrypts plaintext and decrypts accurately with authentication tag validation.
  2. Tampered ciphertext throws an explicit decryption error.
  3. Argon2id derives 256-bit key from passphrase with secure memory and iteration parameters.
- Tests to run: `pnpm --filter @notepad/core test` (crypto round-trip and tamper detection)
- Viewports to screenshot: none
- Depends on: T-001
- Status: done [Evidence](qa/evidence/T-004/summary.md)

- ID: T-005
- Title: Client-side IndexedDB note store
- Scope line: B3
- Goal: Implement local note storage and metadata repository using idb in packages/core.
- Reference images: none
- Files to create or change: packages/core/src/storage/db.ts, packages/core/src/storage/notesStore.ts, packages/core/src/storage/storage.test.ts
- Acceptance criteria:
  1. IndexedDB stores and retrieves encrypted note records by UUIDv7.
  2. Transactional batch updates succeed without corruption.
  3. Database version upgrade handles schema migrations cleanly.
- Tests to run: `pnpm --filter @notepad/core test` (IndexedDB CRUD and transaction rollback)
- Viewports to screenshot: none
- Depends on: T-001
- Status: done [Evidence](qa/evidence/T-005/summary.md)

---

## Phase 2: Auth

- ID: T-006
- Title: Google OAuth PKCE authorization flow
- Scope line: B1
- Goal: Implement client-side PKCE code verifier / challenge generator and Google OAuth redirection.
- Reference images: none
- Files to create or change: apps/web/src/auth/pkce.ts, apps/web/src/auth/googleAuth.ts, apps/web/src/auth/auth.test.ts
- Acceptance criteria:
  1. Generates cryptographic SHA-256 code challenge from random verifier.
  2. Constructs Google OAuth 2.0 authorization URL with state parameter.
  3. Verifies callback state parameter matches stored session state.
- Tests to run: `pnpm --filter web test` (PKCE challenge generation & state validation)
- Viewports to screenshot: none
- Depends on: T-004
- Status: done [Evidence](qa/evidence/T-006/summary.md)

- ID: T-007
- Title: Custom JWT and rotating refresh token engine
- Scope line: B1
- Goal: Implement jose-based 15-minute access token generation and 15-day rotating refresh tokens.
- Reference images: none
- Files to create or change: apps/api/src/auth/jwt.ts, apps/api/src/auth/tokens.ts, apps/api/src/auth/jwt.test.ts
- Acceptance criteria:
  1. Access token expires precisely after 15 minutes.
  2. Refresh token rotation invalidates old refresh token upon reuse and alerts token replay.
  3. Refresh tokens set as httpOnly, Secure, SameSite=Strict cookies.
- Tests to run: `pnpm --filter api test` (token rotation, expiry, and replay detection)
- Viewports to screenshot: none
- Depends on: T-003
- Status: done [Evidence](qa/evidence/T-007/summary.md)

- ID: T-008
- Title: Backend Auth endpoints
- Scope line: B1
- Goal: Build /auth/google, /auth/refresh, /auth/logout, and /auth/me endpoints in Hono.
- Reference images: none
- Files to create or change: apps/api/src/routes/auth.ts, apps/api/src/routes/auth.test.ts
- Acceptance criteria:
  1. POST /auth/google exchanges auth code with Google API, verifies ID token, upserts user, issues tokens.
  2. POST /auth/refresh returns new access token with rotated refresh cookie.
  3. POST /auth/logout clears refresh cookie and revokes active session.
- Tests to run: `pnpm --filter api test` (auth route integration tests)
- Viewports to screenshot: none
- Depends on: T-007
- Status: done [Evidence](qa/evidence/T-008/summary.md)

- ID: T-009
- Title: Google sign-in splash screen
- Scope line: B1
- Goal: Create the first-launch Google sign-in view in apps/web styled to match Windows Notepad aesthetic.
- Reference images: image.png
- Files to create or change: apps/web/src/components/auth/SignInModal.tsx, apps/web/src/components/auth/SignInModal.module.css
- Acceptance criteria:
  1. Renders clean Windows 11 Fluent modal with Notepad app icon and "Sign in with Google" button.
  2. Clicking button initiates PKCE redirect flow.
  3. Displays error notice if Google authentication fails.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 360x640, 1440x900 (light and dark)
- Depends on: T-006, T-008
- Status: done [Evidence](qa/evidence/T-009/summary.md)

- ID: T-010
- Title: Right toolbar Account button and profile dropdown
- Scope line: A7
- Goal: Implement account button in top right toolbar with signed-in user name, email, and sign out option.
- Reference images: image copy 7.png, unwanted.png
- Files to create or change: apps/web/src/components/header/AccountMenu.tsx, apps/web/src/components/header/AccountMenu.module.css
- Acceptance criteria:
  1. Account button matches Windows 11 icon placement and spacing shown in reference image copy 7.
  2. Dropdown displays user avatar, display name, and email.
  3. Clicking "Sign out" triggers logout and resets local session.
  4. Excludes Copilot/AI button and feedback megaphone button as indicated in unwanted.png.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-009
- Status: done [Evidence](qa/evidence/T-010/summary.md)

---

## Phase 3: Notepad Shell

- ID: T-011
- Title: Window title bar and tab strip layout
- Scope line: A1
- Goal: Build native-looking Windows 11 title bar and tab strip container matching reference images.
- Reference images: image.png, image copy.png
- Files to create or change: apps/web/src/components/tabs/TabStrip.tsx, apps/web/src/components/tabs/TabStrip.module.css
- Acceptance criteria:
  1. Title bar features Notepad icon, tab container, new-tab (+) button, and window caption buttons.
  2. Tab strip height, padding, and Fluent acrylic background match reference image exactly.
  3. Tab active state displays white background and rounded top corners (4px radius).
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-001
- Status: done [Evidence](qa/evidence/T-011/summary.md)

- ID: T-012
- Title: Tab management and switching
- Scope line: A1
- Goal: Support multiple tabs with title, unsaved dot indicator, close button, drag-reorder, and Ctrl+Tab cycling.
- Reference images: image.png
- Files to create or change: apps/web/src/components/tabs/TabItem.tsx, apps/web/src/stores/tabsStore.ts, apps/web/src/components/tabs/tabs.test.ts
- Acceptance criteria:
  1. Displays dot next to tab title when content contains unsaved changes.
  2. Clicking close (×) closes active tab; clicking (+) opens a new "Untitled" note.
  3. Ctrl+Tab and Ctrl+Shift+Tab switch between tabs sequentially.
  4. Dragging tabs allows reordering positions in strip.
- Tests to run: `pnpm --filter web test` (tab lifecycle, switching, reordering)
- Viewports to screenshot: 1440x900
- Depends on: T-011
- Status: done [Evidence](qa/evidence/T-012/summary.md)

- ID: T-013
- Title: Top menu bar container
- Scope line: A2
- Goal: Build top menu bar with File, Edit, and View menus matching Windows 11 Notepad typography and spacing.
- Reference images: image.png, image copy.png, image copy 2.png, image copy 3.png
- Files to create or change: apps/web/src/components/menu/MenuBar.tsx, apps/web/src/components/menu/MenuBar.module.css
- Acceptance criteria:
  1. Menu items "File", "Edit", "View" positioned with Segoe UI Variable font.
  2. Hovering highlights menu item with standard Fluent light/dark hover tone.
  3. Clicking opens active dropdown and allows arrow key navigation.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-011
- Status: done [Evidence](qa/evidence/T-013/summary.md)

- ID: T-014
- Title: File menu dropdown
- Scope line: A3
- Goal: Implement File menu dropdown with New tab, New window, Open, Save, Save as, Save all, Print, Close tab, Close window.
- Reference images: image copy.png
- Files to create or change: apps/web/src/components/menu/FileMenu.tsx, apps/web/src/components/menu/MenuDropdown.module.css
- Acceptance criteria:
  1. Menu items and keyboard shortcut labels match image copy.png exactly.
  2. Menu separator lines positioned correctly between Save all and Page setup, and Print and Close tab.
  3. Menu actions trigger corresponding application events (New tab, Save, etc.).
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-013
- Status: done [Evidence](qa/evidence/T-014/summary.md)

- ID: T-015
- Title: Edit menu dropdown
- Scope line: A4
- Goal: Implement Edit menu with Undo, Redo, Cut, Copy, Paste, Delete, Find, Find next/prev, Replace, Go to, Select all, Time/Date.
- Reference images: image copy 2.png
- Files to create or change: apps/web/src/components/menu/EditMenu.tsx
- Acceptance criteria:
  1. Labels, icons, and keyboard shortcuts match image copy 2.png exactly.
  2. Menu items disable dynamically when action is unavailable (e.g. Undo disabled when stack is empty).
  3. Time/Date (F5) inserts formatted local timestamp at current caret position.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-013
- Status: done [Evidence](qa/evidence/T-015/summary.md)

- ID: T-016
- Title: View menu dropdown
- Scope line: A5
- Goal: Implement View menu with Zoom, Status bar toggle, and Word wrap toggle.
- Reference images: image copy 3.png
- Files to create or change: apps/web/src/components/menu/ViewMenu.tsx
- Acceptance criteria:
  1. Checkmarks appear next to Status bar and Word wrap when enabled.
  2. Submenu for Zoom lists Zoom in, Zoom out, and Restore default zoom.
  3. Toggling Status bar hides/shows the bottom bar immediately.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-013
- Status: done [Evidence](qa/evidence/T-016/summary.md)

- ID: T-017
- Title: Formatting toolbar: Heading dropdown
- Scope line: A6
- Goal: Build center formatting toolbar heading dropdown (Title, Subtitle, Heading, Subheading, Section, Subsection, Body).
- Reference images: image copy 4.png
- Files to create or change: apps/web/src/components/toolbar/HeadingDropdown.tsx, apps/web/src/components/toolbar/Toolbar.module.css
- Acceptance criteria:
  1. Dropdown displays Title, Subtitle, Heading, Subheading, Section, Subsection, Body with exact typography styling from reference.
  2. Blue vertical indicator bar marks the currently active style (e.g. Body).
  3. Selecting a level applies corresponding Markdown header tag to active line.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-013
- Status: done [Evidence](qa/evidence/T-017/summary.md)

- ID: T-018
- Title: Formatting toolbar: Lists, Bold, Italic, Strikethrough, Clear formatting
- Scope line: A6
- Goal: Implement list dropdown, bold, italic, strikethrough, and clear-formatting buttons in formatting toolbar.
- Reference images: image copy 5.png, image.png
- Files to create or change: apps/web/src/components/toolbar/ListDropdown.tsx, apps/web/src/components/toolbar/FormatButtons.tsx
- Acceptance criteria:
  1. List dropdown offers Bulleted list, Numbered list, Increase indent, Decrease indent matching image copy 5.png.
  2. Fluent SVG icons for Bold (B), Italic (I), Strikethrough (S), and Clear formatting match reference.
  3. Buttons toggle active state styling when caret is inside formatted text.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-017
- Status: done [Evidence](qa/evidence/T-018/summary.md)

- ID: T-019
- Title: Formatting toolbar: Link modal dialog
- Scope line: A6
- Goal: Implement link insertion and editing dialog matching Windows Notepad reference image.
- Reference images: image copy 7.png
- Files to create or change: apps/web/src/components/toolbar/LinkModal.tsx, apps/web/src/components/toolbar/LinkModal.module.css
- Acceptance criteria:
  1. Modal fields: "Display text" and "Address" with exact placeholder text from image copy 7.png.
  2. "Insert" and "Cancel" buttons with correct styling, padding, and focus outlines.
  3. Inserts formatted markdown link `[text](url)` or wraps selected text.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-017
- Status: done [Evidence](qa/evidence/T-019/summary.md)

- ID: T-020
- Title: Formatting toolbar: Table dropdown
- Scope line: A6
- Goal: Implement table insertion grid picker (up to 5x5) and Insert/Edit table controls.
- Reference images: image copy 6.png
- Files to create or change: apps/web/src/components/toolbar/TableDropdown.tsx, apps/web/src/components/toolbar/TableDropdown.module.css
- Acceptance criteria:
  1. Grid picker shows 5 columns x 5 rows of rounded square cells matching image copy 6.png.
  2. Hovering highlights cells up to target dimensions (e.g. 3x3).
  3. Clicking inserts valid GFM Markdown table into editor.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-017
- Status: done [Evidence](qa/evidence/T-020/summary.md)

- ID: T-021
- Title: Settings page
- Scope line: A10
- Goal: Create Windows 11 Notepad Settings view with App theme, Font family, Font size, Word wrap, Spell check, and Autocorrect.
- Reference images: image.png
- Files to create or change: apps/web/src/components/settings/SettingsPage.tsx, apps/web/src/components/settings/SettingsPage.module.css, apps/web/src/stores/settingsStore.ts
- Acceptance criteria:
  1. Theme options: Light, Dark, Use system setting. Changing theme updates CSS variables instantly.
  2. Font selection: Consolas, Segoe UI Variable, monospace fallbacks.
  3. Settings persist in local storage.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-010
- Status: done [Evidence](qa/evidence/T-021/summary.md)

- ID: T-022
- Title: Plain-text editor surface (CodeMirror 6)
- Scope line: A8
- Goal: Integrate CodeMirror 6 for plain-text editing with word wrap, line ending conversion, and smooth caret rendering.
- Reference images: image.png
- Files to create or change: apps/web/src/components/editor/CodeMirrorEditor.tsx, apps/web/src/components/editor/editor.module.css
- Acceptance criteria:
  1. Seamless borderless editing surface matching Windows Notepad font and line spacing.
  2. Supports word wrap toggle from View menu / Settings.
  3. Keystroke updates occur under 16ms with zero layout shift.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-013
- Status: todo

- ID: T-023
- Title: Rich text editor surface (TipTap)
- Scope line: A12
- Goal: Implement TipTap ProseMirror editor for formatted mode, serializing bi-directionally to one Markdown string.
- Reference images: image.png, image copy 8.png
- Files to create or change: apps/web/src/components/editor/TipTapEditor.tsx, apps/web/src/components/editor/markdownSerializer.ts
- Acceptance criteria:
  1. Supports Headings, Bulleted/Numbered lists, Bold, Italic, Strikethrough, Tables, and Links.
  2. Content seamlessly translates to standard Markdown without syntax loss.
  3. Lazily loaded to meet the 150 KB initial JS bundle budget.
- Tests to run: `pnpm --filter web test` (Markdown serialization round-trip)
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-017, T-018, T-019, T-020
- Status: todo

- ID: T-024
- Title: Find and replace floating bar & Go to line dialog
- Scope line: A8
- Goal: Build Windows 11 Notepad Find and Replace bar (Ctrl+F, Ctrl+H) and Go to line dialog (Ctrl+G).
- Reference images: image.png
- Files to create or change: apps/web/src/components/editor/FindReplaceBar.tsx, apps/web/src/components/editor/GoToDialog.tsx
- Acceptance criteria:
  1. Find bar floats over upper right editor area with search query, next/prev arrows, match case, and wrap around toggles.
  2. Replace bar expands smoothly with replace input and "Replace" / "Replace all" buttons.
  3. Go to line dialog navigates caret and scrolls to requested line number.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-022
- Status: todo

- ID: T-025
- Title: Status bar
- Scope line: A9
- Goal: Implement status bar with Ln and Col, character count, text mode label, zoom percentage, line ending, and encoding.
- Reference images: image.png, image copy 8.png
- Files to create or change: apps/web/src/components/statusbar/StatusBar.tsx, apps/web/src/components/statusbar/StatusBar.module.css
- Acceptance criteria:
  1. Format matches reference: `Ln X, Col Y` | `X characters` | `Plain text` (or `Formatted`) | `100%` | `Windows (CRLF)` | `UTF-8`.
  2. Updates in real-time as caret moves or text changes.
  3. Status bar toggle in View menu hides/shows bar.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-022
- Status: todo

- ID: T-026
- Title: Windows Notepad keyboard shortcuts dispatcher
- Scope line: A11
- Goal: Implement global keyboard shortcuts matching native Windows Notepad commands.
- Reference images: image copy.png, image copy 2.png
- Files to create or change: apps/web/src/shortcuts/shortcutsDispatcher.ts, apps/web/src/shortcuts/shortcuts.test.ts
- Acceptance criteria:
  1. Ctrl+N (new tab), Ctrl+Shift+N (new window), Ctrl+O (open), Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+W (close tab).
  2. Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+F (find), Ctrl+H (replace), Ctrl+G (go to), F5 (time/date), Ctrl+A (select all).
  3. Ctrl+Plus, Ctrl+Minus, Ctrl+0 for zoom management.
- Tests to run: `pnpm --filter web test` (shortcut dispatch tests)
- Viewports to screenshot: none
- Depends on: T-014, T-015, T-016
- Status: todo

- ID: T-027
- Title: Local auto-save to IndexedDB
- Scope line: B3
- Goal: Debounce local note saving to IndexedDB 1 second after typing stops, with a 10-second forced flush.
- Reference images: none
- Files to create or change: apps/web/src/sync/localAutoSave.ts, apps/web/src/sync/autoSave.test.ts
- Acceptance criteria:
  1. Typing updates memory state immediately.
  2. Saves to IndexedDB precisely 1 second after keystrokes cease.
  3. Forces save every 10 seconds during continuous uninterrupted typing.
  4. Flushes unsaved state on visibilitychange and pagehide events.
- Tests to run: `pnpm --filter web test` (debounce timing and flush verification)
- Viewports to screenshot: none
- Depends on: T-005, T-022
- Status: todo

- ID: T-028
- Title: File Open dialog, Save as export, and local file import
- Scope line: B4
- Goal: Implement File > Open note picker, Save as export (.txt/.md), and local drag-and-drop file import.
- Reference images: image copy.png
- Files to create or change: apps/web/src/components/file/OpenNotesDialog.tsx, apps/web/src/components/file/fileIo.ts
- Acceptance criteria:
  1. File > Open displays plain dialog listing saved notes from IndexedDB.
  2. File > Save as triggers browser download of `.txt` or `.md` file.
  3. Dropping `.txt` or `.md` onto the window imports content into a new tab.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-014, T-027
- Status: todo

---

## Phase 4: Encryption

- ID: T-029
- Title: Vault passphrase creation and unlock UI
- Scope line: B2
- Goal: Build vault setup and passphrase unlock dialog styled strictly to Windows Notepad aesthetic.
- Reference images: image.png
- Files to create or change: apps/web/src/components/vault/VaultUnlockModal.tsx, apps/web/src/components/vault/vault.module.css
- Acceptance criteria:
  1. Prompts user to set passphrase on initial vault setup.
  2. Derives vault key in memory using Argon2id via packages/core.
  3. Unlocks local encrypted store on correct passphrase; rejects incorrect passphrase with clean error.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1440x900 (light and dark)
- Depends on: T-004
- Status: todo

- ID: T-030
- Title: Recovery key generation and display modal
- Scope line: B2
- Goal: Generate 256-bit recovery key, display once with copy button, and support vault recovery unlock.
- Reference images: image.png
- Files to create or change: apps/web/src/components/vault/RecoveryKeyModal.tsx, apps/web/src/components/vault/vaultRecovery.ts
- Acceptance criteria:
  1. Generates cryptographic recovery key displayed once during vault setup with warning.
  2. Entering recovery key unlocks vault when passphrase is forgotten.
  3. Recovery key is never stored in plaintext on server or local storage.
- Tests to run: `pnpm --filter web test` (recovery unlock test)
- Viewports to screenshot: 1440x900
- Depends on: T-029
- Status: todo

- ID: T-031
- Title: Note envelope encryption pipeline
- Scope line: B2
- Goal: Encrypt note title, content, and metadata using AES-256-GCM before saving to storage or syncing.
- Reference images: none
- Files to create or change: packages/core/src/crypto/envelope.ts, packages/core/src/crypto/envelope.test.ts
- Acceptance criteria:
  1. Plaintext note is wrapped in encrypted payload with unique IV and authentication tag.
  2. Database and server only ever receive ciphertext; plaintext never leaves device memory.
  3. Decrypts note payload seamlessly upon tab activation.
- Tests to run: `pnpm --filter @notepad/core test` (envelope encryption & integrity checks)
- Viewports to screenshot: none
- Depends on: T-004, T-029
- Status: todo

---

## Phase 5: Sync

- ID: T-032
- Title: Client sync outbox queue
- Scope line: B3
- Goal: Implement client outbox queue tracking note mutations, versions, and sync status in packages/core.
- Reference images: none
- Files to create or change: packages/core/src/sync/outbox.ts, packages/core/src/sync/outbox.test.ts
- Acceptance criteria:
  1. Note changes append mutation to local sync outbox queue.
  2. Queue persists across page reloads in IndexedDB.
  3. Successfully synced items are removed from outbox atomically.
- Tests to run: `pnpm --filter @notepad/core test`
- Viewports to screenshot: none
- Depends on: T-005, T-031
- Status: todo

- ID: T-033
- Title: Backend sync push and pull endpoints
- Scope line: B3
- Goal: Build /api/sync/push and /api/sync/pull endpoints in Hono with UUIDv7 and version tracking.
- Reference images: none
- Files to create or change: apps/api/src/routes/sync.ts, apps/api/src/routes/sync.test.ts
- Acceptance criteria:
  1. POST /api/sync/push validates ciphertext payload with Zod and stores versioned note record.
  2. GET /api/sync/pull returns updates newer than client's last sync cursor.
  3. Queries execute against Supabase Postgres pooler with parameterized SQL.
- Tests to run: `pnpm --filter api test`
- Viewports to screenshot: none
- Depends on: T-003, T-008
- Status: todo

- ID: T-034
- Title: Background sync worker and status-bar sync states
- Scope line: B3
- Goal: Implement background sync engine with exponential backoff, jitter, and status-bar indicators.
- Reference images: image.png
- Files to create or change: apps/web/src/sync/syncEngine.ts, apps/web/src/components/statusbar/SyncIndicator.tsx
- Acceptance criteria:
  1. Pushes local changes 2 seconds after auto-save completes.
  2. Updates status bar text cleanly: "Saving", "Saved", "Offline", "Sync failed".
  3. Retries network failures with bounded backoff and random jitter.
- Tests to run: `pnpm --filter web test` (sync retry and status transitions)
- Viewports to screenshot: 1440x900
- Depends on: T-025, T-032, T-033
- Status: todo

- ID: T-035
- Title: Sync conflict resolution
- Scope line: B5
- Goal: Detect conflicting remote updates and open losing version as a "[Note Name] - conflict" tab.
- Reference images: image.png
- Files to create or change: packages/core/src/sync/conflicts.ts, apps/web/src/sync/conflictHandler.ts, packages/core/src/sync/conflicts.test.ts
- Acceptance criteria:
  1. Detects divergent note versions between local outbox and remote cursor.
  2. Preserves winning version in current note tab.
  3. Automatically opens losing version as a new tab named "[Note Name] - conflict" with unsaved status.
  4. Never silenty overwrites divergent note edits.
- Tests to run: `pnpm --filter @notepad/core test` (three-way divergence test)
- Viewports to screenshot: 1440x900
- Depends on: T-012, T-034
- Status: todo

- ID: T-036
- Title: Multi-tab synchronization via BroadcastChannel
- Scope line: B5
- Goal: Synchronize active tabs and local edits across browser instances using BroadcastChannel.
- Reference images: none
- Files to create or change: apps/web/src/sync/broadcast.ts, apps/web/src/sync/broadcast.test.ts
- Acceptance criteria:
  1. Edits in Tab A notify Tab B to reload note state if active.
  2. Tab close/open events synchronize across windows.
  3. BroadcastChannel gracefully falls back if unavailable.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: none
- Depends on: T-035
- Status: todo

---

## Phase 6: Offline & PWA

- ID: T-037
- Title: PWA manifest and service worker
- Scope line: B3
- Goal: Configure vite-plugin-pwa to generate web app manifest, icons, and Workbox precaching.
- Reference images: none
- Files to create or change: apps/web/vite.config.ts, apps/web/public/manifest.json, apps/web/src/sw.ts
- Acceptance criteria:
  1. PWA manifest specifies app name "Notepad", standalone display mode, and Windows 11 Notepad icons.
  2. Service worker precaches application shell and static assets for instant load.
  3. App is installable in Chrome/Edge.
- Tests to run: `pnpm --filter web build`
- Viewports to screenshot: none
- Depends on: T-001
- Status: todo

- ID: T-038
- Title: Offline startup and local-first editor boot
- Scope line: B3
- Goal: Enable app launch, note creation, and editing with zero network connectivity.
- Reference images: image.png
- Files to create or change: apps/web/src/sync/networkStatus.ts, apps/web/src/sync/offlineBoot.test.ts
- Acceptance criteria:
  1. App boots from service worker cache when completely offline.
  2. Loads existing notes from IndexedDB without network requests.
  3. Status bar displays "Offline" state.
- Tests to run: `pnpm --filter web test` (offline mock tests)
- Viewports to screenshot: 1440x900
- Depends on: T-034, T-037
- Status: todo

---

## Phase 7: Responsive

- ID: T-039
- Title: Tablet & Laptop layout adaptation (<1024px)
- Scope line: B6
- Goal: Enable smooth horizontal scrolling on tab strip and toolbar when viewport is below 1024px.
- Reference images: image.png
- Files to create or change: apps/web/src/styles/responsive.css, apps/web/src/components/tabs/TabStrip.module.css
- Acceptance criteria:
  1. Tab strip scrolls horizontally with smooth mouse-wheel/drag below 1024px without container overflow.
  2. Formatting toolbar scrolls horizontally without clipping controls.
  3. Main viewport container has zero horizontal page scroll at any width >= 320px.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 768x1024, 820x1180, 844x390 (light and dark)
- Depends on: T-011, T-017
- Status: todo

- ID: T-040
- Title: Mobile menu collapsing (<600px)
- Scope line: B6
- Goal: Collapse File, Edit, and View menus into a single consolidated Menu button below 600px width.
- Reference images: image.png
- Files to create or change: apps/web/src/components/menu/CollapsedMenu.tsx, apps/web/src/components/menu/CollapsedMenu.module.css
- Acceptance criteria:
  1. At width < 600px, File, Edit, View text labels are replaced by a single "Menu" button.
  2. Clicking "Menu" opens grouped hierarchical menu containing File, Edit, View sub-items.
  3. Above 600px, standard File, Edit, View bar restores automatically.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 360x640, 390x844, 540x720 (light and dark)
- Depends on: T-013, T-039
- Status: todo

- ID: T-041
- Title: Touch target sizing & virtual keyboard caret handling
- Scope line: B6
- Goal: Ensure all touch targets meet 44x44 CSS px and visualViewport prevents virtual keyboard caret occlusion.
- Reference images: none
- Files to create or change: apps/web/src/styles/touch.css, apps/web/src/hooks/useVisualViewport.ts
- Acceptance criteria:
  1. Tappable controls have minimum 44x44 CSS px touch target when pointer is coarse.
  2. Uses dvh units and safe-area insets on mobile displays.
  3. window.visualViewport resize listener scrolls active caret into visible view when keyboard opens.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 390x844 (touch mode)
- Depends on: T-040
- Status: todo

- ID: T-042
- Title: Dual-screen and ultra-wide display adaptation
- Scope line: B6
- Goal: Handle dual-screen fold using viewport-segments media feature and clamp toolbar stretching on wide screens.
- Reference images: none
- Files to create or change: apps/web/src/styles/dualscreen.css, apps/web/src/styles/ultrawide.css
- Acceptance criteria:
  1. Spanned dual-screen layout avoids placing controls or text across fold seam (using viewport-segments).
  2. Ultra-wide screens (1920x1080, 2560x1440) keep toolbar and chrome at normal size without stretching.
  3. Editor area maintains readable margins and proportions on 2560x1440 displays.
- Tests to run: `pnpm --filter web test`
- Viewports to screenshot: 1114x720 (spanned), 1920x1080, 2560x1440
- Depends on: T-039
- Status: todo

---

## Phase 8: Hardening

- ID: T-043
- Title: Content Security Policy & Markdown sanitization
- Scope line: A12
- Goal: Implement strict Content Security Policy headers and DOMPurify sanitization for rendered rich text and links.
- Reference images: none
- Files to create or change: apps/web/src/security/sanitize.ts, apps/api/src/security/csp.ts, apps/web/src/security/sanitize.test.ts
- Acceptance criteria:
  1. Rendered Markdown strips `<script>`, inline event handlers (`onclick`), and dangerous protocols (`javascript:`).
  2. Links only allow `http:`, `https:`, and `mailto:` schemes with `rel="noopener noreferrer"`.
  3. Strict CSP headers applied on API and Web responses.
- Tests to run: `pnpm --filter web test` (XSS payload sanitization tests)
- Viewports to screenshot: none
- Depends on: T-023
- Status: todo

- ID: T-044
- Title: API rate limiting and input validation
- Scope line: B1
- Goal: Add sliding window rate limiting and Zod schema validation across all Hono endpoints.
- Reference images: none
- Files to create or change: apps/api/src/middleware/rateLimit.ts, apps/api/src/middleware/validate.ts, apps/api/src/middleware/rateLimit.test.ts
- Acceptance criteria:
  1. Restricts auth and sync endpoints to bounded request thresholds per client IP.
  2. Exceeding rate limit returns HTTP 429 Too Many Requests with Retry-After header.
  3. All request bodies validated against strict Zod schemas with formatted error responses.
- Tests to run: `pnpm --filter api test`
- Viewports to screenshot: none
- Depends on: T-008, T-033
- Status: todo

- ID: T-045
- Title: Account deletion and data purge
- Scope line: B1
- Goal: Implement user account deletion and cryptographic data wipe workflow.
- Reference images: none
- Files to create or change: apps/api/src/routes/account.ts, apps/web/src/components/settings/DeleteAccountModal.tsx
- Acceptance criteria:
  1. User can initiate account deletion from Settings page.
  2. Purges all remote encrypted notes, vaults, and auth records from database.
  3. Clears local IndexedDB, cookies, and resets client to initial clean state.
- Tests to run: `pnpm --filter api test`
- Viewports to screenshot: 1440x900
- Depends on: T-021, T-044
- Status: todo

---

## Phase 9: Desktop

- ID: T-046
- Title: Tauri 2 desktop shell initialization
- Scope line: B6
- Goal: Set up apps/desktop using Tauri 2 wrapping the apps/web build with Windows 11 window styling.
- Reference images: image.png
- Files to create or change: apps/desktop/src-tauri/tauri.conf.json, apps/desktop/src-tauri/src/main.rs, apps/desktop/package.json
- Acceptance criteria:
  1. Tauri 2 project builds and runs on Windows displaying apps/web interface.
  2. Window decor matches Windows 11 Fluent frame with mica/acrylic background support.
  3. UI is 100% identical between web browser and desktop shell.
- Tests to run: `pnpm --filter @notepad/desktop build`
- Viewports to screenshot: 1440x900
- Depends on: T-011, T-022
- Status: todo

- ID: T-047
- Title: Desktop OS keychain token integration
- Scope line: B1
- Goal: Store OAuth refresh tokens securely in Windows Credential Manager via Tauri keychain plugin.
- Reference images: none
- Files to create or change: apps/desktop/src-tauri/src/keychain.rs, apps/web/src/auth/tokenStorage.ts
- Acceptance criteria:
  1. Detects desktop runtime and routes refresh token storage to OS keychain.
  2. Securely retrieves stored credentials upon application cold launch.
  3. Revokes and removes credentials from Credential Manager on sign out.
- Tests to run: `pnpm test`
- Viewports to screenshot: none
- Depends on: T-046
- Status: todo

- ID: T-048
- Title: Desktop native file dialogs and deep-link handler
- Scope line: B4
- Goal: Integrate native Windows File Open/Save dialogs and deep-link protocol handler for Google sign-in.
- Reference images: none
- Files to create or change: apps/desktop/src-tauri/src/dialogs.rs, apps/desktop/src-tauri/src/deeplink.rs
- Acceptance criteria:
  1. File > Open and File > Save As invoke native Windows file picker dialogs in desktop mode.
  2. Registers custom protocol handler `notepad-cloud://auth` for seamless OAuth callback into desktop app.
  3. Double clicking `.txt` or `.md` opens note in desktop app.
- Tests to run: `pnpm test`
- Viewports to screenshot: none
- Depends on: T-046
- Status: todo
