# @sebspark/openapi-client

## 1.4.1

### Patch Changes

- 59d6089: Fixes a bug where a GET request gets sent with the Content-Length header set to 2, because data is {}. This causes a problem with some load balancers.

## 1.4.0

### Minor Changes

- eb6719b: Redis implementation

## 1.3.2

### Patch Changes

- 950590a: Serializer preserves commas in strings

## 1.3.1

### Patch Changes

- 772d39b: Fixed a bug in array serialization

## 1.3.0

### Minor Changes

- 008c27a: Added params serializer options for arrays

### Patch Changes

- Updated dependencies [008c27a]
  - @sebspark/openapi-core@1.4.0

## 1.2.0

### Minor Changes

- 06176d0: Updated Client to support undocumented headers

### Patch Changes

- Updated dependencies [06176d0]
  - @sebspark/openapi-core@1.3.0

## 1.1.0

### Minor Changes

- a71af0c: Dates are now typed as Date, except for after serialization

### Patch Changes

- Updated dependencies [a71af0c]
  - @sebspark/openapi-core@1.1.0

## 1.0.0

### Major Changes

- ae03155: First major version. Typegen now accepts json and yaml. It also accepts either a file or a dir as input. Server and Client now return objects containing data and headers.

### Patch Changes

- Updated dependencies [ae03155]
  - @sebspark/openapi-core@1.0.0

## 0.2.0

### Minor Changes

- fc423aa: Split retry into a separate package

### Patch Changes

- Updated dependencies [fc423aa]
  - @sebspark/retry@0.1.0

## 0.1.0

### Minor Changes

- f20c83b: First implementation of OpenAPI -> Typescript with server an client

### Patch Changes

- Updated dependencies [f20c83b]
  - @sebspark/openapi-core@0.1.0
