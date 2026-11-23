# Screenshot Analysis: T-041 Touch Target Sizing & Virtual Keyboard Handling

## 1. Visual Inspection
- **Captured Viewports**:
  - `qa/screenshots/T-041/390x844.png` (iPhone 12/13/14 Mobile Viewport 390x844 - Light Theme)
  - `qa/screenshots/T-041/390x844-dark.png` (iPhone 12/13/14 Mobile Viewport 390x844 - Dark Theme)

## 2. Touch Target & Viewport Compliance
- **44x44 CSS px Minimum Target Compliance**:
  - Under `@media (pointer: coarse)` in `apps/web/src/styles/touch.css`, interactive elements (buttons, tabs, action triggers, dropdown items, close buttons) expand their minimum touch bounding box to `44px x 44px`.
  - Padding and pseudo-element hit-slops allow users with coarse touch input (smartphones, tablets) to reliably tap controls without mis-tapping adjacent actions.
- **Dynamic Viewport Height (`dvh`) & Safe Areas**:
  - `.appContainer` is styled with `height: 100dvh` (with fallback to `100vh`) to prevent iOS Safari and Android Chrome dynamic bottom navigation bars from clipping or hiding the status bar.
  - Safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, etc.) ensure the title bar, editor, and status bar do not collide with device notches or home indicator bars.
- **Visual Viewport Caret Auto-Scroll**:
  - `useVisualViewport` tracks `window.visualViewport` resize and scroll events.
  - When the on-screen virtual keyboard appears, it automatically recalculates the visible viewport height, adjusts container height, and scrolls active cursor/caret elements (`.cm-cursor`, contenteditable focus) into the visible viewport so the user's typing is never occluded.
