# Visual Analysis: T-025 Status Bar

## Reference Comparison
- **Reference Image:** `reference/image.png`, `reference/image copy 8.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-025/1440x900.png` (Light)
  - `qa/screenshots/T-025/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Status Bar Layout & Geometry:** Fixed 24px bottom bar with `1px solid var(--border-subtle)` top border and matching Windows 11 app background (`var(--bg-app)`).
- **Left Group:**
  - `Ln 2, Col 29`: Interactive clickable button triggering Go to line (Ctrl+G) on click, with subtle hover highlight.
  - `71 characters`: Live text count updating synchronously with document keystrokes.
- **Right Group:**
  - `Plain text` (or `Markdown` in rich text mode): Accurately reflects editor mode.
  - `100%`: Interactive zoom percentage button.
  - `Windows (CRLF)`: Line ending indicator.
  - `UTF-8`: Encoding indicator.
- **Toggle Visibility:** Respects View menu -> Status bar toggle state immediately.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
