# Workflow: preflight

ROLE: You are running a preflight check. You build nothing in this run.

GOAL: Prove, by actually calling each capability, that every skill, tool and MCP server this project needs is connected and working. Do not assume. Do not infer from a tool list.

RULES FOR THIS RUN
1. Create or change no project file except PREFLIGHT.md and the temporary files named below.
2. Install, replace or substitute nothing. If something is missing, report it.
3. If any check fails, do not continue to a later step and do not start /plan.
4. Never use your own suggestion in place of a missing item.
5. All checks are REQUIRED. A check is skipped only if the user wrote it on this line: N/A CHECKS: (none)

CHECKS. For each one perform the action, record PASS or FAIL, and paste the real output or error as evidence.
C1  Rules loaded: list every active rule. Expected: global rules, 01-scope, 02-tech, 03-design, 04-coding, 05-testing.
C2  Workflows loaded: list them. Expected: preflight, plan, do-task.
C3  Reference images: list the files in reference/. Expected: at least one image. Open one and describe it in one sentence.
C4  File tools: create tmp/preflight.txt containing ok, read it back, delete it.
C5  Terminal: run node -v, pnpm -v and git --version.
C6  Browser: open a page, take a screenshot, save it as qa/preflight/browser.png.
C7  Viewport control: capture screenshots at 360x640, 768x1024 and 1440x900. Confirm each image has the requested width.
C8  Browser automation MCP (Playwright or Chrome DevTools): navigate, click, type into a field, read console messages, take a screenshot.
C9  Docs MCP: fetch current documentation for TipTap, CodeMirror 6, Hono and Tauri 2 and report the version found for each.
C10 Database MCP (Supabase): list tables on the DEV project only. Never touch a production project.
C11 Web search: run one search and return a title and URL.
C12 Git: run git status. Confirm a repository exists.
C13 Skills: list installed skills. Expected: ui-parity-check, viewport-sweep, task-evidence.

OUTPUT: write PREFLIGHT.md with a table (check, status, evidence), then one final line: READY or BLOCKED.
If BLOCKED: list every failed check and the exact fix you need from the user, then STOP.
If READY: say READY and wait. Do not start any other work.