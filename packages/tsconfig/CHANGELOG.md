# @sebspark/tsconfig

## 3.0.8

### Patch Changes

- 80e6230: Updated dependencies

## 3.0.7

### Patch Changes

- 513bf74: Suppress errors from bundling dependencies

## 3.0.6

### Patch Changes

- 11a11ce: Updated dependencies

## 3.0.4

### Patch Changes

- 48ab717: Updated dependencies

## 3.0.3

### Patch Changes

- b40eb86: Updated dependencies

## 3.0.2

### Patch Changes

- 38b52c4: Updated tsdown

## 3.0.1

### Patch Changes

- ad5a205: Updated tsdown

## 3.0.0

### Major Changes

- cc28876: Updated tsdown to v0.17

## 2.1.6

### Patch Changes

- 26c1ad7: chore: fix spark-build

## 2.1.5

### Patch Changes

- 66925c5: chore: expose tsdown as spark-build

## 2.1.4

### Patch Changes

- cacbaf5: chore: upgrade dependencies

## 2.1.3

### Patch Changes

- 37ab2b5: fix(tsconfig): export typo

## 2.1.2

### Patch Changes

- 133c172: fix: export ./tsdown

## 2.1.1

### Patch Changes

- 7846ecc: feat: add tsdown config

## 2.1.0

### Minor Changes

- 4b210c2: Standardized on a common build script

## 2.0.0

### Major Changes

- 0bd138b: ### What
  Switched all base configurations to split app and library targets:
  - `/tsconfig.app.json` for apps
  - `/tsconfig.lib.json` for libraries

  ### Why

  To align with modern TypeScript defaults and simplify Node 22 + bundler builds.

  ### How to migrate
  - **Apps:** extend `@sebspark/tsconfig/app.json` to use
    `"moduleResolution": "NodeNext"`, `"module": "NodeNext"`.
  - **Libraries:** extend `@sebspark/tsconfig/lib.json` to use
    `"moduleResolution": "Bundler"`, `"module": "ESNext"`.

## 1.0.1

### Patch Changes

- 604c94a: Updated dependencies

## 1.0.0

### Major Changes

- 142e991: target set to ES2022

## 0.1.1

### Patch Changes

- 93a37b3: Patch dependencies

## 0.1.0

### Minor Changes

- 13148cc: Publish TypeScript configuration
