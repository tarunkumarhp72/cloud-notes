# Screenshot Analysis: T-038 Offline Startup and Local-First Editor Boot

## 1. Visual Inspection
- **Captured Viewports**:
  - `qa/screenshots/T-038/1440x900.png` (Light Theme)
  - `qa/screenshots/T-038/1440x900-dark.png` (Dark Theme)

## 2. Design Parity & Alignment
- **Offline Indication**:
  - Discrete cloud-with-slash offline icon with "Offline" label cleanly rendered in the status bar alongside zoom, line/col, and text encoding.
  - Zero disruptive full-screen blocking modals or banners when disconnected; editor remains completely accessible and editable.
- **Local-First Editor Boot**:
  - Initial active note tab is populated directly from local IndexedDB cache with zero network requests.
  - Full editing and tab operations remain operational with local auto-save queueing mutations into client Outbox.
- **Theming**:
  - Light mode: subtle gray offline icon and text adhering to Windows 11 Notepad secondary text specifications.
  - Dark mode: clean contrast offline indicator matching dark mode status bar tokens.
