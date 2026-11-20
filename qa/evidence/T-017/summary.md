# Task Evidence: T-017 Formatting Toolbar: Heading Dropdown

## Task Overview
- **Task ID:** T-017
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Build center formatting toolbar heading dropdown (Title, Subtitle, Heading, Subheading, Section, Subsection, Body).
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/toolbar/Toolbar.module.css`:
  - Reusable toolbar button, dropdown card, active indicator pill, and typography scaling styles.
- `apps/web/src/components/toolbar/HeadingDropdown.tsx`:
  - Implemented 7 typographic heading options matching Windows 11 Notepad (`reference/image copy 4.png`).
  - Active selection indicator pill (`var(--accent-primary)`).
  - Outside click listener and accessible keyboard/focus management.
- `apps/web/src/components/toolbar/HeadingDropdown.test.tsx`:
  - 3 unit tests verifying trigger label, rendering of all 7 items, and selection callback.
- `apps/web/src/App.tsx`:
  - Integrated `HeadingDropdown` into `MenuBar.childrenToolbar`.
- `apps/web/src/index.ts`:
  - Exported `HeadingDropdown`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-017/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-017/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-017/analysis.md)

## Test Results
- Unit Tests: PASS (43/43 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
