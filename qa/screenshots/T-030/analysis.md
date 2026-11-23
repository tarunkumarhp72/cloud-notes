# Screenshot Analysis: T-030 Recovery Key Generation and Display Modal

## 1. Visual Inspection
- **Captured Viewports**:
  - `qa/screenshots/T-030/1440x900.png` (Light Theme - Setup Display)
  - `qa/screenshots/T-030/1440x900-dark.png` (Dark Theme - Setup Display)
  - `qa/screenshots/T-030/recover-dialog.png` (Dark Theme - Recover Prompt)

## 2. Design Parity & Alignment
- **Setup Display Mode**:
  - Key header icon with clear Fluent typography ("Emergency Recovery Key").
  - Amber warning box notifying the user that the key is shown only once and cannot be regenerated.
  - Monospace formatted code card: 64 uppercase hex characters split into 16 hyphenated 4-character chunks (`XXXX-XXXX-...`).
  - Action row with "Copy recovery key" button providing immediate visual confirmation upon copy.
  - Confirmation checkbox: "I have securely saved this recovery key".
  - "Done" button disabled until the user confirms they saved their key.
- **Recovery Mode**:
  - Clean textarea for pasting the emergency recovery key.
  - Clear label and instructions for restoring vault access when passphrase is forgotten.
  - Windows 11 Fluent dark mode contrast and styling tokens applied consistently.

## 3. Interaction Verification
- Seamless transition from initial passphrase creation to emergency key display.
- One-click copy to clipboard with feedback checkmark.
- "Forgot passphrase?" trigger directly switches to recovery mode.
- Zero plaintext recovery secrets stored on disk or transmitted across network boundaries.
