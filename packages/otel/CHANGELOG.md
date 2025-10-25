# @sebspark/otel

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
