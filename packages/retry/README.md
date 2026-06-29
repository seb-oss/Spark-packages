# `@sebspark/retry`

A helper for retrying any promise call (ex an http request) with error rules and backoff

## Usage

```typescript
import { retry, interval, retryCondition, RetrySettings } from '@sebspark/retry'
import axios from 'axios'

const settings: RetrySettings = {
  interval: interval.exponential(1000), // Exponential backoff starting at 1000 ms
  maxRetries: 5,
  maxDelay: 5000, // Cap each retry wait to at most 5000 ms
  retryCondition: retryCondition.serverErrors, // Only retries on server errors
}

const result = await retry(() => axios.get('https://example.com'), settings)
```

## `maxDelay`

`maxDelay` is optional. When set, it caps the computed delay for each retry attempt.

- Without `maxDelay`: waits exactly `interval(retryCount)`
- With `maxDelay`: waits `Math.min(interval(retryCount), maxDelay)`

Example with exponential backoff:

- `interval.exponential(1000)` produces: `1000, 2000, 4000, 8000, ...`
- with `maxDelay: 5000` actual waits become: `1000, 2000, 4000, 5000, ...`
