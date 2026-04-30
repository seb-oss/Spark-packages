# @sebspark/cli-tester

## 1.0.15

### Patch Changes

- 764bac9: Fix instanceof for HttpError subclasses

  Fix ANSI color detection in cli-tester input: `styleText('red', '> ')` includes the closing escape code immediately after the space, so it never matched Inquirer's output where the full message is wrapped in red. Detection now extracts only the opening ANSI code using a NUL probe. Also fixes green tick detection with the same approach. Tests added for both no-color and ANSI color modes.

  Fix promise-cache to treat persistor errors as a cache miss rather than propagating them to the caller. Both `get` and `set` failures are now silently swallowed so the cache is always a pure performance optimisation.

  Fix duplicate `makeType` helper in socket.io-avro parser spec (hoisted to module scope). Fix negated ternary and unused import in the same file.

## 1.0.14

### Patch Changes

- 4124516: Updated dependencies
- 4e12590: Updated dependencies

## 1.0.13

### Patch Changes

- f90d132: Updated dependencies

## 1.0.12

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.11

### Patch Changes

- ed8453b: Updated dependencies

## 1.0.10

### Patch Changes

- 112a381: Updated dependencies

## 1.0.9

### Patch Changes

- c8dcadb: Updated dependencies

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

## 0.1.4

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.1.3

### Patch Changes

- 29b9b20: Updated dependencies

## 0.1.2

### Patch Changes

- 5c6e183: Updated dependencies

## 0.1.1

### Patch Changes

- 06948d0: Updated dependencies

## 0.1.0

### Minor Changes

- 58ed044: Rewrite of spanner-migrate to dupport multiple databases. Also first version of cli-tester - a tool for testing @inquirer based cli:s.
