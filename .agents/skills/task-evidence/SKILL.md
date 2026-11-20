---
name: task-evidence
description: Systematic collection, structuring, and archival of linting, type-checking, unit/e2e testing, and build verification outputs under qa/evidence/<task-id>/, linked directly from TASKS.md.
---

# Task Evidence Skill

This skill defines the mandatory protocol for collecting, structuring, and preserving verifiable proof of task completion. Under project rules (`05-testing.md`), no task can be marked complete without passing, authentic evidence.

## Core Principle
- **Zero Hallucination / Zero Assumption:** Evidence must consist of raw, unaltered tool outputs, test runner logs, compiler output, and timestamped exit codes.
- **Permanent Record:** Store evidence in `qa/evidence/<task-id>/`.
- **Traceability:** Every completed item in `TASKS.md` must link directly to its corresponding evidence file.

## Required Evidence Artifacts per Task
Depending on the scope of the task (backend, frontend, shared core, or config), collect:

1. **Linting & Formatting (`lint.log`)**
   - Command: `pnpm lint` or `pnpm eslint .`
   - Requirement: 0 errors, 0 warnings.
2. **Type Checking (`typecheck.log`)**
   - Command: `pnpm typecheck` or `pnpm tsc --noEmit`
   - Requirement: 0 type errors across all packages.
3. **Unit & Integration Tests (`unit-tests.log`)**
   - Command: `pnpm test` or `pnpm vitest run`
   - Requirement: 100% test pass rate; core package >= 90% coverage where applicable.
4. **End-to-End Tests (`e2e-tests.log`)**
   - Command: `pnpm test:e2e` or Playwright test runner.
   - Requirement: All specified user flows pass cleanly.
5. **Production Build (`build.log`)**
   - Command: `pnpm build`
   - Requirement: Clean build output; JS bundle within the 150 KB gzip budget specified in `02-tech.md`.
6. **Console Cleanliness (`console.log`)**
   - Zero unhandled exceptions or CSP errors.

## Workflow

1. **Initialize Task Evidence Directory**
   ```powershell
   New-Item -Path "qa/evidence/<task-id>" -ItemType Directory -Force
   ```

2. **Execute and Capture Commands**
   Run all verification steps and capture both standard output and exit codes:
   ```powershell
   pnpm lint | Tee-Object -FilePath "qa/evidence/<task-id>/lint.log"
   pnpm typecheck | Tee-Object -FilePath "qa/evidence/<task-id>/typecheck.log"
   pnpm test | Tee-Object -FilePath "qa/evidence/<task-id>/unit-tests.log"
   pnpm build | Tee-Object -FilePath "qa/evidence/<task-id>/build.log"
   ```

3. **Generate Task Summary (`summary.md`)**
   Write `qa/evidence/<task-id>/summary.md`:
   ```markdown
   # Task Verification Evidence: <task-id>

   **Date:** <ISO-8601 timestamp>
   **Status:** VERIFIED PASS

   ## Verification Results
   | Check | Command | Exit Code | Result | Evidence File |
   |-------|---------|-----------|--------|---------------|
   | Lint | `pnpm lint` | 0 | PASS | [lint.log](./lint.log) |
   | Typecheck | `pnpm typecheck` | 0 | PASS | [typecheck.log](./typecheck.log) |
   | Unit Tests | `pnpm test` | 0 | PASS | [unit-tests.log](./unit-tests.log) |
   | Build | `pnpm build` | 0 | PASS | [build.log](./build.log) |

   ## Performance Budget Verification
   - First load JS bundle: XX KB gzip (Budget: <= 150 KB) -> PASS
   ```

4. **Update `TASKS.md`**
   Add link to evidence in `TASKS.md`:
   ```markdown
   - [x] Task <task-id>: Description [Evidence](qa/evidence/<task-id>/summary.md)
   ```
