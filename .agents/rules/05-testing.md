# 05-testing.md: testing rules

LEVELS
1. Unit (Vitest): crypto round trip and tamper detection, debounce with max-wait, sync conflict handling, token rotation and reuse detection, Markdown conversion. packages/core must keep 90 percent line coverage or more.
2. Integration: the API against a local Postgres, covering every endpoint including failures (bad token, expired token, reused refresh token, oversized note, replayed push).
3. End to end (Playwright), at minimum:
   - Type, stop, and confirm the note is saved locally within 1 second.
   - Go offline, edit, go online, confirm the note syncs without user action.
   - Close the tab immediately after typing, reopen, confirm nothing was lost.
   - Two tabs editing the same note: confirm no silent overwrite and a conflict tab appears.
   - Google sign-in with a mocked provider: first login creates the account; second login signs in.
   - Access token expiry after 15 minutes refreshes silently; refresh token expiry asks to sign in and keeps local notes.
   - Wrong vault passphrase fails; recovery key unlocks.
4. Visual and responsive: the screenshot loop in 03-design.md at every listed viewport, light and dark.
5. Accessibility: axe checks with zero serious or critical issues; full keyboard use.
6. Performance: the budgets in 02-tech.md checked with Lighthouse or a trace.

PASS RULES
- A task is done only when lint, typecheck and all tests pass and the evidence is saved.
- Never skip, disable or weaken a test to make it pass. If a test is wrong, say so in BLOCKED.md.
- Fix the cause, not the symptom. A failing test is fixed in the code unless the requirement itself is wrong.
- Run the full suite before starting the next task. If an earlier task breaks, fix it first.
- Tests use fake data only. Never a real account, real note or real secret.