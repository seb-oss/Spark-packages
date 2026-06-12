# @sebspark/opensearch

## 3.1.7

### Patch Changes

- a6c27f3: Updated dependencies

## 3.1.6

### Patch Changes

- 264e665: Upgrade `redis` to v6 in `@sebspark/promise-cache` and bump minor dependencies across the workspace.

  **Breaking change (`@sebspark/promise-cache`):**
  `redis` upgraded from `5.12.1` → `6.0.0`. Redis v6 contains breaking changes in its API — see the [redis v6 migration guide](https://github.com/redis/node-redis/blob/master/docs/v4-to-v6.md) if your code uses the client directly.

  **Dependency updates across packages:**
  - `testcontainers` / `@testcontainers/*`: `12.0.0` → `12.0.1` (health-check, opensearch, opentelemetry-instrumentation-opensearch, otel, promise-cache, socket.io-gcp-pubsub-emitter, spanner-migrate, test-iap)
  - `redis`: `5.12.1` → `6.0.0` (otel, promise-cache)
  - `tsdown`: `0.22.0` → `0.22.1` (tsconfig)
  - `turbo` / `@turbo/gen`: `2.9.15` → `2.9.16`
  - `webpack-cli`: `7.0.2` → `7.0.3` (avsc-isometric)

  **Test fix (`@sebspark/promise-cache`):**
  Pinned Redis container image tag to `redis:8.8-alpine` (was `redis:8-alpine`) to prevent floating-tag drift in e2e tests.

## 3.1.5

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 3.1.4

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 3.1.3

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 3.1.2

### Patch Changes

- e9a7a28: Updated dependencies

## 3.1.1

### Patch Changes

- 4e12590: Updated dependencies

## 3.1.0

### Minor Changes

- 24c88bb: Fixes terms query type structure to match opensearch query structure.

## 3.0.22

### Patch Changes

- 67d6129: Updated dependencies

## 3.0.21

### Patch Changes

- 6d72f97: Updated dependencies

## 3.0.20

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 3.0.19

### Patch Changes

- 772044e: chore: properties is optional

## 3.0.18

### Patch Changes

- a511447: feat: support for sort by \_id

## 3.0.17

### Patch Changes

- f96abfc: Make IndexRequest body accept partial documents

## 3.0.16

### Patch Changes

- f100f5b: Fixed search for nested properties

## 3.0.15

### Patch Changes

- f2a144e: Fix range query

## 3.0.14

### Patch Changes

- f564dba: Fixed Sort type

## 3.0.13

### Patch Changes

- 35ec1a0: Fixed type for text property with keyword field
- 35ec1a0: Updated dependencies

## 3.0.12

### Patch Changes

- 5a167db: Fixes ids filter

## 3.0.11

### Patch Changes

- 8c7a661: feat: opensearch date is stored as string

## 3.0.10

### Patch Changes

- a7c1649: feat: nested property should be an array

## 3.0.8

### Patch Changes

- a4f099f: Sort no longer requires all properties to be defined

## 3.0.7

### Patch Changes

- 48ab717: Updated dependencies

## 3.0.6

### Patch Changes

- b40eb86: Updated dependencies

## 3.0.5

### Patch Changes

- 1ab6374: feat: nested properties should be truly optional

## 3.0.4

### Patch Changes

- aeef361: feat: nested properties should be optional

## 3.0.3

### Patch Changes

- 3299d70: Readonly removal propagates to sub objects of Document

## 3.0.2

### Patch Changes

- d2b8690: Remove readonly from DocumentFor properties

## 3.0.1

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 3.0.0

### Major Changes

- cc28876: Added support for dynamic and made all properties optional in documents

## 2.1.0

### Minor Changes

- 69ddad9: Exporting additional types for index definitions

## 2.0.3

### Patch Changes

- 7df8217: Updated dependencies

## 2.0.2

### Patch Changes

- 4b210c2: Standardized on a common build script

## 2.0.1

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 2.0.0

### Major Changes

- 0864ec2: Minimum node version 22

## 1.1.1

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 1.1.0

### Minor Changes

- 604c94a: Updated @opensearch-project/opensearch to latest. Type system now uses OpenSearch:es exposed types.

## 1.0.3

### Patch Changes

- 29b9b20: Updated dependencies

## 1.0.2

### Patch Changes

- 5c6e183: Updated dependencies

## 1.0.1

### Patch Changes

- 06948d0: Updated dependencies

## 1.0.0

### Major Changes

- 342088f: Rewrite of OpenSearch helpers

## 0.3.3

### Patch Changes

- e54d2b7: Updated dependencies

## 0.3.2

### Patch Changes

- 93a37b3: Patch dependencies

## 0.3.1

### Patch Changes

- 4fb2632: Fixed support for ids query.

## 0.3.0

### Minor Changes

- dc8ad68: Support sort

## 0.2.3

### Patch Changes

- 24d2add: Moved query.fields to \_source

## 0.2.2

### Patch Changes

- 10c4d93: Fix wildcard things

## 0.2.1

### Patch Changes

- e43eb8b: Fix id querying and match_all

## 0.2.0

### Minor Changes

- 79104c9: Support nested types

## 0.1.2

### Patch Changes

- 574d8b4: Fixed IndexProperties<Date>

## 0.1.1

### Patch Changes

- a36f430: Fixed inference of array mappings for index creation

## 0.1.0

### Minor Changes

- dc4ed6d: First version of OpenSearch helper
