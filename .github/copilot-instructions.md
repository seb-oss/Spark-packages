# Agent Instructions

## Start Here

**Before touching any package**, read that package's README. Every package has one. It documents intent, API surface, dependencies, and design decisions.

If the repo has top-level documentation (root README, `docs/`), read it first to understand the system before diving into a package.

## Quick Reference

The rules below are expanded in the sections that follow. If you remember nothing else, remember these:

- **Test, don't deduce** — if you're reasoning about a runtime value, write a test asserting your guess and run it
- **One step at a time** — fix one thing, verify, move on
- **Stop and ask when unsure** — wrong assumptions compound
- **Never go dark** — one line of chat before every tool batch
- **Don't narrate *how*** — say *what* you're doing, then do it
- **Docs → Red → Green → Refactor** for new behaviour
- **Package scope first** — run package checks while iterating, repo checks only when the package change is done

## Execution Style

Before every batch of tool calls, write one line naming *what* you're doing ("Reading X", "Running lint", "Writing the failing test"). The line is a checkpoint, not a plan. Do not explain *how* you will do it before doing it — that is narration, and narration is a substitute for action.

A tool batch with no preceding chat line is a bug. If you notice you've done it, stop and write the line retroactively before continuing.

When a task requires more than one step:

1. **List the steps** before you start. This is your plan and your commitment.
2. **Execute them one at a time.** One change, verify, next.
3. **Do not narrate reasoning about how.** Do it, then move on.

If you cannot list the steps without reasoning out loud, the plan is not clear enough — stop and ask.

**Context-gathering is bounded.** Decide what you need, list it, read only those files. Do not discover new files to read while reading. If after two rounds of reads you cannot start acting, you are over-exploring — stop and explain what you found and what you still need, or ask.

**After gathering context, summarise before acting.** One or two sentences naming what you found that's relevant to the task. This is the checkpoint that confirms you understood before you start changing things.

## Core Discipline

### Test, don't deduce
If you find yourself reasoning about what a value, state, or type must be at runtime — stop. Write a test or assertion with your best guess and run it. The failure tells you the answer directly. You get the answer for free, and the codebase gains a test.

Tripwire: if you have written more than one sentence reasoning about what something *probably* is or *might* do, that is the signal to stop and either test or ask. Reasoning about runtime values in chat is forbidden when a test can answer in one command.

### One step at a time
Do not batch-fix multiple files or issues in one move. Fix one thing, verify it works, then move on. This applies to lint fixes, type errors, and refactors.

### Stop and ask when unsure
If the correct approach is unclear — about intent, architecture, or scope — stop and ask. Do not forge ahead with a guess. Wrong assumptions compound.

### Docs → Red → Green → Refactor
This is the development loop for building anything new:

1. **Docs** — Write the documentation first. For a library or package, this is the README. For a module or function, this is the JSDoc. If you cannot explain simply how to use the thing you are about to build, the design is not ready. This step forces clarity of intent before a single line of implementation exists.

2. **Red** — Write a failing test that expresses the first small piece of behaviour you are implementing. The test must fail because the code does not exist yet. A failing test is proof that the test itself is valid.

3. **Green** — Make the test pass in the simplest possible way. If the function is expected to return `true`, just return `true`. Do not add logic that is not yet covered by a test. The goal is a minimal, working implementation of exactly what you have expressed so far — nothing more.

4. **Refactor** — Now rewrite the working code into clean, terse, readable, and maintainable form. This step is safe because steps 2 and 3 give you a verified test harness. Refactoring is never step 1.

**The default is the full loop.** Skip steps only when both of these are true:
- The public interface is unchanged
- Existing tests already cover the behaviour you're modifying

If either is false, the full loop applies. The discipline is about where to start — it is not an excuse to skip tests.

### Fixing bugs
The order is always:

1. **Red** — Write a failing test that reproduces the bug. The test must fail before the fix exists. This proves the test is valid and ensures the bug can never silently regress.
2. **Green** — Fix the bug so the test passes.

Never fix the bug first. Fixing before writing the test wastes the opportunity to add a permanent safety net.

### Test philosophy
Tests are optimised for readability. Do not get clever or DRY. A test should be immediately understandable to someone who has never seen the codebase.

Tests serve four purposes, in priority order:
1. **Drive code design** — writing the test first forces a clean API
2. **Document the system** — a test suite is a living spec
3. **Avoid regressions** — every fixed bug gets a test so it cannot silently return
4. **Test** — verify the behaviour works

## What Not To Do

- Do not add comments, docstrings, or type annotations to code you did not change unless asked to
- Do not add error handling for scenarios that cannot happen
- Do not refactor code beyond the scope of the task
- Do not add features not explicitly requested
- Do not use `any` — use `unknown` and narrow properly
- Do not push, force-push, drop tables, or run destructive commands without explicit confirmation

## Build and Verify — Package Scope First

Work on one package at a time. While iterating on a package, run only that package's checks — they are fast and tell you what you need to know. Run the full repo's checks only once the package's change is done.

**Inner loop (while changing a package):** run that package's lint, typecheck, unit tests, and e2e tests, in whichever combination the package has. Some packages have unit tests, some have e2e tests, some have both — the rule applies universally: run what the package has, and run only that package, until the change is done.

**Outer loop (once the package is done):** run the full repo's checks before declaring the task complete.

If a check doesn't exist for a package (e.g. no e2e tests), skip it — but verify by reading the package's `package.json` or README, not by assumption.

Always run lint after any code change. Fix all warnings — warnings are typically treated as errors in CI.

## Definition of Done

No task is complete until all of the following are true:

1. **Test coverage** — the changed behaviour is covered by tests
2. **Package checks pass** — lint, typecheck, unit tests, and e2e tests for the changed package(s) are all green
3. **Repo checks pass** — the full repo's checks are green
4. **Docs are current** — JSDoc on changed functions is accurate; affected READMEs (every package has one) and any top-level docs are updated; this instructions file is updated if the way of working has changed
5. **Refactor pass done** — the code has been reviewed one final time for clarity, simplicity, and unnecessary complexity
6. **Code style enforced** — formatter has been run
7. **No lint warnings** — lint is clean

## Keeping These Instructions Current

This file is the shared source of truth for how everyone — human and agent — works in this codebase.

If you are given instructions that extend or refine how to work here, add them to this file so the knowledge is shared with the next agent or developer.

If instructions you are given **conflict** with something already written here, do not silently pick one. Stop, flag the conflict explicitly, and ask the user to decide. Once decided, update this file to reflect the resolution so the same conflict cannot happen again.
