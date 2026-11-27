# `@sebspark/openapi-core`
Base types and utilities for OpenAPI/Typescript. Used by:

[@sebspark/openapi-typegen](__./packages/openapi-typegen__)

[@sebspark/openapi-express](__./packages/openapi-express__)

[@sebspark/openapi-client](__./packages/openapi-client__)

## Document utilities

Helper functions for transforming OpenAPI documents before rendering or serving. All functions return a cloned document and do not modify the original.

### `disableUnimplementedPaths(document, server)`

Marks paths not present in the server definition as deprecated and tagged with `not-implemented`.

### `appendVersionToServers(document, version)`

Appends a version segment to all server URLs in the document.

### `flattenEnums(document)`

Flattens `oneOf[$ref, $ref, ...]` schemas where all refs resolve to enums into a single merged enum. Enables API UI tools like Scalar to render a dropdown instead of a free-text input.

### `resolveRef(ref, document)`

Resolves a `$ref` string to its schema definition within the document.

## HTTP Errors

Typed HTTP error classes for all 4xx and 5xx status codes.

```typescript
import { NotFoundError, UnauthorizedError, createHttpError, fromAxiosError } from '@sebspark/openapi-core'

throw new NotFoundError('Instrument not found')
throw new UnauthorizedError()

// Create by status code
throw createHttpError(429, 'Slow down')

// Convert from Axios error
catch (e) {
  throw fromAxiosError(e)
}
```

All errors extend `HttpError` which exposes a `statusCode` property and a `toJSON(showStack?)` method.

## Client typing

`BaseClient` and `RequestArgs` define the shape generated clients (see [@sebspark/openapi-client](../openapi-client)) are typed against: `Pick<BaseClient, V> & { [V]: <specific overloads> }`. Tests that call the generic `BaseClient` signature directly instead of a generated client's narrowed shape can pass while hiding a real regression — `openapi-core` 4.1.26 once widened `RequestArgs` so a too-generic test still compiled, and calls silently resolved to the generic overload with `response.data` typed as `unknown`. Type tests against generated clients, not `BaseClient` directly.
