# @sebspark/openapi-typegen

## 3.0.2

### Patch Changes

- 13a1692: Updated yargs dependency

## 3.0.1

### Patch Changes

- 5c6e183: Updated dependencies
- Updated dependencies [5c6e183]
  - @sebspark/openapi-core@2.3.4

## 3.0.0

### Major Changes

- ab95efe: Update wrapper around query parameters to convert primitives to strings since that's what's actually returned by Node.

### Patch Changes

- Updated dependencies [ab95efe]
  - @sebspark/openapi-core@2.3.0

## 2.3.2

### Patch Changes

- eeffca3: Do not use Serialized<> for client types

## 2.3.1

### Patch Changes

- 744b05f: Updated dependencies

## 2.3.0

### Minor Changes

- 1ef8116: Wrap query in Serialized<> type

## 2.2.0

### Minor Changes

- 22f4144: Export server paths as separate type
- 601f782: Update tests

### Patch Changes

- 06948d0: Updated dependencies
- Updated dependencies [06948d0]
  - @sebspark/openapi-core@2.2.1

## 2.1.0

### Minor Changes

- e4665c0: Adds 400 errors to server components.

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

## 1.11.0

### Minor Changes

- 37984eb: Enums are now exported as a const (MY_ENUM_VALUES) and a type (MyEnum)

## 1.10.0

### Minor Changes

- 894bf2e: remove yarn as a dependency

## 1.9.0

### Minor Changes

- 052ad11: Added support for additionalProperties

## 1.8.5

### Patch Changes

- b7a0309: Handle array enums using oneOf in type generation

## 1.8.4

### Patch Changes

- 93a37b3: Patch dependencies
- Updated dependencies [93a37b3]
  - @sebspark/openapi-core@1.5.1

## 1.8.3

### Patch Changes

- f328065: allow Request as a type name

## 1.8.2

### Patch Changes

- 40391e0: Server and Client are only generated if paths exist

## 1.8.1

### Patch Changes

- d3e8dfa: Fixed parsing of inline items in arrays

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
