# Screenshot Analysis: T-029 Vault Passphrase & Unlock UI

## 1. Visual Inspection
- **Captured Viewports**:
  - `qa/screenshots/T-029/1440x900.png` (Light Theme)
  - `qa/screenshots/T-029/1440x900-dark.png` (Dark Theme)

## 2. Design Parity & Alignment
- **Modal Dialog**: Centered overlay modal styled according to Windows 11 Fluent Design with rounded corners (8px radius), subtle drop shadow, and clean acrylic scrim backdrop.
- **Header**: Lock icon with Fluent Notepad typography ("Protect your notes with encryption"). Clear explanatory description detailing zero-knowledge Web Crypto AES-256-GCM.
- **Form Controls**:
  - Styled password input with toggle show/hide visibility icon button.
  - Confirmation password input during initial vault setup.
  - "Set passphrase" primary accent button and secondary "Cancel" button matching Windows 11 Fluent button standards.
- **Theming**:
  - Light mode: crisp neutral surface (`#ffffff`), dark typography (`#1b1b1b`), subtle input borders (`#e0e0e0`).
  - Dark mode: deep dark background (`#202020` / `#2b2b2b`), crisp light text (`#f0f0f0`), high-contrast accent button.

## 3. Interaction Verification
- Escape key and backdrop click cancel and close dialog cleanly.
- Real-time client-side validation prevents short passphrases (<6 characters) or mismatching confirmation passphrases.
- Key derivation executed in memory via Argon2id without passing secrets across network boundaries.
