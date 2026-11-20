# Visual Analysis: T-021 Settings Page

## Reference Comparison
- **Reference Image:** `reference/image.png` / Windows 11 Notepad Settings specification
- **Captured Screenshots:**
  - `qa/screenshots/T-021/1440x900.png` (Light)
  - `qa/screenshots/T-021/1440x900-dark.png` (Dark)

## Observations & Parity Verification
- **Header:** Fluent back button (`←`) followed by bold 24px "Settings" title.
- **Section Cards:**
  1. **App theme:** Card with description and theme selection dropdown (`Light`, `Dark`, `Use system setting`).
  2. **Font:** Subsections for Font family (`Consolas`, `Segoe UI Variable`, `Cascadia Code`, `Courier New`) and Font size (`11 pt` through `24 pt`).
  3. **Word wrap:** Fluent interactive toggle switch with animated thumb.
  4. **Spelling:** Spell-check toggle switch.
  5. **Autocorrect:** Autocorrect toggle switch.
  6. **About Notepad Cloud:** Version 1.0.0, E2EE status verification (AES-256-GCM + Argon2id).
- **Navigation:** Back button smoothly returns user to the active notepad tab and editor surface.
- **Differences:** 0 differences found against Windows 11 Fluent design.
- **Console Errors:** 0 console errors.

Status: PASS
