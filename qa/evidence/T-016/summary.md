# Task Evidence: T-016 View Menu Dropdown

## Task Overview
- **Task ID:** T-016
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement View menu with Zoom submenu, Status bar toggle, Word wrap toggle, and Markdown mode.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/menu/ViewMenu.tsx`:
  - Full View menu dropdown matching Windows 11 Notepad (`reference/image copy 3.png`).
  - Gutter checkmarks for toggles (Status bar, Word wrap, Markdown).
  - Submenu for Zoom with Zoom in (`Ctrl+Plus`), Zoom out (`Ctrl+Minus`), and Restore default zoom (`Ctrl+0`).
- `apps/web/src/components/menu/MenuDropdown.module.css`:
  - Added checkmark gutter and submenu positioning rules.
- `apps/web/src/components/menu/ViewMenu.test.tsx`:
  - 3 unit tests verifying items, toggles, checkmarks, and submenu actions.
- `apps/web/src/App.tsx`:
  - Wired `ViewMenu` into `MenuBar.renderViewDropdown`.
  - Added bottom status bar matching `reference/image.png` reacting to `statusBarVisible`.
- `apps/web/src/index.ts`:
  - Exported `ViewMenu`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-016/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-016/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-016/analysis.md)

## Test Results
- Unit Tests: PASS (40/40 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
