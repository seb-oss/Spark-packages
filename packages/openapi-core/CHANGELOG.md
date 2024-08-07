# @sebspark/openapi-core

## 1.5.1

### Patch Changes

- 93a37b3: Patch dependencies
- Updated dependencies [93a37b3]
  - @sebspark/retry@0.1.1

## 1.5.0

### Minor Changes

- 4d3ca56: Improved Error handling

## 1.4.2

### Patch Changes

- c0b59f2: Errors are serialized with stack for non production env

## 1.4.1

### Patch Changes

- ac30800: Update Serialized type to handle Date | undefined

## 1.4.0

### Minor Changes

- 008c27a: Added params serializer options for arrays

## 1.3.0

### Minor Changes

- 06176d0: Updated Client to support undocumented headers

## 1.2.0

### Minor Changes

- e1ddbab: Added support for securitySchemes. Headers are now in lowercase on server

## 1.1.0

### Minor Changes

- a71af0c: Dates are now typed as Date, except for after serialization

## 1.0.0

### Major Changes

- ae03155: First major version. Typegen now accepts json and yaml. It also accepts either a file or a dir as input. Server and Client now return objects containing data and headers.

## 0.1.0

### Minor Changes

- f20c83b: First implementation of OpenAPI -> Typescript with server an client
