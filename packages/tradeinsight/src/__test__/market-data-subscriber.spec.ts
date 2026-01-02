import { EventEmitter } from 'node:events'
import { createAvroParser } from '@sebspark/socket.io-avro/parser'
import { io, type Socket } from 'socket.io-client'
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest'
import { MarketDataSubscriber } from '../market-data-subscriber'

vi.mock('socket.io-client', () => {
  const socket = new EventEmitter() as any
  socket.close = vi.fn()
  const io = vi.fn().mockReturnValue(socket)

  return { io }
})

describe('TradeInsightSocketClient', () => {
  let subscriber: MarketDataSubscriber
  let socket: Mocked<Socket>
  beforeEach(() => {
    socket = io() as Mocked<Socket>
    subscriber = new MarketDataSubscriber('http://localhost', {
      parser: createAvroParser([]),
    })
  })
  describe('subscribe', () => {
    it('sets instrument price subscriptions', async () => {
      subscriber.subscribeToPrices(['a', 'b'])

      expect(subscriber.subscriptions).toEqual(['price_a', 'price_b'])
    })
    it('overwrites instrument price subscriptions', async () => {
      subscriber.subscribeToPrices(['a', 'b'])
      subscriber.subscribeToPrices(['b', 'c'])

      expect(subscriber.subscriptions).toEqual(['price_b', 'price_c'])
    })
    it('sets instrument orderbook subscriptions', async () => {
      subscriber.subscribeToOrderbooks(['a', 'b'])

      expect(subscriber.subscriptions).toEqual(['orderbook_a', 'orderbook_b'])
    })
    it('overwrites instrument orderbook subscriptions', async () => {
      subscriber.subscribeToOrderbooks(['a', 'b'])
      subscriber.subscribeToOrderbooks(['b', 'c'])

      expect(subscriber.subscriptions).toEqual(['orderbook_b', 'orderbook_c'])
    })
    it('sets instrument news subscriptions', async () => {
      subscriber.subscribeToNews(['a', 'b'])

      expect(subscriber.subscriptions).toEqual(['news_a', 'news_b'])
    })
    it('overwrites instrument news subscriptions', async () => {
      subscriber.subscribeToNews(['a', 'b'])
      subscriber.subscribeToNews(['b', 'c'])

      expect(subscriber.subscriptions).toEqual(['news_b', 'news_c'])
    })
  })
})
