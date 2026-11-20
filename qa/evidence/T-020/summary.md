# Task Evidence: T-020 Formatting Toolbar: Table Dropdown

## Task Overview
- **Task ID:** T-020
- **Phase:** Phase 3 - Notepad Shell
- **Goal:** Implement table insertion grid picker (up to 5x5) and Insert/Edit table controls.
- **Completed:** 2026-11-20

## Implemented Files
- `apps/web/src/components/toolbar/TableDropdown.module.css`:
  - 5x5 grid layout, rounded cell styles, accent highlight styles, and action row styling.
- `apps/web/src/components/toolbar/TableDropdown.tsx`:
  - Table grid picker supporting up to 5x5 dimensions matching `reference/image copy 6.png`.
  - Dynamic dimension preview (`"R × C Table"`), click-to-insert handler, and `Edit table` control.
- `apps/web/src/components/toolbar/TableDropdown.test.tsx`:
  - 4 unit tests verifying trigger, 5x5 grid cells, dimension insertion callback, and disabled states.
- `apps/web/src/App.tsx`:
  - Integrated `TableDropdown` into `MenuBar.childrenToolbar` between Link and Clear formatting.
- `apps/web/src/index.ts`:
  - Exported `TableDropdown`.

## Visual Verification
- [1440x900 Light](qa/screenshots/T-020/1440x900.png)
- [1440x900 Dark](qa/screenshots/T-020/1440x900-dark.png)
- [Visual Analysis](qa/screenshots/T-020/analysis.md)

## Test Results
- Unit Tests: PASS (56/56 in @notepad/web)
- Typecheck: PASS (`tsc --noEmit` across monorepo)
- Lint: PASS (0 errors, 0 warnings)
- Security: No static secrets in code, git, or tests.
