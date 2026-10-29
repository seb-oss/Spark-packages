# Contributing

## Releasing packages

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs. Releases are fully automatic: every push to `main` runs all checks (including e2e), then `release.yml` creates the release PR, merges it and publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) via trusted publishing.

### Existing packages

1. Add a changeset: `yarn changeset`
2. Commit and push to `main` (or merge a PR). The pre-push hook runs `yarn smoketest`.
3. CI versions, merges the release PR and publishes. No manual step.

### Automated updates

- **Dependabot** PRs merge themselves once every check, including e2e, passes. Public packages whose `dependencies`, `peerDependencies` or `optionalDependencies` changed get a patch changeset; devDependency, GitHub Actions and Docker updates merge without a release.
- **ISO packages** (`iso-10383`, `iso-4217`) are regenerated weekly from their published sources by `iso.yml`. Changes are opened as a PR with a minor changeset, checked, merged and released.

### Dependencies

- Exact versions everywhere except `peerDependencies`, which use ranges.
- New npm versions are blocked for 3 days (`npmMinimalAgeGate` in `.yarnrc.yml`, `cooldown` in Dependabot).

### CI

- Actions are pinned by commit SHA (Dependabot keeps them current) and workflows default to a read-only `GITHUB_TOKEN`.
- Pushes, PRs and merges made with `GITHUB_TOKEN` don't trigger workflows, so automation that merges dispatches `release.yml` itself.
- Turbo's cache is kept between runs with `actions/cache`.

### New packages

npm requires a manual first publish to register a scoped package under the `@sebspark` organisation. The automated pipeline cannot do this — it only works for packages that already exist on the registry.

Before merging a PR that adds a new package:

1. Build all packages: `yarn build`
2. Publish manually from the package directory:
   ```bash
   cd packages/<package-name>
   npm publish --access public
   ```
3. Verify it appears at `https://www.npmjs.com/package/<package-name>`
4. Subsequent releases are handled automatically by the pipeline.

The two-step requirement is a security measure enforced by npm to prevent name squatting under org scopes.
