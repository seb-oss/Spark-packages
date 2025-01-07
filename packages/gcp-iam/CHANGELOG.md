# @sebspark/gcp-iam

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
