# @sebspark/otel

## 0.5.2

### Patch Changes

- e5c157e: Change initialize process

## 0.5.1

### Patch Changes

- 0c7d61a: change otel init

## 0.5.0

### Minor Changes

- 8eb2d7b: Managed init for otel

## 0.4.4

### Patch Changes

- 289c49f: Change initialization process

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
