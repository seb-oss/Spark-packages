# @sebspark/gcp-iam

## 1.2.0

### Minor Changes

- 7663922: Update cache strategy for gateway api token generation

## 1.1.1

### Patch Changes

- c8444d5: Better debug logging.

## 1.1.0

### Minor Changes

- d4fb078: Optional logger, support soft-fail.

## 1.0.0

### Major Changes

- ee5cc7e: Added support for specifying api token generator with auto-refresh when using openapi client.

## 0.4.1

### Patch Changes

- 4c522b4: Add debug logging of KeyID from IAM Client.

## 0.4.0

### Minor Changes

- 4a446a2: Breaking change: Change parameters in function getApiGatewayToken to pass a custom key to dont reuse the same jwt between user sessions, also to setup a custom ttl

### Patch Changes

- cbdf644: chore: reduce the cache ttl to 10 seconds

## 0.3.1

### Patch Changes

- de46799: log api gateway errors

## 0.3.0

### Minor Changes

- 0fc33ba: Support soft failure, meaning it returns an empty string on failure. The intended use is for local development when not running in a GCP context.

## 0.2.1

### Patch Changes

- 0a43670: Remove console.log

## 0.2.0

### Minor Changes

- bde79a2: Use google auth to get service account e-mail

## 0.1.0

### Minor Changes

- ecd11a1: Expose a method for generating a system JWT signed by the SA running the workload.
