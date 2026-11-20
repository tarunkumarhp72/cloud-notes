---
name: ui-parity-check
description: Compare implemented UI screenshots against Windows 11 Notepad reference screenshots with pixel-level precision, checking layout, dimensions, colors, typography, spacing, icons, labels, borders, and overflow.
---

# UI Parity Check Skill

This skill defines the systematic process for verifying that the implemented user interface strictly adheres to the visual and functional specifications of Windows 11 Notepad, using reference images located in `reference/`.

## Purpose & Scope
- Compare rendered screenshots against reference screenshots in `reference/` (e.g. `image.png`, `image copy.png`, etc.).
- Ensure visual fidelity across layout, alignment, dimensions, color palettes, typography, spacing, iconography, borders, and overflow behavior.
- Document any variance in `qa/screenshots/<task-id>/analysis.md`.
- **Absolute Rule:** Never invent, infer, or guess design specifications when reference evidence is missing or ambiguous. If reference detail is unclear, inspect other reference images or flag in `analysis.md`.

## Inspection Checklist
When comparing a captured screenshot with the reference:

1. **Window Chrome & Tab Bar**
   - Window control buttons (minimize, maximize/restore, close) positioning, size, hover states, and title bar drag region.
   - Tab appearance: active tab background, border radius, close button (`×`) placement, font weight, tab padding, and add tab (`+`) button alignment.
   - App icon placement and fidelity (Notepad icon at top-left).

2. **Menu & Command Bar**
   - Menu items: "File", "Edit", "View" text, padding, hover highlights, dropdown menu padding, separator lines, and keyboard accelerator underlines/shortcuts.
   - Toolbar tools: Format dropdowns ("H1", etc.), list formatting, bold, italic, strikethrough, link, table, font/color controls, settings gear, and feedback icon.
   - Icon style: Native Windows 11 Fluent UI System Icons (SVG), stroke width, size (typically 16x16 or 20x20 px), color tone matching active theme.

3. **Editor Surface & Canvas**
   - Background color: Pure white/neutral in light mode, dark mica/acrylic gray in dark mode (sample exact hex values from reference).
   - Caret & Selection: Caret color, blinking behavior, text selection highlight color.
   - Margins & Padding: Left/right text margin padding relative to window edges and line numbering if active.
   - Typography: Font family (`Segoe UI Variable` for UI, `Consolas` / `ui-monospace` for editor text), font size, line height, letter spacing.

4. **Status Bar**
   - Content format: `Ln X, Col Y` | `X characters` | encoding (e.g. `UTF-8`) | line ending (e.g. `Windows (CRLF)`) | zoom level (e.g. `100%`) | editor mode (`Plain text` / `Markdown`).
   - Position: Fixed at bottom, full width, border-top separator line, padding and alignment.

5. **Borders, Radii & Shadows**
   - Subtle 1px borders matching Windows 11 Fluent Design System tokens.
   - Corner rounding on menus, dialogs, inputs, and tab elements (standard 4px to 8px where shown in reference).

6. **Overflow & Edge Cases**
   - No unexpected scrollbars (especially no horizontal scrollbar on main container at 320px+).
   - Text truncation with ellipsis where appropriate.

## Execution Workflow

1. **Acquire Screenshots**
   - Capture clean viewport screenshots at required resolutions using the Playwright MCP or browser automation.
   - Save screenshots to `qa/screenshots/<task-id>/<width>x<height>.png`.

2. **Side-by-Side Comparison**
   - Load both reference image and captured screenshot using image inspection tools.
   - Color sample directly from the reference image for foreground, background, border, and accent colors.

3. **Generate `analysis.md`**
   - Create or update `qa/screenshots/<task-id>/analysis.md` using the standard template:
   ```markdown
   # UI Parity Analysis: <task-id>

   ## Reference Comparison
   - Reference image: reference/image.png
   - Captured screenshot: qa/screenshots/<task-id>/<resolution>.png

   ## Discrepancies Found
   | Element | Expected (Reference) | Actual (Captured) | Severity | Status |
   |---------|----------------------|-------------------|----------|--------|
   | (e.g., Tab close button) | 16px right margin | 12px right margin | Low | Fixed / Open |

   ## Color & Typography Verification
   - Editor background: Expected `#FFFFFF`, Actual `#FFFFFF` (PASS)
   - Status bar text color: Expected `#5A5A5A`, Actual `#5A5A5A` (PASS)

   ## Summary
   - Total differences: 0
   - Result: PASS / FAIL
   ```

4. **Pass Criteria**
   - The parity check passes ONLY when `analysis.md` records **0 differences** and no visual regressions exist.
