# @sebspark/openapi-core

## 2.2.0

### Minor Changes

- f4b36e9: Ability to specify timeout for requests

## 2.1.3

### Patch Changes

- 59de1b8: Patch axios

## 2.1.2

### Patch Changes

- ac217da: Fix header iterator.

## 2.1.1

### Patch Changes

- 4034515: Update authorizationTokenGenerator signature

## 2.1.0

### Minor Changes

- ee5cc7e: Added support for specifying api token generator with auto-refresh when using openapi client.

## 2.0.1

### Patch Changes

- fde8ea1: Update dependencies.

## 2.0.0

### Major Changes

- 1ef46ab: Updated express to v5

## 1.6.0

### Minor Changes

- b288618: support for http(s) agent in axios request

## 1.5.4

### Patch Changes

- 8308772: Updated vulnerable dependencies (express and axios)

## 1.5.3

### Patch Changes

- beda07a: add custom error response to err.cause

## 1.5.2

### Patch Changes

- 7548d7c: bump axios from 1.7.2 to 1.7.4

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
