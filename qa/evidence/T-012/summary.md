# Task Evidence: T-012 Tab Management and Switching

## Task Overview
- **Task ID:** T-012
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Support multiple tabs with title, unsaved dot indicator, close button, drag-reorder, and Ctrl+Tab cycling.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/stores/tabsStore.ts`:
  - Zustand store managing tabs state, active tab pointer, content updates, dirty tracking, tab closing/resetting, drag-reorder, and sequential cycling (`cycleNextTab` / `cyclePreviousTab`).
- `apps/web/src/components/tabs/TabItem.tsx`:
  - Draggable tab item supporting HTML5 native drag-and-drop reordering, dirty dot indicator, title truncation, and individual close button.
- `apps/web/src/components/tabs/TabStrip.tsx`:
  - Integrated `onReorderTabs` handler and rendered `TabItem` components.
- `apps/web/src/components/tabs/tabs.test.tsx`:
  - 7/7 unit tests covering tab creation, active switching, dirty flag mutation, sequential cycling, tab reordering, adjacent tab selection on close, sole-tab reset, and drag-and-drop event handling.
- `apps/web/src/App.tsx`:
  - Wired in `useTabsStore` and registered window keyboard shortcuts (`Ctrl+Tab`, `Ctrl+Shift+Tab`, `Ctrl+N`, `Ctrl+W`).

## Visual Verification
- [1440x900 Light](qa/screenshots/T-012/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-012/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-012/analysis.md)

## Test Results
- Unit Tests: PASS (28/28 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
