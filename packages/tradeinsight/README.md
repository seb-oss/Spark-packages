# `@sebspark/tradeinsight`

TradeInsight client library with helpers for creating/parsing instrument IDs and consuming market data feeds.

## Utils

### Create ID

```typescript
import { createStockId } from '@sebspark/tradeinsight/utils'

const isin = 'SE0000108656'
const mic = 'XSTO'
const currency = 'SEK'
const id = createStockId({ isin, mic, currency })

console.log(id)
// STO_SE0000108656_XSTO_SEK
```

### Parse ID

```typescript
import { parseId } from '@sebspark/tradeinsight/utils'

const { type, fromCurrency, toCurrency } = parseId('FXS_USD_EUR')
console.log(type, fromCurrency, toCurrency)
// FXS, USD, EUR
```

## TradeInsight OpenAPI Client

```typescript
import type { TradeinsightV2Client } from '@sebspark/tradeinsight/openapi'
import { TypedClient } from '@sebspark/openapi-client'

const host = process.env.TRADE_INSIGHT_HOST as string

const client = TypedClient<TradeinsightV2Client>(host)
const instrument = await client.get('/instruments/:id', { params: { id: 'STO_SE0000108656_XSTO_SEK' } })
```

## Market data broker (server)

This broker will handle all subscription requests and listen for events on TradeInsights market data topics and pipe them to the interested parties.

```typescript
import { createServer } from 'node:http'
import { PubSub } from '@google-cloud/pubsub'
import { createParser } from '@sebspark/socket.io-avro/parser'
import { type BrokerServer, MarketDataBroker } from '@sebspark/tradeinsight/broker'
import { allSchemas } from '@sebspark/tradeinsight/avro'
import { Server } from 'socket.io'

const httpServer = createServer()
const parser = createAvroParser(allSchemas)
const server = new Server(httpServer, { parser }) as BrokerServer

const pubsub = new PubSub()
const newsTopic = pubsub.topic('marketdata-news')
const priceTopic = pubsub.topic('marketdata-prices')
const orderbookTopic = pubsub.topic('marketdata-orderbooks')

const broker = new MarketDataBroker({
  server,
  newsTopic,
  orderbookTopic,
  priceTopic,
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

```typescript
import { createParser } from '@sebspark/socket.io-avro/parser'
import { allSchemas } from '@sebspark/tradeinsight/avro'
import { MarketDataSubscriber } from '@sebspark/tradeinsight/subscriber'

const parser = createAvroParser(allSchemas)

const access_token = 'access_token'
const uri = process.env.GATEWAY_URL
const subscriber = new MarketDataSubscriber(uri, {
  extraHeaders: { Authorization: `Bearer ${access_token}` },
  parser,
})

// Listen for events
subscriber.on('news', (news) => {
  console.log(news)
})
subscriber.on('orderbook', (orderbook) => {
  console.log(orderbook)
})
subscriber.on('price', (price) => {
  console.log(price)
})

// Subscribe
subscriber.subscribeToPrices(['STO_SE0000108656_XSTO_SEK']) // replaces prior price subscriptions
subscriber.subscribeToOrderbooks(['STO_SE0000108656_XSTO_SEK'])// replaces prior orderbook subscriptions
subscriber.subscribeToNews(['STO_SE0000108656_XSTO_SEK'])// replaces prior news subscriptions
subscriber.subscribeToNews(['all'])// replaces prior news subscriptions

console.log(subscriber.subscriptions)
// [ 'price_STO_SE0000108656_XSTO_SEK', 'orderbook_STO_SE0000108656_XSTO_SEK', 'news_all' ]
```
