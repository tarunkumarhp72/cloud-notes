# Workflow: plan

PRECONDITION: PREFLIGHT.md must end with READY. If not, stop and say so.

INPUT: reference/, 01-scope.md, 02-tech.md, 03-design.md, 04-coding.md, 05-testing.md. Read all of them fully first. Write no code in this run.

OUTPUT 1: PLAN.md (also create it as a Plan artifact for review). Phases in this order:
1 Foundations: monorepo, CI, Supabase migrations, Vercel and environment setup.
2 Auth: Google sign-in with our own code, 15-minute access token, 15-day rotating refresh token, sessions.
3 Notepad shell: tabs, menus, toolbar, status bar, plain and rich editor, settings, shortcuts, local IndexedDB, local auto-save.
4 Encryption: vault passphrase, recovery key, encrypted notes.
5 Sync: outbox, push, pull, retries, conflict tab, multi-tab messaging.
6 Offline and PWA: service worker, install, offline start.
7 Responsive: every device class in 03-design.md.
8 Hardening: rate limits, CSP, backups, account deletion.
9 Desktop: Tauri shell, keychain, deep-link sign-in.

OUTPUT 2: TASKS.md. One entry per task, in this exact format:
- ID: T-001
- Title:
- Scope line: the exact line of 01-scope.md (for example A3 or B4) this task implements
- Goal: one sentence
- Reference images: file names in reference/ (UI tasks)
- Files to create or change:
- Acceptance criteria: numbered, each one testable yes or no
- Tests to run: exact commands and the named test cases
- Viewports to screenshot: from 03-design.md (UI tasks), light and dark
- Depends on:
- Status: todo

TASK SIZE: one small vertical slice, about 200 changed lines or fewer, finishable and testable on its own. Split anything larger.

OUTPUT 3: a traceability table in PLAN.md mapping every line of 01-scope.md (A1 to A12, B1 to B6) to its task IDs. Every line must have at least one task. Every task must map to a line. A task with no scope line is forbidden.

GAPS: if a scope line, tech choice or design detail is unclear or missing, write it to QUESTIONS.md and do not create tasks for it yet.

FINISH: print the number of tasks per phase and any open questions, then STOP and wait for the user to reply: Plan approved.