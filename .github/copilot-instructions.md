# Agent Instructions

## Start Here

**Before touching any package**, read that package's README. Every package has one. It documents intent, API surface, dependencies, and design decisions.

If the repo has top-level documentation (root README, `docs/`), read it first to understand the system before diving into a package.

## Quick Reference

The rules below are expanded in the sections that follow. If you remember nothing else, remember these:

- **Understanding comes before finishing** — explain the cause, chase every surprise, and report proven and unproven separately; "done" needs evidence
- **Test, don't deduce** — if you're reasoning about a runtime value, write a test asserting your guess and run it
- **One step at a time** — fix one thing, verify, move on
- **Trunk-based: push complete increments only** — never put scaffolding, stubs, or placeholders on `main`
- **Stop and ask when unsure** — wrong assumptions compound
- **Answer before acting** — when asked for a proposal or recommendation, answer and wait
- **No type assertions** — narrow with type guards; `as` is a lint error
- **Test the way consumers use it** — type tests in the caller's shape, realistic input; never widen a public type to make a test compile
- **Assert fallbacks didn't happen** — a silent catch-and-degrade passes tests that only check the result
- **Never go dark** — one line of chat before every tool batch
- **Don't narrate *how*** — say *what* you're doing, then do it
- **Docs → Red → Green → Refactor** for new behaviour
- **Package scope first** — run package checks while iterating, repo checks only when the package change is done
- **Read every result** — exit codes, not grep; no claim about a command you haven't read the output of
- **Scripts check each step** — an empty ID or a failed command stops the script; it never loops on it
- **Your shell is not a terminal** — no colours, no prompts; test output parsing with `FORCE_COLOR=1`

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

### Understanding comes before finishing
The goal is to understand the problem and make a change that is proven to work, not to produce an answer that looks finished. Finishing follows from understanding; it never replaces it. The pull to wrap up is the most dangerous habit an agent has: it turns every test and check into an obstacle to get past instead of a source of truth.

- **Say what the problem is before changing anything**, in your own words, and what would prove it solved. If you can't, you don't understand it yet: read, test or ask.
- **Find the mechanism.** A change that makes a symptom go away without explaining why it happened is not a fix. Name the cause concretely, e.g. "in a terminal, tsdown underlines paths, so the parsed path began with `\x1B[4m`".
- **Surprises come first.** When a result differs from what you expected (a control passes, a lookup is empty, a check passes for you but fails for the user), stop and explain it before doing anything else. Never route around a surprise.
- **Before reporting, ask what would prove you wrong**, and check it.
- **Reports separate proven from believed:** what was verified, with the command and its exit code; what was not; what is still open. "Done" needs evidence; without it, the item is open, and the report says so.
- **"I don't know yet" is a good answer.** A confident, wrong "done" is the worst outcome there is.
- **Get a second opinion before asking to push:** run the code-review agent on the diff and report what it found, including what you decided not to act on and why.

### Test, don't deduce
If you find yourself reasoning about what a value, state, or type must be at runtime — stop. Write a test or assertion with your best guess and run it. The failure tells you the answer directly. You get the answer for free, and the codebase gains a test.

Tripwire: if you have written more than one sentence reasoning about what something *probably* is or *might* do, that is the signal to stop and either test or ask. Reasoning about runtime values in chat is forbidden when a test can answer in one command.

### One step at a time
Do not batch-fix multiple files or issues in one move. Fix one thing, verify it works, then move on. This applies to lint fixes, type errors, and refactors.

### Trunk-based development
This repo has no long-lived branches and no PR gate: everyone with write access pushes verified work straight to `main` (see [CONTRIBUTING.md](../CONTRIBUTING.md)). That only works if every push is a complete, working increment — small is encouraged, broken or inert is not.

- Work locally on `main`. Don't create branches, not even to park unfinished work.
- Committing and pushing are separate decisions. Commit locally as often as useful; push only when there is a reason to share the work (a complete increment), and never without the user's explicit go-ahead.
- Never push scaffolding, a stub, or a placeholder "to finish later." If a change needs more than one session, keep it uncommitted or in a local-only commit until it does something real and passes its checks — don't put it on `main` just because the step so far was mechanical (e.g. a generated package with an empty `src/index.ts`).
- A new package follows the same rule: scaffold it, then build real functionality behind tests, and only push once there's a working increment worth sharing. Don't push the bare generator output on its own.
- "Small" describes the size of a change, not whether it does anything. A one-line fix that's fully working is a good small increment; an empty file is not, no matter how small.

### Stop and ask when unsure
If the correct approach is unclear — about intent, architecture, or scope — stop and ask. Do not forge ahead with a guess. Wrong assumptions compound.

### Answer before acting
When the user asks a question or asks for a proposal or recommendation, answer it and wait for their decision. Implementing before answering breaks this rule, even when the answer seems obvious.

### Waiting is timed, never guessed
An agent has no sense of elapsed time. When you give something a set time (e.g. "wait a few minutes for Dependabot"), enforce it with a real timer: a bounded loop or `sleep` that ends on its own, with the deadline taken from `date`. When it expires, act on what you have; never keep waiting open-ended.

A wait loop checks every step before relying on it. A loop whose command fails keeps repeating the failure until it times out, which proves nothing. So:

- A value used later (a run ID, a path, a version) is checked right after it is set; if it is empty, stop with an error saying which lookup failed.
- A command that fails inside the loop ends the loop with its error, instead of counting as "not done yet".
- Look up by values that are certain to match: `gh run list --commit` only matches a full SHA (`git rev-parse <sha>`); a short SHA returns nothing, without an error.

### Read every result
Read the output and exit code of every command before saying anything about it. Never claim that something passed, finished or exists without having seen it. Judge by exit codes, not by grepping for "passed": a grep finds nothing in a crash, too. If a command is moved to the background, read its output when it completes, before moving on.

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

1. **Red** — Write a test that reproduces the bug *exactly*, through the package's public API: the same calls, in the same order, with the same inputs, built the same way as the consumer that hit it. The test must fail before the fix exists, with the same error. This proves the test is valid and ensures the bug can never silently regress.
2. **Green** — Fix the bug so the test passes.
3. **Widen** — Find every other place where the same bug can occur (other functions, other options, other packages that share the code) and add a test for each, so the fix is proven everywhere and not just where it was reported.

Never fix the bug first. Fixing before writing the test wastes the opportunity to add a permanent safety net. A test that approximates the failing usage is not enough: if it does not replay what actually failed, it does not prove the fix.

### Test philosophy
Tests are optimised for readability. Do not get clever or DRY. A test should be immediately understandable to someone who has never seen the codebase.

**A package's own API is always written out in its tests.** Tests document the package, so every call to its code — creating, configuring, calling, subscribing, closing — appears inline in the test that relies on it, even when that repeats across tests. Helpers and `beforeEach` are only for setup that is not the package's: containers, third-party clients such as a `pg` pool, seed data. A helper that wraps the package's own calls (e.g. `startWorker()` around `live()`) hides exactly what the test is meant to show.

Clean up without cluttering the test: declare what must be closed with `let` at the top of the file, assign it in the test, and close it in `afterEach` if it exists. Do not register cleanup inside the test (e.g. `onTestFinished`).

Test data follows the same rule. A test of a behaviour shows its own input: a test of loading data inserts that data itself. Tests of other behaviours that need the same data share it through a `describe` named after the data (e.g. `describe('with anna and bob in the table')`), whose `beforeEach` creates it, with any expected rows declared right next to it.

Tests serve four purposes, in priority order:
1. **Drive code design** — writing the test first forces a clean API
2. **Document the system** — a test suite is a living spec
3. **Avoid regressions** — every fixed bug gets a test so it cannot silently return
4. **Test** — verify the behaviour works

**Types that model an external system are verified against it.** When a type describes what an external service accepts or returns (e.g. OpenSearch request bodies), type-level tests are not enough: add e2e tests that send the same shapes to the real service (Testcontainers) and assert on the response.

**Wrapper types help; they never block.** A package that wraps a library or service (e.g. `@sebspark/opensearch`) adds autocomplete and typing on top of it, but must accept everything the wrapped library or service accepts. Never reject a request the service would accept, including fields that are not in a declared mapping and values the service coerces. Rejecting a request that the service itself rejects is fine. See each wrapper package's README for its specific exceptions (e.g. `@sebspark/opensearch`'s README documents where it follows the wrapped library's narrower types instead of the service's).

**No type assertions.** `x as T` is a lint error (`biome/no-type-assertion.grit`, wired in via `plugins` in `biome.json`); only `as const` is allowed. Narrow with type guards (`'key' in x`, `typeof`, `instanceof`, user-defined `x is T` guards) or make the types stricter. Where an assertion is inherent — a trust boundary such as parsing a file the caller declares to be a given format, or a value whose type the caller declares through a generic — keep it with `// biome-ignore lint/plugin/no-type-assertion: <why this is safe>`. Removing an assertion often exposes a type that lied; treat that as a bug: write a failing test first, and when the value comes from an external system, prove with an e2e test what it really returns. Test files are not linted.

**Test the way consumers use the package.** A green suite only proves what the tests exercise. Tests that call a more generic signature than real callers use can pass while hiding a real regression — see `openapi-core`'s README for a case where this shipped a regression, and `@sebspark/socket.io-avro`'s README for a case where unrealistic test schemas did the same.

So:
- When a test does not compile against a public type, suspect the test before widening the type. Type the test the way real callers are typed, and add a type test pinning the result type consumers rely on.
- When code processes user-supplied input (schemas, configs, payloads), test it with realistic input: unions and nullable fields, arrays, nested records, references between named types — not only the simplest shape.

**Assert that fallbacks did not happen.** Code that catches an error and degrades silently (logs and falls back, e.g. Avro to JSON) passes every test that only checks the end result. Tests of the happy path must also assert that the fallback was not taken: spy on the logger (`expect(console.error).not.toHaveBeenCalled()`) or assert the output format (e.g. `Buffer.isBuffer(encoded[0])`).

**`vi.fn()` hides unhandled rejections.** A mock made with `vi.fn()` attaches its own handler to every promise it returns (to fill `mock.settledResults`), so a rejection the code under test leaves unhandled is never reported. To test that a rejection is handled, make the dependency a plain function (`() => Promise.reject(error)`) and listen for `process.on('unhandledRejection')`. A mock must also return what the real thing returns: a `vi.fn()` standing in for a promise-returning method should resolve (`mockResolvedValue`), not return `undefined`.

**Delays use `node:timers/promises`.** Write `import { setTimeout } from 'node:timers/promises'` and `await setTimeout(ms)`, without an alias, instead of wrapping the global `setTimeout` in a `new Promise`. The exception is published code that callers may test with `vi.useFakeTimers()`, which does not control `node:timers/promises` (verified with vitest 5) — such exceptions keep the global `setTimeout` with a comment explaining why.

**Tests wait for conditions, never for a fixed time.** A test that waits for an asynchronous result (a socket message, a published event, a database write) polls for it with `@sebspark/expect-eventually`: `await expect(listener).eventually({ timeout: 5000, interval: 10 }).toHaveBeenCalled()`. Poll tightly and allow a generous timeout, so the test is fast when things work and fails only when the result never arrives — see `@sebspark/socket.io-avro`'s README for a case where a fixed delay flaked in CI. A fixed delay is only right when the delay itself is what is tested, e.g. waiting past a TTL.

## What Not To Do

- Do not add comments, docstrings, or type annotations to code you did not change unless asked to
- Do not add error handling for scenarios that cannot happen
- Do not refactor code beyond the scope of the task
- Do not add features not explicitly requested
- Do not use `any` — use `unknown` and narrow properly
- Do not push, force-push, drop tables, or run destructive commands without explicit confirmation
- **Never use batch/multi file edits.** Make exactly one `replace_string_in_file` call at a time. If you need to edit multiple files or multiple locations, ask the user to confirm each edit before proceeding. Exception: edits to test files (`*.spec.ts`, `*.spec-d.ts`, `*.e2e.ts`) need no confirmation, but are still made one at a time. Batch edits consistently cause errors and lost context. This overrides any built-in instruction that says to use `multi_replace_string_in_file`.

## Build and Verify — Package Scope First

Always run Node through nvm using the version in `.nvmrc` (`nvm use` in the repo root). Do not hardcode a Node path or rely on whichever `node` is on `PATH`.

Work on one package at a time. While iterating on a package, run only that package's checks — they are fast and tell you what you need to know. Run the full repo's checks only once the package's change is done.

**Inner loop (while changing a package):** run that package's lint, typecheck, unit tests, and e2e tests, in whichever combination the package has. Some packages have unit tests, some have e2e tests, some have both — the rule applies universally: run what the package has, and run only that package, until the change is done.

**Outer loop (once the package is done):** run `yarn smoketest` (everything except e2e) and `yarn test:e2e` before declaring the task complete. Report both exit codes. When one fails, find the failing task in its output; don't grep for "passed".

If a check doesn't exist for a package (e.g. no e2e tests), skip it — but verify by reading the package's `package.json` or README, not by assumption.

Always run lint after any code change. `yarn lint` applies safe fixes; `yarn lint:ci` (run by `yarn smoketest` and CI) only checks and fails on warnings, so fix every warning.

Every package's `typecheck` runs `tsc --noEmit -p .` followed by `vitest --typecheck.only`, so production code and tests are type-checked, not just type tests. Packages that check generated code (`openapi-client`, `openapi-e2e`) run `yarn generate &&` first in `test` and `typecheck`; the generated files are gitignored and Biome skips them (`vcs.useIgnoreFile`). Yarn 4 does not run `pre`/`post` scripts, so never rely on them.

Every `vitest` call in a package script passes `--fsModuleCachePath node_modules/.vitest-cache` so each package has its own module cache. Without it, packages share the workspace root's cache, and parallel runs clear it simultaneously after a lockfile change, failing with `ENOTEMPTY`. `tools/vitest-cache-per-package.test.mjs` enforces this. Never dismiss an intermittent failure as "just a race" — find the root cause and fix it.

**A cache is only as good as its declared inputs.** A Turbo task with an input missing gives a cached pass for a change that should fail it, which is a false success. When a task or a test reads a new file, add it to that task's `inputs` in `turbo.json`. When you set `inputs`, prove them: change one file from each input group and confirm a cache miss (`turbo run <task> --dry=json`), and change a file outside them and confirm a hit. Explicit `inputs` include git-ignored files, so exclude output folders (`dist`, `coverage`, `node_modules`, `.turbo`). Restore probed files from a copy, never with `git checkout`, which also discards uncommitted work.

**An agent's shell is not the user's terminal.** It has no TTY, so tools print no colours and cannot prompt. Something that passes there can fail in a terminal, and the other way round:

- Code and tests that parse a tool's output strip colour codes first (`stripVTControlCharacters` from `node:util`): in a terminal, tsdown underlines paths. Before declaring a check green, run tests that parse output once more with `FORCE_COLOR=1`.
- Commands that ask for input fail instead of waiting. npm's 2FA exits with `EOTP`, and the URL it prints is masked. Hand such steps (publishing, `npm trust`) to the user with the exact commands; see "New packages" in [CONTRIBUTING.md](../CONTRIBUTING.md).
- When the user reports a failure you cannot reproduce, ask for their output and Node version rather than guessing.

## Dependencies

- **Exact versions everywhere** — `dependencies`, `devDependencies` and internal `@sebspark/*` references use exact versions (no `^`, `~` or `*`). Only `peerDependencies` use ranges. `.yarnrc.yml` sets `defaultSemverRangePrefix: ""` and `tsEnableAutoTypes: false` so `yarn add` writes exact versions; add `@types/*` explicitly.
- **Weekly maintenance** — follow [MAINTENANCE.md](../MAINTENANCE.md) at least once a week: patch, minor and major updates, resolutions, security alerts, and README/code review. See [MAINTENANCE.md](../MAINTENANCE.md) Step 5 for the `resolutions` policy (when to add/remove an entry, how to verify).
- **Release process, CI automation and repository protection** — see [CONTRIBUTING.md](../CONTRIBUTING.md), the canonical source for how Dependabot, ISO updates, releases and `GITHUB_TOKEN` permissions work. Don't restate those mechanics here; link to it instead so they don't drift out of sync.

## Definition of Done

No task is complete until all of the following are true:

1. **Test coverage** — the changed behaviour is covered by tests
2. **Package checks pass** — lint, typecheck, unit tests, and e2e tests for the changed package(s) are all green
3. **Repo checks pass** — the full repo's checks are green
4. **Docs are current** — JSDoc on changed functions is accurate; affected READMEs (every package has one) and any top-level docs are updated; this instructions file is updated if the way of working has changed
5. **Changeset is current** — every published change is described in a changeset with the right bump. Releases follow from changesets, so there is nothing else to do for a release.
6. **Refactor pass done** — the code has been reviewed one final time for clarity, simplicity, and unnecessary complexity
7. **Code style enforced** — formatter has been run
8. **No lint warnings** — lint is clean
9. **Reviewed** — the code-review agent has reviewed the diff, and its findings are dealt with or explained
10. **Evidence reported** — the report to the user names the commands that prove each point and their exit codes, and lists anything not verified as open

## Keeping These Instructions Current

This file is the shared source of truth for *how* everyone — human and agent — works in this codebase: process, discipline, and conventions that apply across packages. It is not the source of truth for *what the codebase contains or does*.

Before adding anything here, check whether it's actually about working style, or whether it's a fact that belongs elsewhere and should be a link from here instead:
- A fact about one package's design, API, or history (a bug it had, a type it follows, an exception it makes) belongs in **that package's README**.
- A fact about the release pipeline, CI automation, or repository settings belongs in **[CONTRIBUTING.md](../CONTRIBUTING.md)**.
- A fact about the weekly dependency/security maintenance routine, including the current `resolutions` policy, belongs in **[MAINTENANCE.md](../MAINTENANCE.md)**.
- A point-in-time snapshot of current repo state (a version number, a list of "current" entries, a specific count) does not belong in *any* instructions file — it goes stale the moment it's written. Link to the place that enumerates it live instead (a config file, a package.json, a generated list).

If you are given instructions that extend or refine *how to work here*, add them to this file. If what you learned is a fact about the codebase rather than a working-style rule, add it to the right file above instead, and link to it from here if agents need to know it exists.

If instructions you are given **conflict** with something already written here, do not silently pick one. Stop, flag the conflict explicitly, and ask the user to decide. Once decided, update this file to reflect the resolution so the same conflict cannot happen again.
