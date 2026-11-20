# Visual Analysis: T-028 File Open dialog, Save as export, and local file import

## Reference Comparison
- **Reference Image:** `reference/image copy.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-028/1440x900.png` (Light)
  - `qa/screenshots/T-028/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Open Notes Dialog:**
  - Centered modal dialog with backdrop scrim matching Windows 11 fluent styling.
  - Title "Open note" with close button (X).
  - Search filter input ("Search saved notes...").
  - Clean note list showing note title, formatted date, and type badge ("Plain text" or "Markdown").
  - "Open file from computer..." button for uploading local disk files directly.
  - "Cancel" button to dismiss.
- **Save As Export:**
  - Automatically appends `.txt` or `.md` depending on active note mode.
  - Triggers standard native browser download.
- **Drag-and-Drop Import:**
  - Global dragover and drop listeners parse `.txt` and `.md` files dropped anywhere on the window and seamlessly import them into a new tab.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
