# `@sebspark/openapi-client`

A typed REST client for the definitions from openapi-typegen

## Usage

### Install

```zsh
yarn add @sebspark/openapi-client`
```

or

```zsh
npm install @sebspark/openapi-client`
```

### Generate client type

Use [@sebspark/openapi-typegen](../packages/openapi-typegen)

### Code

```typescript
import { TypedClient } from '@sebspark/openapi-client'
import { MarketdataClient } from './schemas/marketdata'

const client = TypedClient<MarketdataClient>(`https://example.com/api`)
const {data} = await client.get('/markets')
```

## Example

Example can be found in [@sebspark/openapi-e2e](../packages/openapi-e2e)
