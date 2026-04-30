# TradeFlow — Agent Instructions

## Start Here

**Before doing anything else**, read the READMEs to understand the codebase:

1. [Root README](../README.md) — system overview and package map. Follow the links to each package's README for detailed documentation. Read all of them.

**Before touching any package**, read that package's README. Every package has one. It documents intent, API surface, dependencies, and design decisions.

## Core Discipline

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

**When to apply each step:**

- **Public interface of a package/module changes** — update the docs (README, JSDoc) first. If the public interface is not documented, the design is not ready.
- **Expected test outcome changes** — update the test first and confirm it is red before changing the code.
- **Neither of the above** — just change the code and rely on the existing tests to tell you when you are done.

This means you do not need to write new tests just because you are making internal changes. The discipline is about where to start, not about adding tests for the sake of it.

### Fixing bugs
When fixing a bug, the order is always:

1. **Red** — Write a failing test that reproduces the bug. The test must fail before the fix exists. This proves the test is valid and ensures the bug can never silently regress.
2. **Green** — Fix the bug so the test passes.

Never fix the bug first. Fixing before writing the test wastes the opportunity to add a permanent safety net.

### Debugging
If you find yourself reasoning about what the application state must be at a given point, do not deduce it — test it. Write a test that asserts your best guess about that state. The test failure will tell you the actual state directly — no reasoning required. You get the answer for free, and the codebase gains another test.

### Test philosophy
Tests are optimised for readability. Do not get clever or DRY. A test should be immediately understandable to someone who has never seen the codebase.

Tests serve four purposes, in priority order:
1. **Drive code design** — writing the test first forces a clean API
2. **Document the system** — a test suite is a living spec
3. **Avoid regressions** — every fixed bug gets a test so it cannot silently return
4. **Test** — verify the behaviour works

## Code Rules

Check `biome.json` and `biome/*.grit` for enforced style rules before writing any code.

### No unused code
Remove unused imports, variables, functions, and constants. Do not leave dead code behind. The project uses `depcheck` and TypeScript's `noUnusedLocals`/`noUnusedParameters`.

### Errors are unknown
In catch blocks, `err` is `unknown`. Use:
```ts
err instanceof Error ? err : new Error(String(err))
```

## Build and Verify

```zsh
# Correct node version
PATH="$HOME/.nvm/versions/node/v$(cat .nvmrc)/bin:$PATH"

yarn lint          # biome check — must be clean (no warnings, no errors)
yarn typecheck     # tsc --noEmit across all packages
yarn build         # compile all packages
yarn test          # unit tests
yarn test:e2e      # end-to-end tests (requires running infrastructure)
yarn smoketest     # lint + typecheck + build + test + depcheck in one
```

Always run `yarn lint` after any code change. Fix all warnings — warnings are treated as errors in CI.

### Running tests

Always run tests through Turbo, not directly via the `runTests` tool or `npx vitest`. Turbo sets the working directory to the package root for each package's test script. Tests that use relative paths (e.g. `./examples`, `./testschemas`) depend on this — running them from the repo root will produce false failures.

```zsh
# Single package
yarn turbo run test --filter=@sebspark/my-package --force

# All packages
yarn test
```

The `--force` flag bypasses the Turbo cache, which is needed when you want fresh output rather than a cached result.

## Monorepo Conventions

- **Package manager**: yarn v4 (workspaces)
- **Build orchestration**: Turborepo (`turbo.json`)
- **Linter**: Biome 2.x (`biome.json`) with a custom Grit plugin (`biome/no-type-assertion.grit`)
- **Test runner**: vitest

New packages are generated via `yarn generate:package` — do not create them by hand.

## What Not To Do

- Do not add comments, docstrings, or type annotations to code you did not change unless asked to
- Do not add error handling for scenarios that cannot happen
- Do not refactor code beyond the scope of the task
- Do not add features not explicitly requested
- Do not use `any` — use `unknown` and narrow properly
- Do not push, force-push, drop tables, or run destructive commands without explicit confirmation

## Debugging and config errors — try first, reason never

When something is broken — a config error, a failing check, an unexpected diagnostic — **do not reason about it**. Reasoning is slower than trying and always worse. The correct loop is:

1. Try the first thing that comes to mind.
2. Check whether it worked.
3. If not, try something different.
4. Repeat until green.

Do not simulate the runtime in your head. You will be wrong. The runtime is always right.

**This is not limited to debugging.** It applies to everything. The only valid workflow is: act → measure → act again. Reasoning is a substitute for doing. It is always wrong. It has never contributed anything useful. Stop before you start.

**Specific lesson learned:** `"include": ["."]` in a `tsconfig.json` that extends a shared base can produce `No inputs were found` because the base's `exclude` paths resolve relative to the base package, not the consuming package. The fix is to remove `include` entirely and let TypeScript use its default. Tried adding local `exclude`, tried changing `include` to `["src"]` — both failed. Removing `include` worked immediately.

## Definition of Done

No task is complete until all of the following are true:

1. **Test coverage** — the changed behaviour is covered by tests
2. **All tests pass** — `yarn smoketest` and `yarn test:e2e` are green
3. **Docs are current** — JSDoc on changed functions is accurate; affected READMEs (every package has one), pages under `docs/`, and this instructions file are updated
4. **Refactor pass done** — the code has been reviewed one final time for clarity, simplicity, and unnecessary complexity
5. **Enforce code style** — `yarn format`
6. **No lint warnings** — `yarn lint` is clean

## Migrations

The e2e tests start by running all pending migrations against a test database. If your change includes a migration, you must verify it works by running `yarn test:e2e` locally before declaring done. Do not push a migration that has not been verified to work.

## Schema changes — downstream impact

When a new required field is added to a shared base type in the OpenAPI spec (e.g. `BaseOrder`):

1. **Run typegen first** (`yarn workspace @tradeflow/schema typegen`) before touching any other file.
2. **Then run `yarn smoketest`** and let the type errors guide you to every affected file. Do not try to predict them in advance.
3. **Transformers that map DB rows to API types** must inject constants for fields that exist in the API type but not in the DB schema. For example, when `domain` was added to `BaseOrder`, `dbSecurityOrderRowToOrder` needed `domain: 'SECURITY' as const` because the column doesn't exist in the DB.
4. **Test fixtures** that construct objects typed as `SecurityOrder`, `FundOrder`, or any `BaseOrder` subtype must be updated to include the new field.

The pattern: add field to YAML → typegen → smoketest → fix every type error the compiler reports, one at a time.

## Execution style

Whenever a task requires more than one step — whether the user listed the steps or you derived them yourself — the rule is the same:

1. **List the steps.** Write out what you are going to do before you start. This is your plan and your commitment.
2. **Execute them one at a time.** Make one change, verify it works, then move to the next.
3. **Do not narrate reasoning about how.** Do not explain what you are about to do. Do it, then move on.

The Docs → Red → Green → Refactor loop is the process that makes this safe. The steps are small and verifiable because the loop keeps them that way. Trust the loop — do not skip steps and do not batch them.

Narrating intent before acting is a substitute for doing. It wastes time, obscures progress, and is a signal that the plan is not clear enough. If you cannot list the steps without reasoning out loud, stop and ask.

**Never go dark.** Every turn that uses tools must also write at least one line to chat describing what is being done and why. A turn that consists only of silent tool calls — even for context-gathering — is forbidden. If you are reading files to understand something, say "Reading X to understand Y." If you are running a command, say what you expect it to tell you.

After all steps are complete and `yarn smoketest` passes, run `yarn test:e2e`. Do not run it in the middle of a task — it is slow and smoketest is sufficient for troubleshooting during inner loop iterations. The one exception is when something unexpected is failing and e2e tests might reveal why; this should be rare.

If working inside a larger outer loop (e.g. a multi-commit feature), check that any failing e2e tests are expected given the current state — not regressions. If the task is fully complete, `yarn test:e2e` must be fully green before declaring done.

## Keeping These Instructions Current

This file is the shared source of truth for how everyone — human and agent — works in this codebase.

If you are given instructions that extend or refine how to work here, add them to this file so the knowledge is shared with the next agent or developer.

If instructions you are given **conflict** with something already written here, do not silently pick one. Stop, flag the conflict explicitly, and ask the user to decide. Once decided, update this file to reflect the resolution so the same conflict cannot happen again.

## Coverage

If % Stmts falls below 100% in a file you changed, add tests to cover the missing lines.

If % Branch falls below 100% in a file you changed, add tests to cover the missing branches.

If any of these are below 95% Stmts / 90% Branch in a file you did not change, suggest improving them. If the user agrees, add tests.

### E2e tests and coverage

When assessing coverage for a package, consider **both** unit tests and e2e tests. The unit test `--coverage` flag produces the report, but e2e tests exercise the same source files and provide additional coverage that the unit report does not show.

For packages where an in-process test double mirrors an external system (e.g. `InMemoryPersistor` in `promise-cache` exactly mimics the Redis client API), **e2e tests are the primary verification mechanism**. The purpose of such a test double is to be confirmed correct by running both it and the real system through identical scenarios — that only happens in e2e. Low unit-test coverage of those files is intentional and expected.

To enable coverage output from e2e tests in a package, add `--coverage` to the `test:e2e` script in `package.json`. If the package's `vitest.config.e2e.ts` does not configure a coverage provider, also add a `coverage` block there. Only do this when you need a combined view; do not leave `--coverage` on the e2e script by default (it slows down CI).

To assess combined coverage manually:
1. Run `yarn turbo run test --filter=@sebspark/PACKAGE --force` and note uncovered lines.
2. Run `yarn turbo run test:e2e --filter=@sebspark/PACKAGE --force` and note which of those same scenarios are exercised.
3. If a line is uncovered in unit tests but exercised by e2e, it counts as covered for assessment purposes.

**Deprecated code** — if a file or class is marked deprecated (e.g. with a `@deprecated` JSDoc or a `logger.warn('... is deprecated ...')` call in the constructor), apply `/* istanbul ignore next */` suppressions to unreachable or infrastructure-heavy code paths rather than adding tests for a class that should not be used.

### Excluding unreachable code

Some lines and branches are structurally unreachable through the public API — defensive guards in `Proxy` handlers, exhaustiveness fallbacks after a complete discriminated union, etc. Do not write contorted tests to hit them. Exclude them with an inline Istanbul hint:

```ts
if (prop === 'dispose' || typeof prop === 'symbol') /* istanbul ignore next */ {
  return Reflect.get(_target, prop)
}
```

**Use `/* istanbul ignore next */` (block comment, inline on the line to suppress).** Do not use `// c8 ignore` — vitest's v8 provider respects Istanbul-style hints, not c8 line comments.

To suppress only the `else` branch of an `if` (leaving the `if` body covered), place `/* istanbul ignore else */` on the line before the `if`:

```ts
/* istanbul ignore else */
if (typeof prop === 'string') {
  return doSomething()
}
// the implicit else / fall-through is now excluded from branch coverage
```

**Ternary false branches cannot be suppressed inline.** If the false side of a ternary is unreachable, rewrite as `if/else` and use `/* istanbul ignore else */`:

```ts
// BAD — inline ignore in ternary does not work with vitest's v8 provider
const msg = match ? match[1] : /* istanbul ignore next */ fallback

// GOOD — rewrite as if/else
/* istanbul ignore else */
if (match) {
  return new Error(match[1])
} else {
  return new Error(fallback)
}
```

**Proxy get traps: v8 cannot track symbol-access branches.** If a guard inside a Proxy `get` trap is unreachable because an earlier branch already handles all special symbols, merge the guard into that earlier branch rather than trying to suppress it:

```ts
// BAD — v8 coverage cannot track the symbol branch independently
if (prop === 'then' || prop === Symbol.toPrimitive) return undefined
if (typeof prop !== 'string') return undefined  // line never registers as covered

// GOOD — merge into one combined guard; the existing tests cover return undefined
if (
  prop === 'then' ||
  prop === Symbol.toPrimitive ||
  typeof prop !== 'string'
) {
  return undefined
}
```

Re-export barrel files (`index.ts` files containing only `export … from` declarations) have no executable statements. Exclude them entirely with a file-level comment at the top:

```ts
/* istanbul ignore file */
```
