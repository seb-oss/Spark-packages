# @sebspark/openapi-typegen

## 1.4.0

### Minor Changes

- 82ca2e3: Improved handling of oneOf with discriminator

## 1.3.0

### Minor Changes

- 9303c31: Added parsing of oneOf with discriminator

## 1.2.1

### Patch Changes

- be1c2e5: Fixed generation of arrays with inline definition

## 1.2.0

### Minor Changes

- a71af0c: Dates are now typed as Date, except for after serialization

### Patch Changes

- Updated dependencies [a71af0c]
  - @sebspark/openapi-core@1.1.0

## 1.1.0

### Minor Changes

- 7611bda: Added support for empty type definitions and allOf in properties

## 1.0.0

### Major Changes

- ae03155: First major version. Typegen now accepts json and yaml. It also accepts either a file or a dir as input. Server and Client now return objects containing data and headers.

### Patch Changes

- Updated dependencies [ae03155]
  - @sebspark/openapi-core@1.0.0

## 0.2.0

### Minor Changes

- 9dec71a: Adds stripped Request to server handlers

## 0.1.1

### Patch Changes

- ca9b6f2: If all properties of args are optional, args is now optional

## 0.1.0

### Minor Changes

- f20c83b: First implementation of OpenAPI -> Typescript with server an client

### Patch Changes

- Updated dependencies [f20c83b]
  - @sebspark/openapi-core@0.1.0
