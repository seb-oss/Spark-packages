import { createServer, type Server as HttpServer } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import { PubSub, type Topic } from '@google-cloud/pubsub'
import { createAvroParser } from '@sebspark/socket.io-avro/parser'
import {
  PubSubEmulatorContainer,
  type StartedPubSubEmulatorContainer,
} from '@testcontainers/gcloud'
import { findFreePorts } from 'find-free-ports'
import * as gax from 'google-gax'
import { Server } from 'socket.io'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrokerServer, MarketDataBroker } from '../market-data-broker'
import { MarketDataSubscriber } from '../market-data-subscriber'
import {
  allSchemas,
  type NewsItem,
  type Orderbook,
  type Price,
} from '../schemas'
import { ensureTopic } from './helper'

describe('TradeInsight socket service', () => {
  let pubsubEmulator: StartedPubSubEmulatorContainer
  let pubsub: PubSub

  let priceTopic: Topic
  let orderbookTopic: Topic
  let newsTopic: Topic

  let httpServer: HttpServer

  let server: BrokerServer
  let broker: MarketDataBroker
  let subscriber: MarketDataSubscriber

  beforeEach(async () => {
    // Start PubSub emulator
    pubsubEmulator = await new PubSubEmulatorContainer(
      'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators'
    )
      .withReuse()
      .start()
    const projectId = pubsubEmulator.getProjectId()
    pubsub = new PubSub({
      projectId,
      apiEndpoint: pubsubEmulator.getEmulatorEndpoint(),
      sslCreds: gax.grpc.credentials.createInsecure(),
      authClient: {
        getAccessToken: async () => ({ token: 'dummy', res: {} }) as any,
        getRequestHeaders: async () => ({}) as any,
      } as any,
    })

    // Topics
    priceTopic = await ensureTopic(pubsub, 'price')
    orderbookTopic = await ensureTopic(pubsub, 'orderbook')
    newsTopic = await ensureTopic(pubsub, 'news')

    // Start http server
    const [port] = await findFreePorts()
    httpServer = await createServer()
    await new Promise<void>((resolve) => httpServer.listen(port, resolve))

    // Create parser
    const parser = createAvroParser(allSchemas)

    // Start server and client
    server = new Server(httpServer, { parser })
    broker = new MarketDataBroker({
      server,
      newsTopic,
      orderbookTopic,
      priceTopic,
    })

    const access_token = 'access_token'
    subscriber = new MarketDataSubscriber(`http://localhost:${port}`, {
      extraHeaders: { Authorization: `Bearer ${access_token}` },
      parser,
    })
  }, 120_000)
  afterEach(async () => {
    await broker.close()
    await server.close()
    httpServer.close()

    await priceTopic.delete()
    await orderbookTopic.delete()
    await newsTopic.delete()

    await pubsubEmulator.stop()
  })
  it('receives price updates for subscribed instruments', async () => {
    const listener = vi.fn()
    subscriber.on('price', listener)
    await subscriber.subscribeToPrices(['a'])
    await setTimeout(100)

    const price: Price = {
      id: 'a',
      last: { value: 10, currency: 'SEK' },
      conversions: null,
    }

    await priceTopic.publishMessage({ json: [price] })
    await setTimeout(100)

    expect(listener).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(price)
  })
  it('does not receive price updates for non subscribed instruments', async () => {
    const listener = vi.fn()
    subscriber.on('price', listener)
    await subscriber.subscribeToPrices(['a'])
    await setTimeout(100)

    const price: Price = {
      id: 'b',
      last: { value: 10, currency: 'SEK' },
      conversions: null,
    }

    await priceTopic.publishMessage({ json: [price] })
    await setTimeout(100)

    expect(listener).not.toHaveBeenCalled()
  })
  it('subscribes exactly to the submitted list of instruments', async () => {
    const listener = vi.fn()
    subscriber.on('price', listener)
    await subscriber.subscribeToPrices(['a', 'c'])
    await setTimeout(100)
    await subscriber.subscribeToPrices(['b', 'c'])
    await setTimeout(100)

    const priceA: Price = {
      id: 'a',
      last: { value: 10, currency: 'SEK' },
      conversions: null,
    }
    const priceB: Price = {
      id: 'b',
      last: { value: 10, currency: 'SEK' },
      conversions: null,
    }
    const priceC: Price = {
      id: 'c',
      last: { value: 10, currency: 'SEK' },
      conversions: null,
    }
    await priceTopic.publishMessage({ json: [priceA, priceB, priceC] })
    await setTimeout(100)

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledWith(priceB)
    expect(listener).toHaveBeenCalledWith(priceC)
  })
  it('receives orderbooks for subscribed instruments', async () => {
    const listener = vi.fn()
    subscriber.on('orderbook', listener)
    await subscriber.subscribeToOrderbooks(['a'])
    await setTimeout(100)

    const orderbook: Orderbook = {
      id: 'a',
      asks: [{ level: 1, price: 10, orders: 5, volume: 50 }],
      bids: [],
    }

    await orderbookTopic.publishMessage({ json: [orderbook] })
    await setTimeout(100)

    expect(listener).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(orderbook)
  })
  it('receives news for subscribed instruments', async () => {
    const listener = vi.fn()
    subscriber.on('news', listener)
    await subscriber.subscribeToNews(['a'])
    await setTimeout(100)

    const news: NewsItem = {
      id: '1',
      instruments: ['a'],
      headline: 'Headline',
      feed: 1,
      date: Date.now(),
      industry: null,
      category: null,
      categories: null,
      body: null,
      type: null,
      gics: null,
      icb: null,
    }

    await newsTopic.publishMessage({ json: [news] })
    await setTimeout(100)

    expect(listener).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(news)
  })
  it('receives news for general subscription', async () => {
    const listener = vi.fn()
    subscriber.on('news', listener)
    await subscriber.subscribeToNews(['all'])
    await setTimeout(100)

    const news: NewsItem = {
      id: '1',
      instruments: ['a'],
      headline: 'Headline',
      feed: 1,
      date: Date.now(),
      industry: null,
      category: null,
      categories: null,
      body: null,
      type: null,
      gics: null,
      icb: null,
    }

    await newsTopic.publishMessage({ json: [news] })
    await setTimeout(100)

    expect(listener).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(news)
  })
})
