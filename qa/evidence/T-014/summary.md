# Task Evidence: T-014 File Menu Dropdown

## Task Overview
- **Task ID:** T-014
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement File menu dropdown with New tab, New window, Open, Save, Save as, Save all, Print, Close tab, Close window, Exit.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/menu/FileMenu.tsx`:
  - Full File menu dropdown with exact items, shortcut labels, and separator positioning matching Windows 11 Notepad (`reference/image copy.png`).
  - Action callbacks for New tab, New window, New Markdown tab, Open, Save, Save as, Save all, Page setup, Print, Close tab, Close window, Exit.
- `apps/web/src/components/menu/MenuDropdown.module.css`:
  - Reusable Fluent dropdown styling, animation, hover states, and dark mode variables.
- `apps/web/src/components/menu/FileMenu.test.tsx`:
  - 2/2 unit tests passed checking all items, shortcut labels, and click callbacks.
- `apps/web/src/App.tsx`:
  - Wired `FileMenu` into `MenuBar.renderFileDropdown`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-014/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-014/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-014/analysis.md)

## Test Results
- Unit Tests: PASS (34/34 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
