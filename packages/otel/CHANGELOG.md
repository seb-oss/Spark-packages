# @sebspark/otel

## 4.0.1

### Patch Changes

- 4124516: Updated dependencies
- 4e12590: Updated dependencies
- Updated dependencies [4e12590]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.1

## 4.0.0

### Major Changes

- f07a679: Instrumentations are now methods and accept config

## 3.0.4

### Patch Changes

- aff5f58: Updated dependencies

## 3.0.3

### Patch Changes

- ae4b9bf: OTEL only tries to shut down once

## 3.0.2

### Patch Changes

- Updated dependencies [f202dc3]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.0

## 3.0.1

### Patch Changes

- 22bde73: Opensearch instrumentation does not call through to http instrumentation

## 3.0.0

### Major Changes

- 91aed80: Added instrumentation for outgoing http requests and removed SIGTERM listener

### Patch Changes

- Updated dependencies [91aed80]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.2

## 2.2.3

### Patch Changes

- Updated dependencies [cd9e760]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.1

## 2.2.2

### Patch Changes

- Updated dependencies [b92b79a]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.0

## 2.2.1

### Patch Changes

- Updated dependencies [67d6129]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.1.1

## 2.2.0

### Minor Changes

- 3d2415a: Added instrumentation for opensearch

## 2.1.8

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.

## 2.1.7

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 2.1.6

### Patch Changes

- 5e9294e: chore: use global variables to store otel initialization

## 2.1.5

### Patch Changes

- 23be838: chore: change k8s logs format

## 2.1.4

### Patch Changes

- 6cf0475: chore: format service name, remove wrong characters

## 2.1.3

### Patch Changes

- 8cd0201: Fix for OTEL not initialized spam and double span.end()

## 2.1.2

### Patch Changes

- 1c13543: add missing attribute gcp.log_name

## 2.1.1

### Patch Changes

- 1485c2d: Changed warning level text from WARNING to WARN

## 2.1.0

### Minor Changes

- c60b7a4: chore: change logs formatting

## 2.0.14

### Patch Changes

- 2241dc7: Updated dependencies

## 2.0.13

### Patch Changes

- 80e6230: Updated dependencies

## 2.0.12

### Patch Changes

- c8dcadb: Updated dependencies

## 2.0.11

### Patch Changes

- 11a11ce: Updated dependencies

## 2.0.9

### Patch Changes

- 48ab717: Updated dependencies

## 2.0.8

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 2.0.7

### Patch Changes

- 8626deb: Updated vulnerable, transitive jws dependency

## 2.0.6

### Patch Changes

- 7df8217: Updated dependencies

## 2.0.5

### Patch Changes

- 4b210c2: Standardized on a common build script

## 2.0.4

### Patch Changes

- 618a019: Dynamically imported instrumentations

## 2.0.3

### Patch Changes

- eb99a27: Marked opentelemetry dependencies as external

## 2.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 2.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports

## 2.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

## 1.1.4

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 1.1.3

### Patch Changes

- 604c94a: Updated dependencies

## 1.1.2

### Patch Changes

- b8fe201: SpanStatusCode is exported as a value, not a type

## 1.1.1

### Patch Changes

- b86cf2d: Instrumentation warnings are now supressed during testing

## 1.1.0

### Minor Changes

- a8ba986: OTEL exports usable types

## 1.0.5

### Patch Changes

- 90fa604: Changed initialization handling in logger to solve OTEL fail spam

## 1.0.4

### Patch Changes

- 63fc64a: tracer and meter no longer throw before initialization

## 1.0.3

### Patch Changes

- 0e4d66b: Logger swallows messages before initialization

## 1.0.2

### Patch Changes

- 4b1337a: Disabling context before initialize

## 1.0.1

### Patch Changes

- c360c99: Init check is moved to first log call instead of at getLogger()

## 1.0.0

### Major Changes

- d361253: OTEL instrumentation now requires initialize and specific instrumentations

## 0.4.2

### Patch Changes

- d323365: Change error function to be able to receive an error object as parameter

## 0.4.0

### Minor Changes

- 0dc99f6: Console logger is added if LOG_LEVEL is set, even if collector exists

## 0.3.1

### Patch Changes

- fc781e2: Switched places for spanId/traceId

## 0.3.0

### Minor Changes

- 2a7b207: Added span and trace id to span logs

## 0.2.4

### Patch Changes

- 2c32898: Fixed wrongful options copy for span with parent

## 0.2.3

### Patch Changes

- 0288531: Tracer and Meter are asynch and Logger awaits init

## 0.2.2

### Patch Changes

- 005c598: Removed manual context registration

## 0.2.1

### Patch Changes

- ac28d06: No duplicate contextManager

## 0.2.0

### Minor Changes

- cc889fb: Added custom loggers for dev use

## 0.1.0

### Minor Changes

- 3007f53: First, simple implementation of OTEL instrumentation
