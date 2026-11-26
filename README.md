# Cloud Notes

A fast, privacy-first note-taking web application with the look and feel of Windows 11 Notepad. It supports dual editing modes (rich text and markdown), multi-tab workspaces, client-side zero-knowledge encryption, and automated backups to Google Drive.

## Live Deployment

- **Web Application:** [https://cloud-notes-web.vercel.app](https://cloud-notes-web.vercel.app)
- **Backend API:** [https://cloud-notes-api-seven.vercel.app](https://cloud-notes-api-seven.vercel.app)

---

## Preview

### Light Mode
![Cloud Notes Light Theme](docs/screenshots/editor-light.png)

### Dark Mode
![Cloud Notes Dark Theme](docs/screenshots/editor-dark.png)

---

## Features

- **Windows 11 Fluent Interface:** Pixel-accurate tab management, status bar (cursor position, line count, character count, encoding), and context menus designed around Windows 11 Notepad.
- **Dual Editor Modes:** 
  - Rich Text mode powered by TipTap for formatted text (headings, bold, italic, underline, strikethrough, lists, links, and tables).
  - Plain Text and Markdown mode powered by CodeMirror 6 with syntax rendering and standard shortcuts.
- **Multi-Tab Workspace:** Open multiple notes simultaneously with unsaved change badges, drag-and-drop tab navigation, and session recovery across browser reloads.
- **Client-Side Zero-Knowledge Encryption:** Sensitive notes are encrypted in the browser using AES-256-GCM with keys derived via Argon2id. Passphrases never leave the client.
- **Google Drive Backup Integration:** Direct integration with Google Drive for automated encrypted backups and one-click data restoration.
- **Offline First (PWA):** Full Progressive Web App support with service worker caching and local storage fallbacks, allowing offline note editing and syncing once back online.
- **Keyboard Shortcuts:** Standard desktop shortcuts including `Ctrl+N` (New Tab), `Ctrl+O` (Open), `Ctrl+S` (Save), `Ctrl+W` (Close Tab), `Ctrl+F` (Find), `Ctrl+H` (Replace), `Ctrl+G` (Go to line), `Ctrl+B` (Bold), `Ctrl+I` (Italic), and `Ctrl+U` (Underline).

---

## Tech Stack

- **Frontend (`apps/web`):**
  - React 19, TypeScript, Vite
  - TipTap (ProseMirror-based rich text editor)
  - CodeMirror 6 (Plain text and Markdown engine)
  - Zustand (State management)
  - Vite PWA Plugin (Offline caching and service worker)
  - CSS Modules with Fluent UI design tokens

- **Backend API (`apps/api`):**
  - Hono on Node.js / Vercel Serverless
  - PostgreSQL (Supabase)
  - Google Drive API for backup and restore
  - JWT auth with HttpOnly refresh cookies and PKCE OAuth flow

- **Shared Core (`packages/core`):**
  - Client-side WebCrypto (AES-GCM, Argon2id)
  - Conflict resolution and offline outbox synchronization

---

## Project Structure

```text
cloud-notes/
├── apps/
│   ├── web/          # React frontend (Vite PWA)
│   ├── api/          # Hono backend API
│   └── desktop/      # Desktop wrapper configuration
├── packages/
│   └── core/         # Shared crypto, storage, and sync logic
├── docs/
│   └── screenshots/  # Application screenshots
├── supabase/
│   └── migrations/   # Database schema migrations
├── package.json      # Monorepo root (pnpm workspaces)
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or 10

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/tarunkumarhp72/cloud-notes.git
cd cloud-notes
pnpm install
```

### Environment Configuration

Create a `.env` file in `apps/api`:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
```

Create a `.env` file in `apps/web`:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Running Locally

Start the development servers across all workspace packages:

```bash
pnpm dev
```

The web application will be available at `http://localhost:3000` and the API server at `http://localhost:3001`.

### Running Tests

```bash
# Run unit and component tests
pnpm test

# Run TypeScript typechecks
pnpm --filter @notepad/web typecheck
```

---

## License

This project is licensed under the MIT License.
