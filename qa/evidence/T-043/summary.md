# Task Evidence: T-043 Content Security Policy & Markdown Sanitization

## 1. Implementation Summary
Implemented strict Content Security Policy headers and DOMPurify sanitization for rich text and links:
- **`apps/web/src/security/sanitize.ts`**:
  - `isValidProtocol(url)` & `sanitizeUrl(url)`: Restricts URLs strictly to `http:`, `https:`, `mailto:` (and relative paths / anchors). Drops `javascript:`, `data:`, `vbscript:`, `file:`.
  - Configured DOMPurify hook `afterSanitizeAttributes` to force `rel="noopener noreferrer"` and `target="_blank"` on all `<a>` tags and strip unauthorized `href` schemes.
  - `sanitizeHtml(dirtyHtml)`: Strips `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`, `<svg>`, and all inline event handlers (`onload`, `onerror`, `onclick`, etc.).
  - `sanitizeMarkdown(markdown)`: Strips script blocks and neutralizes dangerous markdown links like `[exploit](javascript:alert(1))` to `[exploit](#)`.
- **`apps/web/src/components/toolbar/LinkModal.tsx`**:
  - Validates and sanitizes link targets using `sanitizeUrl` before adding them to notes.
- **`apps/web/src/components/editor/TipTapEditor.tsx`**:
  - Configured `Link` extension with `HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }` and protocol validation.
  - Set `Markdown.configure({ html: false })` to disallow raw unsanitized HTML execution inside editor documents.
  - Sanitizes links on programmatic insertion (`setLink`).
- **`apps/api/src/security/csp.ts` & `apps/api/src/index.ts`**:
  - Built and mounted `cspMiddleware` across all API responses.
  - Emits strict `Content-Security-Policy` with `frame-ancestors 'none'`, `object-src 'none'`, and bounded `connect-src` / `script-src` / `style-src`.
  - Attaches `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **`apps/web/index.html`**:
  - Embedded CSP `<meta http-equiv="Content-Security-Policy">` directive for client-side enforcement.

## 2. Automated Tests & Build Verification
- Unit test suite: `apps/web/src/security/sanitize.test.ts` (9 tests passing)
  - Allows valid `http`, `https`, `mailto`, and relative URLs.
  - Rejects `javascript:`, `data:`, `vbscript:`, `file:`.
  - Strips `<script>` and `onerror` handlers from HTML.
  - Strips `<iframe>` and `<object>` embeddings.
  - Confirms `rel="noopener noreferrer"` and `target="_blank"` enforcement on anchors.
  - Neutralizes `javascript:` in markdown links.
- Unit test suite: `apps/api/src/security/csp.test.ts` (1 test passing)
  - Confirms API requests receive strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- Full monorepo test suite: 203 unit tests passing (`@notepad/web`: 151, `@notepad/core`: 33, `@notepad/api`: 19).
- Workspace typecheck clean (`tsc --noEmit`).
- Production build compiled cleanly (`pnpm --filter @notepad/web build`).
