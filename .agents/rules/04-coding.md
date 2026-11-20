# 04-coding.md: how to write code

STYLE
- TypeScript strict. No any, no ts-ignore, no non-null assertions without a comment saying why.
- Small functions that do one thing. Files under 300 lines. Clear names; no abbreviations except common ones (id, url).
- No abstraction until the same code exists three times. No unused code, no dead flags, no commented-out code.
- Comments explain why, never what. No TODO left in committed code.
- No console.log in committed code. Use one small logger that is silent in production.

PERFORMANCE
- Typing must never wait on storage, encryption or network. Typing updates memory only; saving is debounced.
- Auto-save: save locally 1 second after typing stops; push to the server 2 seconds after that; force a save every 10 seconds of continuous typing; flush on visibilitychange and pagehide using fetch keepalive plus a localStorage recovery copy.
- Do not re-render the whole app on a keystroke. Virtualize long lists. Lazy-load heavy modules. Prefer browser APIs over packages.

DATA AND SERVER
- Every database query is parameterized. Every request body is validated with zod. All IO has a timeout and bounded retry with backoff and jitter.
- Schema changes only through numbered files in supabase/migrations. Ids are UUIDv7 made on the device. Timestamps are UTC timestamptz. Counters are bigint.
- The server never sees plaintext notes, passphrases or keys, and never logs note content or tokens.
- Secrets only from environment variables. Never in code, tests, screenshots or logs.

SECURITY
- Sanitize all rendered Markdown and links. Strict Content Security Policy. Refresh token in an httpOnly Secure SameSite cookie on web and the OS keychain on desktop. Access token in memory only.

GIT
- One task, one branch, one small commit with a clear message. Never commit secrets, node_modules or build output.