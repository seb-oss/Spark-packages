# @sebspark/opentelemetry-instrumentation-opensearch

## 0.3.6

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 0.3.5

### Patch Changes

- cf4ca8e: Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

  Dependency updates:
  - `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
  - `@google-cloud/spanner`: `8.7.0` → `8.7.1`
  - `fast-xml-parser`: `5.7.2` → `5.7.3`
  - Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`

## 0.3.4

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 0.3.3

### Patch Changes

- 8a120f6: Updated dependencies for all and docs for emulator

## 0.3.2

### Patch Changes

- e9a7a28: Updated dependencies

## 0.3.1

### Patch Changes

- 4e12590: Updated dependencies

## 0.3.0

### Minor Changes

- f202dc3: Improved Opensearch tracing

## 0.2.2

### Patch Changes

- 91aed80: Updated dependencies

## 0.2.1

### Patch Changes

- cd9e760: Duration added to openapie-express routes

## 0.2.0

### Minor Changes

- b92b79a: Added a bunch of metrics

## 0.1.1

### Patch Changes

- 67d6129: Updated dependencies

## 0.1.0

### Minor Changes

- 77a7a66: First release
