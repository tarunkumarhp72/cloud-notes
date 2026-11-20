# Task Evidence: T-015 Edit Menu Dropdown

## Task Overview
- **Task ID:** T-015
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement Edit menu with Undo, Redo, Cut, Copy, Paste, Delete, Clear formatting, Search with Bing, Find, Find next/prev, Replace, Go to, Select all, Time/Date, Font.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/menu/EditMenu.tsx`:
  - Full Edit menu dropdown with exact items, shortcut labels, disabled states, and separator positioning matching Windows 11 Notepad (`reference/image copy 2.png`).
  - Action callbacks for Undo, Cut, Copy, Paste, Delete, Clear formatting, Search with Bing, Find, Find next/prev, Replace, Go to, Select all, Time/Date, Font.
- `apps/web/src/components/menu/EditMenu.test.tsx`:
  - 3 unit tests verifying all items, shortcuts, disabled states, and click callbacks.
- `apps/web/src/App.tsx`:
  - Wired `EditMenu` into `MenuBar.renderEditDropdown`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-015/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-015/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-015/analysis.md)

## Test Results
- Unit Tests: PASS (37/37 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
