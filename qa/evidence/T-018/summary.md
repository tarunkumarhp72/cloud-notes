# Task Evidence: T-018 Formatting Toolbar: Lists, Bold, Italic, Strikethrough, Clear formatting

## Task Overview
- **Task ID:** T-018
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement list dropdown, bold, italic, strikethrough, and clear-formatting buttons in formatting toolbar.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/toolbar/ListDropdown.tsx`:
  - List dropdown matching Windows 11 Notepad (`reference/image copy 5.png`).
  - Bulleted list, Numbered list, Increase indent, and Decrease indent options.
- `apps/web/src/components/toolbar/FormatButtons.tsx`:
  - Bold, Italic, Strikethrough, and Clear formatting buttons with Fluent SVG icons and toggle state.
- `apps/web/src/components/toolbar/ListDropdown.test.tsx`:
  - 3 unit tests verifying trigger, rendering of all 4 list options, and callbacks.
- `apps/web/src/components/toolbar/FormatButtons.test.tsx`:
  - 2 unit tests verifying buttons, active pressed attributes, and click callbacks.
- `apps/web/src/App.tsx`:
  - Wired list and format buttons into `MenuBar.childrenToolbar`.
- `apps/web/src/index.ts`:
  - Exported `ListDropdown` and `FormatButtons`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-018/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-018/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-018/analysis.md)

## Test Results
- Unit Tests: PASS (48/48 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
