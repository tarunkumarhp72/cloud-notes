# Visual Analysis: T-015 Edit Menu Dropdown

## Reference Comparison
- **Reference Image:** `reference/image copy 2.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-015/1440x900.png` (Light)
  - `qa/screenshots/T-015/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Dropdown Placement:** Anchored directly beneath the active "Edit" menu item.
- **Item Order & Wording:**
  1. Undo (`Ctrl+Z`)
  2. [Separator]
  3. Cut (`Ctrl+X`) [disabled when no selection]
  4. Copy (`Ctrl+C`) [disabled when no selection]
  5. Paste (`Ctrl+V`)
  6. Delete (`Del`) [disabled when no selection]
  7. [Separator]
  8. Clear formatting
  9. Search with Bing (`Ctrl+E`)
  10. [Separator]
  11. Find (`Ctrl+F`)
  12. Find next (`F3`)
  13. Find previous (`Shift+F3`)
  14. Replace (`Ctrl+H`)
  15. Go to (`Ctrl+G`)
  16. [Separator]
  17. Select all (`Ctrl+A`)
  18. Time/Date (`F5`)
  19. [Separator]
  20. Font
- **Typography & Alignment:** Segoe UI Variable font, labels aligned on left, shortcuts right-aligned with secondary text opacity, disabled items rendered with standard Fluent muted opacity.
- **Separators:** 1px subtle divider lines positioned precisely matching reference.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
