# Contributing

## Releasing packages

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs. The CI pipeline handles publishing automatically when a release PR is merged.

### Existing packages

1. Add a changeset: `yarn changeset`
2. Commit and open a PR. The changesets bot will open a release PR.
3. Merge the release PR. CI publishes to npm automatically.

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
