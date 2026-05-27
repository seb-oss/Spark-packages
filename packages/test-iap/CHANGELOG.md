# @sebspark/test-iap

## 1.0.19

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 1.0.18

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 1.0.17

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 1.0.16

### Patch Changes

- e9a7a28: Updated dependencies

## 1.0.15

### Patch Changes

- 4e12590: Updated dependencies

## 1.0.14

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.

## 1.0.13

### Patch Changes

- 6d72f97: Updated dependencies

## 1.0.12

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.11

### Patch Changes

- 2241dc7: Updated dependencies

## 1.0.10

### Patch Changes

- 35ec1a0: Updated dependencies

## 1.0.8

### Patch Changes

- 48ab717: Updated dependencies

## 1.0.7

### Patch Changes

- b40eb86: Updated dependencies

## 1.0.6

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 1.0.5

### Patch Changes

- cc28876: Updated dependencies

## 1.0.4

### Patch Changes

- 7df8217: Updated dependencies

## 1.0.3

### Patch Changes

- 4b210c2: Standardized on a common build script

## 1.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 1.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports

## 1.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

## 0.1.5

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.1.4

### Patch Changes

- 604c94a: Updated dependencies

## 0.1.3

### Patch Changes

- 29b9b20: Updated dependencies

## 0.1.2

### Patch Changes

- 5c6e183: Updated dependencies

## 0.1.1

### Patch Changes

- 9268050: Fixed documentation

## 0.1.0

### Minor Changes

- 3f1cd1a: A test IAP for e2e testing
