# Task Evidence: T-011 Window Title Bar and Tab Strip Layout

## Task Overview
- **Task ID:** T-011
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Build native-looking Windows 11 title bar and tab strip container matching reference images.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/tabs/TabStrip.tsx`:
  - Title bar with Notepad icon, tab container, new tab (+) button, right action container, and Windows 11 caption controls (minimize, maximize, close).
  - Active tab styling with white background and rounded top corners (6px radius).
  - Dirty dot indicator for unsaved changes.
  - Accessible keyboard navigation (`Enter` / `Space` selection, ARIA `tablist` and `tab` roles).
- `apps/web/src/components/tabs/TabStrip.module.css`:
  - Fluent acrylic background, dark/light theme support, responsive horizontal scrolling.
- `apps/web/src/components/tabs/TabStrip.test.tsx`:
  - 5/5 unit tests passed covering rendering, active tab state, tab selection, close button click, and new tab click.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-011/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-011/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-011/analysis.md)

## Test Results
- Unit Tests: PASS (21/21 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across all workspace projects)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets or unwanted files.
