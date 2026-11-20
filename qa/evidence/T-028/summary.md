# Task Evidence: T-028 File Open dialog, Save as export, and local file import

## Task Overview
- **Task ID:** T-028
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement File > Open note picker, Save as export (.txt/.md), and local drag-and-drop file import.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/file/fileIo.ts`:
  - `exportNoteToFile`: Triggers browser file download with proper MIME type and `.txt` / `.md` file extensions.
  - `readFileAsText`: Asynchronously reads File blob and determines markdown status.
  - `useFileDragAndDrop`: Global drag-over and drop event hook importing dropped text/markdown files into fresh tabs.
- `apps/web/src/components/file/fileIo.test.ts`:
  - 3 unit tests verifying `.txt` and `.md` file export, URL object creation/revocation, and file reading.
- `apps/web/src/components/file/OpenNotesDialog.module.css`:
  - Modal dialog styling, scrim backdrop, search input, note list items with hover feedback, and footer action buttons.
- `apps/web/src/components/file/OpenNotesDialog.tsx`:
  - Dialog for browsing and searching saved IndexedDB notes, with "Open file from computer..." file picker integration.
- `apps/web/src/components/file/OpenNotesDialog.test.tsx`:
  - 4 unit tests verifying note listing, search query filtering, note selection callback, and cancel button.
- `apps/web/src/App.tsx`:
  - Connected `FileMenu` items (Open, Save, Save as), `Ctrl+O` shortcut, drag-and-drop import, and `OpenNotesDialog`.
- `apps/web/src/index.ts`:
  - Exported `OpenNotesDialog`, `exportNoteToFile`, `readFileAsText`, and `useFileDragAndDrop`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-028/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-028/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-028/analysis.md)

## Test Results
- Unit Tests: PASS (95/95 in @notepad/web, 120/120 across monorepo)
- Typecheck: PASS (`tsc --noEmit` across all 4 monorepo packages)
- Initial Bundle Budget: PASS (87.90 kB gzipped initial bundle, target < 150 kB)
- Security: No static secrets in code, git, or tests.
