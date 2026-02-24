# @sebspark/hyper-media

A TypeScript library for building hypermedia-driven REST API responses. Designed for use with Express behind a reverse proxy chain (e.g. Kong + GCP Internal ALBs), it constructs correct public-facing URLs from forwarded headers and wraps your data in consistent entity envelopes with HATEOAS links.

---

## Installation

```bash
yarn add @sebspark/hyper-media
```

---

## Concepts

### Entities

Every response is wrapped in an `Entity<T>` envelope:

```typescript
{
  data: T
  links: Record<string, Link>
}
```

Every entity always has a `self` link derived from the incoming request. Additional links are resolved relative to the request context.

### Links

```typescript
interface Link {
  method: Verb
  href: string
  title?: string
  description?: string
  deprecated?: boolean
}

type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

### URL Resolution

URLs are constructed using forwarded headers in the following order:

| Header | Purpose |
|---|---|
| `X-Forwarded-Host` | Public-facing hostname set by Kong |
| `X-Forwarded-Proto` | Protocol set by Kong (not used in href, implicit `//`) |
| `X-Forwarded-Prefix` | Path prefix accumulated across ALB hops |

All hrefs use implicit protocol (`//host/path`) so the client inherits the protocol from the page context.

---

## API

### `resolveUrl(req, url?)`

Constructs a full public-facing URL from the request context.

```typescript
import { resolveUrl } from '@sebspark/hyper-media'

// Self URL (no url arg) — preserves query string
resolveUrl(req)
// => //api.example.com/trading/exchange/v1/orders?status=active

// Absolute path — appended to prefix only
resolveUrl(req, '/health')
// => //api.example.com/trading/exchange/v1/health

// Relative path — appended to prefix + originalUrl
resolveUrl(req, './detail')
// => //api.example.com/trading/exchange/v1/orders/detail

// Parent path — walks up from prefix + originalUrl
resolveUrl(req, '../ping')
// => //api.example.com/trading/exchange/v1/ping

// Bare string — treated as relative (same as ./)
resolveUrl(req, 'detail')
// => //api.example.com/trading/exchange/v1/orders/detail
```

### `toEntity(req, data, links?)`

Wraps data in an entity envelope with a `self` link and any additional resolved links.

```typescript
import { toEntity } from '@sebspark/hyper-media'

const entity = toEntity(req, order, {
  // string shorthand — defaults to GET
  parent: '/orders',
  // full Link object
  cancel: { method: 'DELETE', href: './cancel', title: 'Cancel order' },
})

// =>
// {
//   data: order,
//   links: {
//     self:   { method: 'GET',    href: '//api.example.com/trading/exchange/v1/orders/123' },
//     parent: { method: 'GET',    href: '//api.example.com/trading/exchange/v1/orders' },
//     cancel: { method: 'DELETE', href: '//api.example.com/trading/exchange/v1/orders/123/cancel', title: 'Cancel order' },
//   }
// }
```

`self` is always derived from the request and cannot be overridden by the caller.

Links accept either a full `Link` object or a string shorthand which defaults to `GET`:

```typescript
// These are equivalent
toEntity(req, data, { parent: '/orders' })
toEntity(req, data, { parent: { method: 'GET', href: '/orders' } })
```

### `toPageListEntity(req, data, page, pageSize, total)`

Wraps a pre-mapped list of entities in a page-based list envelope with pagination links.

```typescript
import { toEntity, toPageListEntity } from '@sebspark/hyper-media'

const mappedItems = orders.map((order) =>
  toEntity(req, order, { self: `./orders/${order.id}` })
)

const entity = toPageListEntity(req, mappedItems, page, pageSize, total)

// =>
// {
//   data: [...],
//   _meta: { page: 2, pageSize: 10, total: 30 },
//   links: {
//     self:  { method: 'GET', href: '//api.example.com/.../orders?status=active' },
//     first: { method: 'GET', href: '//api.example.com/.../orders?status=active&page=1&page_size=10' },
//     last:  { method: 'GET', href: '//api.example.com/.../orders?status=active&page=3&page_size=10' },
//     prev:  { method: 'GET', href: '//api.example.com/.../orders?status=active&page=1&page_size=10' },
//     next:  { method: 'GET', href: '//api.example.com/.../orders?status=active&page=3&page_size=10' },
//   }
// }
```

- `prev` is absent on the first page
- `next` is absent on the last page
- Existing query params (filters etc.) are preserved and merged with pagination params

### `toCursorListEntity(req, data, pageSize, nextCursor?, prevCursor?)`

Wraps a pre-mapped list of entities in a cursor-based list envelope.

```typescript
import { toEntity, toCursorListEntity } from '@sebspark/hyper-media'

const mappedItems = orders.map((order) =>
  toEntity(req, order, { self: `./orders/${order.id}` })
)

const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc', 'prev-abc')

// =>
// {
//   data: [...],
//   _meta: { pageSize: 10, nextCursor: 'next-abc', prevCursor: 'prev-abc' },
//   links: {
//     self:  { method: 'GET', href: '//api.example.com/.../orders' },
//     first: { method: 'GET', href: '//api.example.com/.../orders' },
//     next:  { method: 'GET', href: '//api.example.com/.../orders?next_cursor=next-abc&page_size=10' },
//     prev:  { method: 'GET', href: '//api.example.com/.../orders?prev_cursor=prev-abc&page_size=10' },
//   }
// }
```

- `next` is absent when `nextCursor` is not provided
- `prev` is absent when `prevCursor` is not provided
- `first` is the current URL stripped of all cursor and page_size params
- Existing query params (filters etc.) are preserved and merged

---

## GCP / Proxy Setup

This library is designed for a multi-hop proxy architecture where each layer injects its own path segment via `X-Forwarded-Prefix`:

```
Kong
  → sets X-Forwarded-Host: api.example.com
  → sets X-Forwarded-Proto: https

Top-level Internal ALB (/trading/exchange)
  → appends X-Forwarded-Prefix: /trading/exchange

Service-level Internal ALB (/v1)
  → appends X-Forwarded-Prefix: /trading/exchange, /v1

Container
  → receives X-Forwarded-Host: api.example.com
  → receives X-Forwarded-Prefix: /trading/exchange, /v1
  → resolveUrl builds: //api.example.com/trading/exchange/v1/...
```

Configure each GCP Internal ALB to inject its segment with `replace: false` so segments accumulate across hops.
