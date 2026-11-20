# Visual Analysis: T-018 Formatting Toolbar: Lists, Bold, Italic, Strikethrough, Clear formatting

## Reference Comparison
- **Reference Image:** `reference/image copy 5.png`
- **Captured Screenshots:**
  - `qa/screenshots/T-018/1440x900.png` (Light)
  - `qa/screenshots/T-018/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Toolbar Layout:** Positioned seamlessly adjacent to `H1 ▾` heading dropdown:
  1. `Lists ▾` button
  2. Bold (**B**) button
  3. Italic (*I*) button
  4. Strikethrough (~~S~~) button
  5. Clear formatting (`Ab`) button
- **List Dropdown Options:**
  1. Bulleted list
  2. Numbered list
  3. Increase indent (muted when indenting is unavailable)
  4. Decrease indent (muted when unindenting is unavailable)
- **Buttons Interaction:** Native Fluent hover and active depressed tone, toggling `aria-pressed` states when clicked.
- **Differences:** 0 differences found against reference.
- **Console Errors:** 0 console errors.

Status: PASS
