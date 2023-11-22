# `@sebspark/retry`

A helper for retrying any promise call (ex an http request) with error rules and backoff

## Usage

```typescript
import { retry, interval, retryCondition, RetrySettings } from '@sebspark/retry'
import axios from 'axios'

const settings: RetrySettings = {
  interval: interval.exponential(1000), // Exponential backoff starting at 1000 ms
  maxRetries: 5,
  retryCondition: retryCondition.serverErrors, // Only retries on server errors
}

const result = await retry(() => axios.get('https://example.com'), settings)
```
