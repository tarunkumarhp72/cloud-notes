# Workflow: do-task  (usage: /do-task T-001)

PRECONDITIONS: PREFLIGHT.md says READY and the user wrote Plan approved. Otherwise stop.

STEP 1 READ. Open the task in TASKS.md, its scope line, its reference images and all rule files. Restate the acceptance criteria in your own words. If anything is unclear or missing, write QUESTIONS.md and STOP.

STEP 2 BUILD. Implement only this task. Touch only the files the task lists. Add nothing else, even if it seems useful.

STEP 3 CHECK. Run lint and typecheck. Fix every error.

STEP 4 TEST. Write the tests the task names, then run them. Save the output to qa/evidence/<task-id>/tests.txt.

STEP 5 LOOK (UI tasks). Run the screenshot loop in 03-design.md with the browser MCP: every listed viewport, light and dark, one touch emulation. Save screenshots and analysis.md in qa/screenshots/<task-id>/. Compare each screenshot with the reference image and write down every difference.

STEP 6 VERIFY. Go through the acceptance criteria one by one. For each, write PASS or FAIL with the evidence file that proves it.

STEP 7 REPEAT. If any criterion, test, lint check or screenshot difference fails, fix the cause and go back to Step 3. Keep a counter of attempts for the same failure. After 5 failed attempts on the same failure, write BLOCKED.md and STOP.

STEP 8 REGRESSION. When the task passes, run the full test suite. If an earlier task now fails, fix that first.

STEP 9 CLOSE. Only now: set Status: done in TASKS.md, add links to the evidence, make one commit with a clear message.

STEP 10 CONTINUE. Take the next task whose dependencies are done and repeat from Step 1. At the end of each phase STOP and wait for the user to say Phase approved.

NEVER mark a task done with a failing check, a skipped test, a screenshot difference, or without evidence.