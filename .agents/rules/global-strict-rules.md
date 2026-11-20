# Global rules: strict replica mode

PROJECT: Notepad Cloud, a replica of Windows 11 Notepad with Google sign-in, offline use, auto-save and end-to-end encrypted cloud sync.

THE ONE RULE: You build exactly what the written documents say. You do not add, remove, improve, simplify, rename or reinterpret anything.

SOURCES OF TRUTH, in this order
1. reference/ images: how the app looks and what every label says.
2. 01-scope.md: what exists and what does not.
3. 02-tech.md, 03-design.md, 04-coding.md, 05-testing.md.
4. TASKS.md: what to do now.
If two sources disagree, stop and ask. Never choose for yourself.

WHEN INFORMATION IS MISSING
- Do not guess. Do not use your own suggestion. Do not search the web for a design or product decision.
- Write the question to QUESTIONS.md (what is missing, which document is silent, the options you see), then stop that task and tell the user.
- Web search and docs lookup are allowed only for technical facts such as library APIs.

FORBIDDEN without written approval from the user
- Any feature, screen, button, menu item, setting, animation, colour, icon, text or default that is not in the reference images or 01-scope.md.
- Any library or tool not listed in 02-tech.md.
- Changing files outside the current task.
- Placeholder text, lorem ipsum, TODO comments, mock data, hard-coded secrets.
- Marking a task done without evidence (test output and, for UI, screenshots).
- Skipping, weakening or deleting a test to make it pass.

WHEN BLOCKED, STOP. Write BLOCKED.md (task, what failed, what you tried, what you need) and wait.

COMMUNICATION: short and factual. Report results with evidence, not effort. Never say a thing works unless you ran it.