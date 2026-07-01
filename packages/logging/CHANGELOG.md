# @sebspark/logging

## 2.0.16

### Patch Changes

- 5e9fc45: Bump dependencies. Security fixes:

  - **form-data** 2.5.6 / 4.0.6 — CRLF injection via unescaped multipart field names and filenames (High)
  - **vite** 8.1.2 — `server.fs.deny` bypass on Windows alternate paths; NTLMv2 hash disclosure via launch-editor (High/Moderate)
  - **ws** 8.21.0 — Memory exhaustion DoS from tiny fragments; uninitialized memory disclosure (High/Moderate)
  - **undici** 8.5.0 — Multiple DoS and information disclosure CVEs (High/Moderate/Low)
  - **tar** 7.5.19 — PAX size override causes tar parser differential / file smuggling (Moderate)
  - **qs** 6.15.3 — DoS via `qs.stringify` crash on null/undefined entries (Moderate)
  - **@opentelemetry/core** 2.8.0 — Unbounded memory allocation in W3C Baggage propagation (Moderate)
  - **@babel/core** 7.29.7 — Arbitrary file read via sourceMappingURL comment (Low)
  - **protobufjs** 8.6.5

  Other dependency updates:

  - `@google-cloud/spanner` 8.8.0
  - `@testcontainers/*` 12.0.4
  - `google-auth-library` 10.9.0
  - `mockserver-client` 7.3.0
  - `nock` 14.0.16
  - `prettier` 3.9.4
  - `redis` 6.1.0
  - `webpack` 5.108.3 / `webpack-cli` 7.1.0

## 2.0.15

### Patch Changes

- a6c27f3: Updated dependencies

## 2.0.14

### Patch Changes

- 97fe7da: Updated dependencies

## 2.0.13

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 2.0.12

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 2.0.11

### Patch Changes

- 4e12590: Updated dependencies

## 2.0.10

### Patch Changes

- 67d6129: Updated dependencies

## 2.0.9

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 2.0.8

### Patch Changes

- c8dcadb: Updated dependencies

## 2.0.6

### Patch Changes

- 48ab717: Updated dependencies

## 2.0.5

### Patch Changes

- 87c769d: Updated dependencies

## 2.0.4

### Patch Changes

- 8626deb: Updated vulnerable, transitive jws dependency

## 2.0.3

### Patch Changes

- ef9ccdc: Updated to latest express version

## 2.0.2

### Patch Changes

- 5bf3ac7: chore: update dependencies for express-serve-static-core

## 2.0.1

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 2.0.0

### Major Changes

- 0864ec2: Minimum node version 22

## 1.7.5

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 1.7.4

### Patch Changes

- 29b9b20: Updated dependencies

## 1.7.3

### Patch Changes

- 5c6e183: Updated dependencies

## 1.7.2

### Patch Changes

- 744b05f: Updated dependencies

## 1.7.1

### Patch Changes

- da3bf90: Missing dependencies

## 1.7.0

### Minor Changes

- 601f782: Update tests

### Patch Changes

- 06948d0: Updated dependencies

## 1.6.1

### Patch Changes

- 886fd56: use google cloud formatter to allow masking sensitive data

## 1.6.0

### Minor Changes

- 6ab51d6: enable option for providing sensitivity rules that can be used for masking sensitive information

## 1.5.1

### Patch Changes

- 9561d6f: Only console.log if setting log level fails

## 1.5.0

### Minor Changes

- d8508bd: Set console log level and allow LOG_LEVEL env to override level.

## 1.4.2

### Patch Changes

- fde8ea1: Update dependencies.

## 1.4.1

### Patch Changes

- e54d2b7: Updated dependencies

## 1.4.0

### Minor Changes

- 639c691: bump some dependencies to non-vulnerable versions

## 1.3.0

### Minor Changes

- 265a850: upgrade express to 5.0.0

## 1.2.4

### Patch Changes

- 0a38227: bug fix stack false no longer clears formatting

## 1.2.3

### Patch Changes

- 4b4b691: fix express vulnerability in logging package

## 1.2.2

### Patch Changes

- 93a37b3: Patch dependencies

## 1.2.1

### Patch Changes

- c3b76e6: add missing export for timingMiddleware

## 1.2.0

### Minor Changes

- f284f52: Added timing middleware and improved logger configuration

## 1.1.0

### Minor Changes

- 1816441: allow custom log functions for HTTP requests and errors

## 1.0.0

### Major Changes

- af5e581: modify the library to pass configuration settings as function parameters instead of relying on environment variables

## 0.2.0

### Minor Changes

- 12c39e5: make format of Winston Console transport configurable

## 0.1.6

### Patch Changes

- e0e18c4: Fixed express middleware so it logs handled errors

## 0.1.5

### Patch Changes

- f3e8741: Bump version to 0.1.5

## 0.1.4

### Patch Changes

- cd86906: Hide health route log

## 0.1.3

### Patch Changes

- 0d04f5b: Change log format, hide when testing

## 0.1.2

### Patch Changes

- 835306d: Fixed middleware

## 0.1.1

### Patch Changes

- 93f7dfb: Forcing release

## 0.1.0

### Minor Changes

- ef22edc: Logger with express and socket.io instrumentation

## 0.0.5

### Patch Changes

- 13148cc: Publish TypeScript configuration

## 0.0.4

### Patch Changes

- 3650622: Update build to output CommonJS and ES Module

## 0.0.3

### Patch Changes

- 9900279: Make a first release

## 0.0.2

### Patch Changes

- a36b647: Adding logging package
