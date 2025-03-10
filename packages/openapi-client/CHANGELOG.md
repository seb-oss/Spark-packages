# @sebspark/openapi-client

## 2.1.3

### Patch Changes

- edffdcc: Better debug logging.

## 2.1.2

### Patch Changes

- 47d6196: Add debug logging.

## 2.1.1

### Patch Changes

- dd7248b: Fix url references

## 2.1.0

### Minor Changes

- ee5cc7e: Added support for specifying api token generator with auto-refresh when using openapi client.

### Patch Changes

- Updated dependencies [ee5cc7e]
  - @sebspark/openapi-core@2.1.0

## 2.0.1

### Patch Changes

- fde8ea1: Update dependencies.
- Updated dependencies [fde8ea1]
  - @sebspark/openapi-core@2.0.1

## 2.0.0

### Major Changes

- 1ef46ab: Updated express to v5

### Patch Changes

- Updated dependencies [1ef46ab]
  - @sebspark/openapi-core@2.0.0

## 1.6.1

### Patch Changes

- 5aa2b5a: forward http(s)Agent through arg merge

## 1.6.0

### Minor Changes

- b288618: support for http(s) agent in axios request

### Patch Changes

- Updated dependencies [b288618]
  - @sebspark/openapi-core@1.6.0

## 1.5.1

### Patch Changes

- b48ad58: Fix error converting circular structure to JSON

## 1.5.0

### Minor Changes

- 40820fe: Inject logger in typedClient

## 1.4.5

### Patch Changes

- 8308772: Updated vulnerable dependencies (express and axios)
- Updated dependencies [8308772]
  - @sebspark/openapi-core@1.5.4

## 1.4.4

### Patch Changes

- 7548d7c: bump axios from 1.7.2 to 1.7.4
- Updated dependencies [7548d7c]
  - @sebspark/openapi-core@1.5.2

## 1.4.3

### Patch Changes

- 93a37b3: Patch dependencies
- Updated dependencies [93a37b3]
  - @sebspark/openapi-core@1.5.1
  - @sebspark/retry@0.1.1

## 1.4.2

### Patch Changes

- f73d4b4: Handle numbers in parameter serializer

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
