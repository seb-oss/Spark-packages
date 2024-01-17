# `@sebspark/openapi-express-router`

A typed router for express based on type definitions from openapi-typegen

## Usage

### Install

```zsh
yarn add @sebspark/openapi-express`
```

or

```zsh
npm install @sebspark/openapi-express`
```

### Generate client type

Use [@sebspark/openapi-typegen](../packages/openapi-typegen)

### Code

```typescript
import express from 'express'
import { TypedRouter } from '@sebspark/openapi-express'
import { MarketdataServer } from './schemas/marketdata'
import { getMarkets, getMarket } from './markets'

const api: MarketdataServer = {
  '/markets': {
    get: {
      handler: async () => {
        const markets = await getMarkets()
        return [200, {data: markets}]
      },
    },
  },
  '/markets/:id': {
    get: {
      handler: async ({ params }) => {
        const market = await getMarket(params.id)
        return [200, {data: market}]
      },
    },
  },
}

const router = TypedRouter(api)
const app = express()
app.use(router)
```

## Example

Example can be found in [@sebspark/openapi-e2e](../packages/openapi-e2e)
