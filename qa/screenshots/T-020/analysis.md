# Visual Analysis: T-020 Formatting Toolbar: Table Dropdown

## Reference Comparison
- **Reference Image:** `reference/image copy 6.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-020/1440x900.png` (Light)
  - `qa/screenshots/T-020/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Toolbar Trigger Placement:** Located directly between the Link button and the Clear formatting button, matching the center toolbar in `image copy 6.png`.
- **Grid Picker:** 5 columns by 5 rows of rounded square cells (25 total cells).
- **Interactive Highlight:** Hovering over cell (3, 3) dynamically highlights all 9 cells from (1, 1) to (3, 3) with blue accent outline and subtle tint, and updates the header text to `"3 × 3 Table"`.
- **Dropdown Items:**
  1. `Insert table`
  2. `Edit table ›` (disabled with muted styling when caret is outside a table)
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
