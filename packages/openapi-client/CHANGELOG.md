# @sebspark/openapi-client

## 4.1.0

### Minor Changes

- b877b56: Removes Token Generator from the graphql client

## 4.0.13

### Patch Changes

- cc28876: Updated dependencies
- Updated dependencies [cc28876]
  - @sebspark/openapi-core@4.0.10

## 4.0.12

### Patch Changes

- 7df8217: Updated dependencies
- Updated dependencies [7df8217]
  - @sebspark/otel@2.0.6

## 4.0.11

### Patch Changes

- e4a6f7d: fix: do not log headers

## 4.0.10

### Patch Changes

- 71297be: fix: do not log full requests

## 4.0.9

### Patch Changes

- ef9ccdc: Updated to latest express version

## 4.0.8

### Patch Changes

- 66925c5: chore: expose tsdown as spark-build
- Updated dependencies [66925c5]
  - @sebspark/openapi-auth-iam@3.0.8
  - @sebspark/openapi-core@4.0.9

## 4.0.7

### Patch Changes

- cacbaf5: chore: upgrade dependencies
- Updated dependencies [cacbaf5]
  - @sebspark/openapi-auth-iam@3.0.7
  - @sebspark/openapi-core@4.0.8
  - @sebspark/retry@1.0.2

## 4.0.6

### Patch Changes

- c32b9e3: chore: migrate to tsdown
- Updated dependencies [c32b9e3]
  - @sebspark/openapi-auth-iam@3.0.5
  - @sebspark/openapi-core@4.0.7

## 4.0.5

### Patch Changes

- 0ba06f2: fix: dependencies

## 4.0.4

### Patch Changes

- 5bf3ac7: chore: update dependencies for express-serve-static-core
- Updated dependencies [5bf3ac7]
  - @sebspark/openapi-core@4.0.4

## 4.0.3

### Patch Changes

- 4b210c2: Standardized on a common build script
- Updated dependencies [4b210c2]
  - @sebspark/openapi-auth-iam@3.0.3
  - @sebspark/openapi-core@4.0.3
  - @sebspark/otel@2.0.5

## 4.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler
- Updated dependencies [7e5c2e9]
  - @sebspark/openapi-auth-iam@3.0.2
  - @sebspark/openapi-core@4.0.2
  - @sebspark/retry@1.0.1
  - @sebspark/otel@2.0.2

## 4.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports
- Updated dependencies [d801e1e]
  - @sebspark/openapi-auth-iam@3.0.1
  - @sebspark/openapi-core@4.0.1
  - @sebspark/otel@2.0.1

## 4.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

### Patch Changes

- Updated dependencies [0864ec2]
- Updated dependencies [0864ec2]
  - @sebspark/openapi-auth-iam@3.0.0
  - @sebspark/openapi-core@4.0.0
  - @sebspark/otel@2.0.0
  - @sebspark/retry@1.0.0

## 3.0.1

### Patch Changes

- 3a40e49: Cleaned up dependencies
- Updated dependencies [3a40e49]
  - @sebspark/openapi-auth-iam@2.0.1
  - @sebspark/openapi-core@3.0.1
  - @sebspark/retry@0.1.2
  - @sebspark/otel@1.1.4

## 3.0.0

### Major Changes

- 604c94a: All logging is done through @sepspark/otel

### Patch Changes

- Updated dependencies [604c94a]
- Updated dependencies [604c94a]
  - @sebspark/openapi-auth-iam@2.0.0
  - @sebspark/openapi-core@3.0.0
  - @sebspark/otel@1.1.3

## 2.4.2

### Patch Changes

- 5c6e183: Updated dependencies
- Updated dependencies [5c6e183]
  - @sebspark/openapi-core@2.3.4

## 2.4.1

### Patch Changes

- 9140e2b: bump axios to ^1.12.0
- Updated dependencies [9140e2b]
  - @sebspark/openapi-core@2.3.2

## 2.4.0

### Minor Changes

- a3fd21e: Adds Gateway Graphql Client

## 2.3.0

### Minor Changes

- 1ef8116: Wrap query in Serialized<> type

## 2.2.3

### Patch Changes

- 06948d0: Updated dependencies
- Updated dependencies [06948d0]
  - @sebspark/openapi-core@2.2.1

## 2.2.2

### Patch Changes

- e5df55d: Fix debug logging

## 2.2.1

### Patch Changes

- d33f146: Add debug logging for serializer

## 2.2.0

### Minor Changes

- f4b36e9: Ability to specify timeout for requests

### Patch Changes

- Updated dependencies [f4b36e9]
  - @sebspark/openapi-core@2.2.0

## 2.1.10

### Patch Changes

- dad93d8: Error logs for token generation

## 2.1.9

### Patch Changes

- 027b65b: Each typed client now has its own axios instance so interceptors don't get mixed up

## 2.1.8

### Patch Changes

- 119117d: Fix support for boolean query params.

## 2.1.7

### Patch Changes

- bbb6d97: Tidying up debug logs
- 59de1b8: Patch axios
- Updated dependencies [59de1b8]
  - @sebspark/openapi-core@2.1.3

## 2.1.6

### Patch Changes

- ac217da: Fix header iterator.
- Updated dependencies [ac217da]
  - @sebspark/openapi-core@2.1.2

## 2.1.5

### Patch Changes

- 5a06650: Use baseUrl from request; don't add /

## 2.1.4

### Patch Changes

- 927eddc: Pass full URL to authorizationTokenGenerator

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
