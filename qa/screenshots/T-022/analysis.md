# Visual Analysis: T-022 Plain-Text Editor Surface (CodeMirror 6)

## Reference Comparison
- **Reference Image:** `reference/image.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-022/1440x900.png` (Light)
  - `qa/screenshots/T-022/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Editor Surface:** Seamless, borderless CodeMirror 6 plain text surface with zero layout shift.
- **Font & Typography:** Rendered with `Consolas, monospace` at 14px with 1.5 line height, matching Windows 11 Notepad.
- **Dirty State:** Typing text into the active tab immediately displays the unsaved indicator dot (`•`) in the tab title.
- **Real-Time Status Bar:** Live cursor coordinates (`Ln 3, Col 35`) and character count (`124 characters`) synchronized from CodeMirror view updates.
- **Word Wrap:** Compartment-based dynamic word wrap toggling without editor rebuild.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
