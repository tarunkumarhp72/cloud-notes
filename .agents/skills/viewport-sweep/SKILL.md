---
name: viewport-sweep
description: Automated cross-viewport responsive testing across all device profiles specified in 03-design.md, testing light and dark themes and touch emulation, saving verified screenshots under qa/screenshots/<task-id>/.
---

# Viewport Sweep Skill

This skill conducts a complete, automated responsive sweep across all mandatory device resolutions, theme variations, and input modalities as defined in `03-design.md`.

## Mandatory Viewport Matrix

Every visual UI task must be verified across the following complete viewport table:

| Device Class | Viewport (Width x Height) | Orientation | Notes |
|--------------|---------------------------|-------------|-------|
| Small mobile | 360 x 640 | Portrait | Minimum mobile baseline |
| Small mobile | 390 x 844 | Portrait | Modern standard mobile |
| Mobile landscape | 844 x 390 | Landscape | Compact vertical space |
| Dual-screen single | 540 x 720 | Portrait | Surface Duo single screen |
| Mini tablet | 600 x 960 | Portrait | Menu collapsing threshold |
| Tablet | 768 x 1024 | Portrait | Medium tablet baseline |
| Tablet | 820 x 1180 | Portrait | Modern tablet |
| Dual-screen spanned | 1114 x 720 | Landscape | Fold consideration (`viewport-segments`) |
| Laptop standard | 1366 x 768 | Landscape | Most common legacy laptop |
| Laptop HD+ | 1440 x 900 | Landscape | Common 16:10 laptop |
| Desktop / FHD | 1920 x 1080 | Landscape | Standard 1080p display |
| Large LCD / QHD | 2560 x 1440 | Landscape | High-resolution desktop |

## Additional Required Modes
1. **Dark Theme Sweep:**
   - Execute at least one full desktop resolution (1440x900 or 1920x1080) and one mobile resolution (390x844) with dark theme (`prefers-color-scheme: dark` or theme selector).
2. **Touch Emulation Sweep:**
   - Test at 390x844 with `hasTouch: true` and mobile viewport emulation.
   - Verify every touch target is at least 44x44 CSS px (`pointer: coarse` rule).

## Execution Procedure

1. **Environment Preparation**
   - Ensure the dev server is active and accessible.
   - Create the destination directory: `qa/screenshots/<task-id>/`.

2. **Automated Sweep Execution**
   - For each resolution `(width, height)` in the matrix:
     1. Set browser viewport size via Playwright MCP (`browser_resize` or Playwright script).
     2. Wait for layout settling and idle network.
     3. Take screenshot and save to `qa/screenshots/<task-id>/<width>x<height>.png`.
     4. Capture any console errors or warnings logged during resize and rendering.
   - For Dark Mode:
     1. Emulate color scheme `dark`.
     2. Save to `qa/screenshots/<task-id>/<width>x<height>-dark.png`.
   - For Touch Emulation:
     1. Emulate touch device capabilities.
     2. Save to `qa/screenshots/<task-id>/<width>x<height>-touch.png`.

3. **Automated Dimension & Overflow Verification**
   - Verify that the saved image width and height exactly match the requested dimensions.
   - Inspect page DOM for horizontal overflow: `document.documentElement.scrollWidth <= window.innerWidth`.
   - If horizontal scrolling occurs at width >= 320px, record a FAIL.
   - If menus fail to collapse below 600px into the consolidated menu button, record a FAIL.

4. **Output Verification Report**
   - Record results in `qa/screenshots/<task-id>/sweep-report.md`:
   ```markdown
   # Viewport Sweep Report: <task-id>

   | Viewport | Device Class | Theme | Actual Image Dimensions | Horizontal Scroll? | Status |
   |----------|--------------|-------|--------------------------|---------------------|--------|
   | 360x640  | Small mobile | Light | 360x640                  | None                | PASS   |
   | 390x844  | Small mobile | Touch | 390x844                  | None                | PASS   |
   | 1440x900 | Laptop       | Light | 1440x900                 | None                | PASS   |
   | 1440x900 | Laptop       | Dark  | 1440x900                 | None                | PASS   |

   Overall Result: PASS / FAIL
   ```
