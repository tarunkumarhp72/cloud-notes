# 02-tech.md: approved technology (anything not listed is forbidden)

ONE CODEBASE, TWO TARGETS: the same web app runs in the browser (installable PWA) and inside a Tauri 2 desktop shell. Never write separate UI code for desktop.

LANGUAGE AND TOOLS
- TypeScript in strict mode everywhere. Node 22 LTS. pnpm workspaces.
- Folders: packages/core (crypto, sync engine, Markdown helpers, shared types), apps/web, apps/desktop, apps/api.
- Vite, Vitest, Playwright, ESLint, Prettier.

FRONT END (apps/web)
- React 19 with Vite. Plain CSS with CSS variables and CSS modules. No UI kit, no Tailwind, no CSS-in-JS.
- Icons: Fluent UI System Icons (SVG) to match Windows. Font: Segoe UI Variable with system-ui fallback; editor font Consolas with ui-monospace fallback.
- Plain-text editor: CodeMirror 6. Rich editor: TipTap (ProseMirror). Both read and write one Markdown string.
- State: React state plus Zustand for app state. Local storage: IndexedDB through the idb package.
- PWA: vite-plugin-pwa (service worker, offline app shell).
- Load the rich editor, table tools and crypto lazily.

CRYPTO (packages/core)
- Web Crypto API for AES-256-GCM. hash-wasm for Argon2id. No other crypto library.

API (apps/api)
- Hono on Vercel Functions, Node runtime. jose for JWT. postgres (porsager) over the Supabase pooler. zod for validation.
- Google sign-in is our own code: authorization code with PKCE, ID token verification, own 15-minute access JWT and 15-day rotating refresh token. Do NOT use Supabase Auth. Do NOT use the Supabase client SDK for data. Supabase is plain Postgres only. Row level security on, no policies.

DESKTOP (apps/desktop)
- Tauri 2 around the same web build. Plugins only for: deep link, OS keychain, file open and save dialogs.
- Windows first. No Electron.

PERFORMANCE BUDGETS (a task fails if exceeded)
- First load JS: 150 KB gzip or less before lazy chunks.
- Cached start to usable editor: under 1 second.
- Keystroke to paint: under 16 ms.
- No layout shift after first paint.

DEPENDENCY RULE: adding any package not named here needs written approval. Prefer the browser's own API over a package.