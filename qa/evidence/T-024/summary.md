# Task Evidence: T-024 Find and replace floating bar & Go to line dialog

## Task Overview
- **Task ID:** T-024
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Build Windows 11 Notepad Find and Replace bar (Ctrl+F, Ctrl+H) and Go to line dialog (Ctrl+G).
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/editor/FindReplaceBar.module.css`:
  - Fluent floating toolbar styling, acrylic background blur, responsive icon buttons, match badge, and animated entry.
- `apps/web/src/components/editor/FindReplaceBar.tsx`:
  - Floating Find and Replace component with find query, match count badge, previous/next buttons, match case toggle, wrap around toggle, expand/collapse replace row, and replace/replace all buttons.
- `apps/web/src/components/editor/FindReplaceBar.test.tsx`:
  - 4 unit tests verifying rendering, search query input, Enter key dispatch, match case / wrap around toggles, and replace actions.
- `apps/web/src/components/editor/GoToDialog.module.css`:
  - Centered modal dialog styling with scrim backdrop, fluent typography, and action buttons.
- `apps/web/src/components/editor/GoToDialog.tsx`:
  - Go to line dialog with validation against maximum document line count.
- `apps/web/src/components/editor/GoToDialog.test.tsx`:
  - 4 unit tests verifying line input, submission, bounds error, and escape/cancel handling.
- `apps/web/src/components/editor/CodeMirrorEditor.tsx`:
  - Implemented `CodeMirrorEditorRef` exposing `findNext`, `findPrevious`, `replace`, `replaceAll`, `getMatchesInfo`, `goToLine`, and `getTotalLines`.
- `apps/web/src/components/editor/CodeMirrorEditor.test.tsx`:
  - Unit test verifying imperative ref methods.
- `apps/web/src/App.tsx`:
  - Wired `FindReplaceBar` and `GoToDialog` to editor surface, `EditMenu` actions, and `Ctrl+F`, `Ctrl+H`, `Ctrl+G` keyboard shortcuts.
- `apps/web/src/index.ts`:
  - Exported `FindReplaceBar`, `GoToDialog`, and `CodeMirrorEditorRef`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-024/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-024/1440x900-dark.png)
- [Go To Dialog Dark](qa/screenshots/T-024/goto-dialog-dark.png)
- [Visual Analysis](qa/screenshots/T-024/analysis.md)

## Test Results
- Unit Tests: PASS (76/76 in @notepad/web, 101/101 across monorepo)
- Typecheck: PASS (`tsc --noEmit` across all 4 monorepo packages)
- Initial Bundle Budget: PASS (83.88 kB gzipped initial bundle, target < 150 kB)
- Security: No static secrets in code, git, or tests.
