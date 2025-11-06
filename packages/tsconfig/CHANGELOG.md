# @sebspark/tsconfig

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
