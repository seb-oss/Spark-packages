# Maintenance

Routine maintenance for a Yarn 4 monorepo built with Turborepo, Biome, changesets, a `smoketest` script and an e2e suite.

**Run it at least once a week.** The goal is that the repository is always secure and up to date. The only exception is the minimum package age configured in `.yarnrc.yml` (`npmMinimalAgeGate`). That delay protects against supply-chain attacks. Never bypass it, and never pin a version younger than the gate.

## Ground rules

- **Run the steps in order.** Each step builds on the previous one.
- **Verify each step:** finish it, verify it, then commit and push it before starting the next one.
  - Verify with `yarn smoketest` and `yarn test:e2e`, which needs Docker.
  - Both must be green before you commit.
- **If a step breaks:** push everything that was green before it. Then fix the failure or revert the offending update.
  - If you can't fix it within the session, record it as a TODO (see [Open TODOs](#open-todos)).
  - Then continue with the next step.
  - A broken update must never block the updates that work.
- **Pin exact versions.** Dependencies are pinned exactly (no `^`/`~`), except `peerDependencies`. Run `yarn syncpack` (or the repo's equivalent) so versions stay consistent across workspaces.
- **Add changesets for published packages.**
  - Every package whose `dependencies`, `peerDependencies` or `optionalDependencies` changed gets a **patch** changeset that lists the updated dependencies.
  - Changes to `devDependencies` alone need no changeset.
  - If an update changes a package's public API or types, choose the bump that matches the impact on consumers (minor or major), not patch.
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
2. Read each changelog or migration guide. Update the ones where none of the breaking changes affect this repository. Typical cases:
   - dropped Node versions you don't use;
   - removed APIs you don't call.
3. Verify, add changesets, then commit and push.

### 4. Remaining major updates

1. For each major not taken in step 3, work out what the migration requires.
2. Do the ones that are reasonable within a maintenance session: code changes, config migrations, type fixes.
3. Follow the repository's normal development discipline:
   - write tests first for behaviour changes;
   - make no type assertions to silence new type errors.
4. Record the rest under [Open TODOs](#open-todos). For each entry, give:
   - the package;
   - the current and the target version;
   - what blocks the update;
   - a link to the upstream issue or changelog if there is one.
5. Verify, add changesets, then commit and push.

### 5. Resolutions

Go through every entry in the root `package.json` `resolutions` (or the equivalent override field):

1. Find out why the entry exists: a security advisory, a broken transitive release, or deduplication. Use `yarn why <package>` and the git history.
2. **Remove the entry** if every parent now allows a fixed version on its own. Delete it, run `yarn install`, and confirm with `yarn why` that the resolved version is still safe.
3. **Update the entry** if it is still needed. Point it to the newest version past the age gate that the parents are compatible with.
4. Verify, then commit and push. Add changesets only if a published package's runtime dependency tree changed in a way consumers should know about.

### 6. Security alerts

1. List the open Dependabot alerts:
   ```shell
   gh api repos/{owner}/{repo}/dependabot/alerts --paginate -q '.[] | select(.state=="open") | [.number, .security_advisory.severity, .dependency.package.name, .security_vulnerability.first_patched_version.identifier] | @tsv'
   ```
2. Check the repository's other security tooling as well, e.g. the `security-scan` step in `yarn smoketest`, `yarn npm audit`, and code scanning.
3. Fix each alert:
   - **Direct dependency:** upgrade it.
   - **Transitive dependency:** upgrade the parent. If no fixed parent exists, add a narrowly scoped resolution and note the advisory ID in the commit message.
4. If a fix is not yet available past the age gate, record it under [Open TODOs](#open-todos) and revisit it next week.
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
- [ ] 5. Resolutions — removed or updated, green, pushed
- [ ] 6. Security alerts — fixed or recorded as TODO, green, pushed
- [ ] 7. READMEs updated, improvement proposals written

## Open TODOs

Major updates and security fixes that could not be completed. Each entry gives:

- the package;
- the current and the target version;
- the blocker;
- a link to the upstream issue or changelog if there is one.

Remove an entry when it is resolved.

_None yet._
