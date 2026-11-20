# Visual Analysis: T-024 Find and replace floating bar & Go to line dialog

## Reference Comparison
- **Reference Image:** `reference/image.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-024/1440x900.png` (Find & Replace Expanded Light)
  - `qa/screenshots/T-024/1440x900-dark.png` (Find & Replace Expanded Dark)
  - `qa/screenshots/T-024/goto-dialog-dark.png` (Go to line Dialog Dark)

## Observations & Parity Verification
- **Floating Bar Placement:** Positioned in upper right of the editor surface (`top: 8px, right: 24px`) with acrylic blur, fluent box shadow, and 1px border.
- **Find Controls:**
  - Chevron toggle for expanding Replace row
  - Find query input with placeholder "Find"
  - Match count indicator badge ("1/5" / "0/0")
  - Previous match (Shift+F3) and Next match (F3) arrow buttons
  - Match case ("Aa") toggle with active blue state
  - Wrap around toggle with active blue state
  - Close button (Esc)
- **Replace Controls:**
  - Smooth expansion below Find row
  - Replace input with placeholder "Replace"
  - "Replace" and "Replace all" action buttons
- **Go To Line Dialog:**
  - Centered modal dialog with backdrop scrim
  - Title "Go to line"
  - Number input pre-filled with current line
  - Bounds error handling ("The line number is beyond the total number of lines")
  - "Go to" accent button and "Cancel" button
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
