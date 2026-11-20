# Task Evidence: T-025 Status Bar

## Task Overview
- **Task ID:** T-025
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement status bar with Ln and Col, character count, text mode label, zoom percentage, line ending, and encoding.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/statusbar/StatusBar.module.css`:
  - 24px fixed height status bar with flex justify-between alignment, subtle hover states on interactive segments, and Segoe UI Variable typography.
- `apps/web/src/components/statusbar/StatusBar.tsx`:
  - Dedicated accessible `StatusBar` component with props for `line`, `col`, `charCount`, `selectedCount`, `mode`, `zoomLevel`, `lineEnding`, `encoding`, `onGoToClick`, `onZoomClick`, and `visible`.
- `apps/web/src/components/statusbar/StatusBar.test.tsx`:
  - 3 unit tests verifying conditional rendering, cursor coordinate formatting, mode switching, selected character counts, and click actions.
- `apps/web/src/App.tsx`:
  - Replaced inline footer markup with `<StatusBar ... />` bound to `cursorPos`, `zoomLevel`, `markdownMode`, and `statusBarVisible`.
- `apps/web/src/index.ts`:
  - Exported `StatusBar` and its prop types.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-025/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-025/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-025/analysis.md)

## Test Results
- Unit Tests: PASS (79/79 in @notepad/web, 104/104 across monorepo)
- Typecheck: PASS (`tsc --noEmit` across all 4 monorepo packages)
- Initial Bundle Budget: PASS (84.07 kB gzipped initial bundle, target < 150 kB)
- Security: No static secrets in code, git, or tests.
