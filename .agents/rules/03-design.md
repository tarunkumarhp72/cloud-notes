# 03-design.md: look, responsive behaviour, screenshot loop

LOOK
- The reference/ images are the only design source. Match layout, size, colour, font, spacing, corner radius, icons and wording exactly. Sample colours from the images; never pick your own.
- Light, dark and system themes as in the reference. Define every colour as a CSS variable once.
- No animation except those visible in Windows Notepad.

DEVICES THAT MUST WORK (portrait and landscape where it applies)
| Device class | Test viewport (width x height) |
| Small mobile | 360x640 and 390x844 |
| Mobile landscape | 844x390 |
| Mini tablet | 600x960 |
| Tablet | 768x1024 and 820x1180 |
| Dual-screen mobile, single screen | 540x720 |
| Dual-screen mobile, spanned | 1114x720 |
| Laptop | 1366x768 and 1440x900 |
| Desktop and LCD | 1920x1080 |
| Large LCD | 2560x1440 |

RESPONSIVE RULES
- Layout is fluid. No fixed pixel widths for containers. No horizontal page scroll at any width from 320 up.
- At 1024px wide and above the interface looks exactly like the reference.
- Below 1024px only these changes are allowed: the tab strip scrolls horizontally; the toolbar scrolls horizontally; below 600px the File, Edit, View menus collapse into one Menu button that opens the same items.
- Dual-screen: when the viewport is spanned across a fold, do not place controls or text on the fold. Use the CSS viewport-segments media feature.
- Very large screens: keep the editor readable and the chrome at its normal size; no stretching of the toolbar.
- Touch (pointer: coarse): every tappable control at least 44x44 CSS px. Mouse: sizes as in the reference.
- Use dvh units, safe-area insets, and the visualViewport API so the on-screen keyboard never covers the caret.
- Never block pinch zoom. Respect prefers-color-scheme and prefers-reduced-motion. Keyboard focus is always visible. Text contrast meets WCAG AA.

SCREENSHOT LOOP (mandatory for every task that changes anything visible)
1. Start the app. Use the browser MCP (Playwright or Chrome DevTools) or the built-in browser.
2. For each viewport in the table, open the screen and take a screenshot. Save to qa/screenshots/<task-id>/<width>x<height>.png.
3. Look at each screenshot and the matching reference/ image. Write every difference you find into qa/screenshots/<task-id>/analysis.md: position, size, colour, font, spacing, icon, wording, overflow, clipped text, horizontal scroll, console errors.
4. Fix the differences. Take new screenshots. Repeat from step 3.
5. The task passes only when analysis.md lists zero differences for every viewport and the console is clean.
6. Also check dark theme and one touch-device emulation per task.