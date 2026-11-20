# 01-scope.md: what to build

PRODUCT: A pixel-faithful replica of Windows 11 Notepad (tabs, menus, formatting toolbar, status bar) that runs in the browser and in a desktop app.

A. REPLICATED EXACTLY (match reference/ images for layout, size, colour, font, spacing, icons, wording)
A1  Title and tab strip: tabs with title, unsaved dot, close button, new-tab (+) button, tab drag to reorder, tab switching with Ctrl+Tab.
A2  Menu bar: File, Edit, View.
A3  File menu: New tab, New window, Open, Save, Save as, Save all, Print, Close tab, Close window.
A4  Edit menu: Undo, Redo, Cut, Copy, Paste, Delete, Find, Find next, Find previous, Replace, Go to, Select all, Time/Date.
A5  View menu: Zoom in, Zoom out, Restore default zoom, Status bar toggle, Word wrap toggle.
A6  Formatting toolbar (centre): heading dropdown, list dropdown, bold, italic, strikethrough, link, table dropdown, clear-formatting button, in the order and look of the reference.
A7  Right toolbar: account button and settings button (see section B for what the account button does).
A8  Editor surface: text entry, selection, undo history, find and replace bar, go-to-line, zoom with Ctrl+wheel, word wrap.
A9  Status bar: Ln and Col, character count, text mode label, zoom percent, line ending, encoding, as in the reference.
A10 Settings page: only the options Windows Notepad has that make sense here: theme (light, dark, system), font family, font size, word wrap, spell check, autocorrect.
A11 Keyboard shortcuts identical to Windows Notepad.
A12 Rich text: bold, italic, strikethrough, headings, lists, links and tables as the toolbar offers. Notes are stored as Markdown.

B. ALLOWED ADDITIONS (this list is complete)
B1  Google sign-in and registration: one screen at first launch, and the account button menu (signed-in name, sign out). Nothing else.
B2  Vault unlock: create passphrase, unlock with passphrase, recovery key shown once. Plain Notepad styling.
B3  Auto-save, offline use and background sync. The only visible sign is the status-bar text: Saving, Saved, Offline, Sync failed.
B4  Saved notes appear as tabs. File > Open shows a plain list dialog of saved notes. File > Save forces a sync. File > Save as exports a .txt or .md file. Opening a local .txt or .md imports it as a note.
B5  Sync conflict: the losing version opens as a new tab named after the note plus the word conflict. No other conflict screen.
B6  Responsive layout rules in 03-design.md.

C. DO NOT BUILD (not in Notepad, or not requested)
Sidebar or notes list panel, folders, tags, search across notes, trash or restore, version history, sharing, collaboration, comments, AI or rewrite features, the what's-new button, onboarding tours, tips, ads, analytics, notifications, templates, extra themes, extra languages, any page not named above.

D. WHEN IN DOUBT
If a thing is not in A or B or visible in reference/, it does not exist. Ask in QUESTIONS.md.