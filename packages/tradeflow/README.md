# `@sebspark/tradeflow`

TradeFlow client library with helpers for consuming the API and managing socket updates

## TradeFlow OpenAPI Client

This requires installation of peer dependencies:

```zsh
yarn add -E @sebspark/openapi-client
```

```typescript
import type { TradeflowClient } from '@sebspark/tradeflow/openapi'
import { TypedClient } from '@sebspark/openapi-client'

const host = process.env.TRADE_FLOW_HOST as string

const client = TypedClient<TradeflowClient>(host)
const orders = await client.get('/private/orders')
```

## Market data broker (server)

This requires installation of peer dependencies:

```zsh
yarn add -E @google-cloud/pubsub socket.io
```

This broker will handle all subscription requests and listen for events on TradeFlows order topic and pipe them to the interested parties.

```typescript
import { createServer } from 'node:http'
import { PubSub } from '@google-cloud/pubsub'
import { createParser } from '@sebspark/socket.io-avro/parser'
import { type BrokerServer, OrderBroker } from '@sebspark/tradeflow/broker'
import { Ca3Client } from '@sebspark/tradeflow/ca3'
import { allSchemas } from '@sebspark/tradeflow/avro'
import { Server } from 'socket.io'

const httpServer = createServer()
const parser = createAvroParser(allSchemas)
const server = new Server(httpServer, { parser }) as BrokerServer

const pubsub = new PubSub()
const topic = pubsub.topic('orders')

const ca3host = process.env.CA3_HOST as string
const ca3Client = new Ca3Client({ url: ca3host })

// secret for peppering customer- and account numbers
const secret = process.env.PEPPER_SECRET as string

const broker = new MarketDataBroker({
  server,
  topic,
  ca3Client,
  secret,
})

process.on('SIGTERM', async () => {
  try {
    // This disconnects sockets and triggers deletion of GCP subscriptions
    await broker.close()
    // This closes the underlying socket
    await server.close()
    process.exit(0)
  } catch (err) {
    console.error('Error during broker shutdown', err)
    process.exit(1)
  }
})
```

## Market data subscriber (client)

This requires installation of peer dependencies:

```zsh
yarn add -E socket.io-client
```

```typescript
import { createParser } from '@sebspark/socket.io-avro/parser'
import { allSchemas } from '@sebspark/tradeflow/avro'
import { OrderSubscriber } from '@sebspark/tradeflow/subscriber'

const parser = createAvroParser(allSchemas)

const access_token = 'access_token'
const uri = process.env.GATEWAY_URL
const subscriber = new OrderSubscriber(uri, {
  extraHeaders: { Authorization: `Bearer ${access_token}` },
  parser,
})

// Listen for events
subscriber.on('order', (order) => {
  console.log(order)
})
```
