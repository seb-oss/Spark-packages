# @sebspark/emulator

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
