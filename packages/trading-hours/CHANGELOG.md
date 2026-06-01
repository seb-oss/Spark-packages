# @sebspark/trading-hours

## 1.0.9

### Patch Changes

- 494f9b3: Updated dependencies

## 1.0.8

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 1.0.7

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 1.0.6

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.4

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

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

## 0.4.3

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.4.2

### Patch Changes

- 512eba3: Remove SebMarket type.

## 0.4.1

### Patch Changes

- 93a37b3: Patch dependencies

## 0.4.0

### Minor Changes

- 322473b: Add support for new markets (DSME, FSME, and NSME)

## 0.3.1

### Patch Changes

- 4ea61b7: Handle lowercase markets

## 0.3.0

### Minor Changes

- bf87f81: Add support for MTAA (Borsa Italiana)
- bb418ec: Add support for XCSE
- 1d5c251: Add support for special closing hours. For example, EQTB has special opening hours the day before New Year's Eve.
- 74fe1c3: Add support for XMAD
- 1932fd9: Add support for XLON (London Stock Exchange)
- c84da87: Add half trading days for EQTB and XBER
- 505ae22: Add support for XNGM
- f1e1c00: Add support for XLIS (Euronext Lisbon)
- 33c4ab2: Add support for XSAT (Spotlight Stock Market)
- a5b5b83: Add support for XBRU (Euronext Brussels)

### Patch Changes

- 27f8748: Add Epiphany to XHEL holidays

## 0.2.0

### Minor Changes

- 2298185: Add `marketOpeningHours` that gets the opening hours of a provided market. The function handles half trading days.

## 0.1.0

### Minor Changes

- 9a8c6ab: Initial release of the trading hour library.
