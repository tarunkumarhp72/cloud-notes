# Visual Analysis: T-011 Window Title Bar & Tab Strip

## Reference Comparison
- **Reference Image:** `reference/image.png`
- **Exclusion Rule:** `reference/unwanted.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-011/1440x900.png` (Light)
  - `qa/screenshots/T-011/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Title Bar Dimensions:** 40px height with Fluent acrylic tint background matching reference.
- **Notepad App Icon:** 18x18px cyan notebook icon on far left.
- **Tab Geometry:**
  - Active tab: 32px height, 6px top corner radius, border-top/left/right `1px solid var(--border-subtle)`, white surface in light mode, dark surface in dark mode.
  - Tab title: Segoe UI Variable 12px, font-weight 500, with ellipsis overflow.
  - Tab close button: 18x18px with hover highlight and close `×` icon.
- **New Tab Button:** 28x28px `+` button aligned next to active tab with hover background.
- **Right Toolbar & Caption Controls:**
  - AccountMenu button and Settings gear button.
  - Windows 11 caption buttons (minimize, maximize, close) with 46px hit targets.
  - Close caption turns red (`#c42b1c`) on hover.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
