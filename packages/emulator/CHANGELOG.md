# @sebspark/emulator

## 0.4.0

### Minor Changes

- cf4ca8e: Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

  Dependency updates:
  - `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
  - `@google-cloud/spanner`: `8.7.0` → `8.7.1`
  - `fast-xml-parser`: `5.7.2` → `5.7.3`
  - Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`

## 0.3.2

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 0.3.1

### Patch Changes

- 8a120f6: Updated dependencies for all and docs for emulator

## 0.3.0

### Minor Changes

- 896fda9: stream.waitForCall now has a timeout to prevent tests freezing

## 0.2.0

### Minor Changes

- 0aed41b: ### Added
  - `.stream(initializer)` — externally-driven streaming responder that keeps a connection open and lets the test push updates via a `StreamHandle` (`waitForCall()`, `send()`, `latestResponse`, `hasBeenCalled`)
  - `.pending` — number of unspent responders registered for a method
  - `.reset()` — clears responders for a method; emulator-level `reset()` clears all methods

## 0.1.0

### Minor Changes

- 38ac0d8: First version of emulator
