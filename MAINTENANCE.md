# Maintenance

Routine maintenance for a Yarn 4 monorepo built with Turborepo, Biome, changesets, a `smoketest` script and an e2e suite.

**Run it at least once a week.** The goal is that the repository is always secure and up to date. The only exception is the minimum package age configured in `.yarnrc.yml` (`npmMinimalAgeGate`). That delay protects against supply-chain attacks. Never bypass it, and never pin a version younger than the gate. If a fix is only available in a version younger than the gate, use the newest version past the gate and pick up the fix next week.

## Ground rules

- **Run the steps in order.** Each step builds on the previous one.
- **Verify each step:** finish it, verify it, then commit and push it before starting the next one.
  - Verify with these commands (e2e needs Docker):

    ```shell
    yarn lint
    TURBO_FORCE=true yarn smoketest
    yarn test:e2e --force
    ```

  - `yarn lint` applies safe auto-fixes. `smoketest` runs the non-fixing lint check and fails on remaining errors and warnings.
  - `TURBO_FORCE=true` bypasses the Turborepo cache for every turbo task in the chain; `--force` on `smoketest` would only reach its last command. Without it, a step can pass on outputs built before the update.
  - All three must be green before you commit.
- **Rebase before you push.** Rebase on the remote default branch. If anything came in, verify again before pushing.
- **Compare against a baseline when a failure is unclear.** Check out the last pushed commit in a separate `git worktree` and run the same command there. A failure that also happens on the baseline was not caused by the update. Fix it separately or record it as a TODO.
- **If a step breaks:** push everything that was green before it. Then fix the failure or revert the offending update.
  - If you can't fix it within the session, record it as a TODO (see [Open TODOs](#open-todos)).
  - Then continue with the next step.
  - A broken update must never block the updates that work.
- **Pin exact versions.** Dependencies are pinned exactly (no `^`/`~`), except `peerDependencies`. Run `yarn syncpack` (or the repo's equivalent) so versions stay consistent across workspaces.
- **Add changesets for everything that ships.**
  - Every workspace whose **build output or runtime** changes gets a changeset that lists what was updated. This depends on what ships, not on which `package.json` field changed. It includes:
    - its own `dependencies`, `peerDependencies` or `optionalDependencies`;
    - root or `devDependencies` tooling that produces its build output, such as the compiler, the bundler or the type generator;
    - runtime version files, such as `.nvmrc` when it sets the Node version of the images;
    - lockfile-only changes to transitive dependencies it ships with.
  - **Decide build-tool changesets by diffing the output, not by guessing.** After updating a compiler, bundler or type generator, build the baseline worktree from its own `yarn install` and the updated tree, and diff each workspace's build output (e.g. `diff -r <baseline>/packages/x/dist packages/x/dist`). If the baseline reuses the updated `node_modules`, the diff is empty even when the tool changes the output. A workspace whose output differs gets a changeset; one whose output is identical does not.
  - Use **patch** by default. If an update changes a package's public API or types, choose the bump that matches the impact on consumers (minor or major).
  - Changes that only affect tests, linting or documentation need no changeset.
- **Write one commit per step**, with a message naming the step, e.g. `chore(deps): update patch dependencies`.

## Steps

### 1. Patch updates

1. List the outdated dependencies with `yarn upgrade-interactive` or `yarn outdated` (via plugin).
2. Update every dependency that has a newer **patch** version past the age gate.
3. Run `yarn install`, then `yarn syncpack`.
4. Verify, add changesets, then commit and push.

### 2. Minor updates

1. Update every dependency that has a newer **minor** version past the age gate.
2. Read the release notes of anything that is part of a package's public surface: types, peer dependencies, runtime behaviour.
3. Verify, add changesets, then commit and push.

### 3. Major updates that should just work

1. List every dependency with a newer **major** version.
2. Read the changelog or migration guide for every major version between the current and the target version. A jump from v3 to v6 must also cover what broke in v4 and v5. Update the ones where none of the breaking changes affect this repository. Typical cases:
   - dropped Node versions you don't use;
   - removed APIs you don't call.
3. Verify, add changesets, then commit and push.

### 4. Remaining major updates

1. For each major not taken in step 3, work out what the migration requires.
2. Do the ones that are reasonable within a maintenance session: code changes, config migrations, type fixes.
3. Follow the repository's normal development discipline:
   - write tests first for behaviour changes;
   - make no type assertions to silence new type errors.
4. Record the rest under [Open TODOs](#open-todos).
5. Verify, add changesets, then commit and push.

### 5. Resolutions

Resolutions (or overrides) force a version that the dependency tree does not ask for. They go stale, and they can force a version **against** a parent's declared range. So review all of them, not just the ones you know about:

1. In a separate `git worktree`, remove **all** resolutions, run `yarn install` and audit the result (`yarn npm audit --all --recursive`). This shows what the tree resolves to on its own, and which packages are actually vulnerable without the resolutions.
2. For each existing entry, find out why it exists: a security advisory, a broken transitive release, or deduplication. Use `yarn why <package>` and the git history.
3. **Remove the entry** if every parent now resolves to a safe version on its own.
4. **Keep or add an entry** only where a parent would otherwise resolve to a vulnerable or broken version:
   - point it to the newest version past the age gate that the parents are compatible with;
   - scope it to the parent that needs it (`parent/package`) when other parents are already fine.
5. **Exercise the real usage when a resolution forces a new major version** on a parent. The test suite rarely reaches transitive code paths. Call the parent's actual usage of the package, for example in a small Node script, and confirm it works. If the parent breaks and has no fixed version, drop the resolution for that parent and record it as a TODO with the advisory and the exposure (same as step 6.4).
6. In the main tree, apply the result, run `yarn install`, and confirm with `yarn why` and the audit that every resolved version is safe.
7. Verify, add changesets, then commit and push.

### 6. Security alerts

1. List the open Dependabot alerts:
   ```shell
   gh api 'repos/{owner}/{repo}/dependabot/alerts?state=open' --paginate -q '.[] | [.number, .security_advisory.severity, .dependency.package.name, .security_vulnerability.first_patched_version.identifier] | @tsv'
   ```
2. Check the repository's other security tooling as well, e.g. `yarn npm audit --all --recursive`, any security scan in `yarn smoketest`, and code scanning.
3. Fix each alert:
   - **Direct dependency:** upgrade it.
   - **Transitive dependency:** upgrade the parent, or refresh the lockfile (`yarn up -R <package>`) if the parent's range already allows a fixed version. If neither works, add a narrowly scoped resolution (see step 5) and note the advisory ID in the commit message.
4. If no fixed version is available past the age gate, or no fixed version is compatible, record it under [Open TODOs](#open-todos) with its exposure and revisit it next week. Do not dismiss the alert.
5. Verify, add changesets, then commit and push.

### 7. Documentation and review

1. Update the READMEs (root and per-package) wherever the session changed something users or contributors see, for example:
   - new minimum versions;
   - changed peer dependencies;
   - new setup requirements.
2. Review the code touched during the session and propose improvements as a **stretch goal**. Examples:
   - workarounds the updates made obsolete;
   - simpler APIs now offered by a dependency;
   - missing tests around migrated code.

   Propose them; don't apply them unasked.
3. Commit and push the documentation changes.

## Checklist

- [ ] 1. Patch updates — green, pushed
- [ ] 2. Minor updates — green, pushed
- [ ] 3. Safe major updates — green, pushed
- [ ] 4. Remaining majors — done or recorded as TODO, green, pushed
- [ ] 5. Resolutions — removed or updated, real usage exercised, green, pushed
- [ ] 6. Security alerts — fixed or recorded as TODO, green, pushed
- [ ] 7. READMEs updated, improvement proposals written, pushed

## Open TODOs

Open TODOs are repository-specific and live in [MAINTENANCE-TODO.md](./MAINTENANCE-TODO.md), so this procedure stays the same in every repository. Create the file at the first TODO. Each entry gives:

- the package;
- the current and the target version;
- the blocker;
- for security alerts, the advisory and the exposure;
- a link to the upstream issue or changelog if there is one.

Remove an entry when it is resolved.
