# @sebspark/openapi-typegen

## 1.8.0

### Minor Changes

- 23950b4: Now parses alias for primitive type

## 1.7.3

### Patch Changes

- ad6abf8: Revert date parsing

## 1.7.2

### Patch Changes

- cc78f28: Parse date strings as strings instead of JS Date objects

## 1.7.1

### Patch Changes

- e693b62: Fixed type generation for array of unknown

## 1.7.0

### Minor Changes

- f794941: Now handles inline enums and unspecified arrays

## 1.6.0

### Minor Changes

- e1ddbab: Added support for securitySchemes. Headers are now in lowercase on server

### Patch Changes

- Updated dependencies [e1ddbab]
  - @sebspark/openapi-core@1.2.0

## 1.5.1

### Patch Changes

- a07db16: Fix naming error

## 1.5.0

### Minor Changes

- 58c96a0: Support for domain style names (com.domain.card => com_domain_Card)

## 1.4.1

### Patch Changes

- 85cf047: Fixed domain type names

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
