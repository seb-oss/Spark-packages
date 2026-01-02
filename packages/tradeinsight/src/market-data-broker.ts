import { randomUUID } from 'node:crypto'
import { setTimeout as wait } from 'node:timers/promises'
import type {
  CreateSubscriptionOptions,
  Message,
  Subscription,
  Topic,
} from '@google-cloud/pubsub'
import { getLogger, getTracer, SpanStatusCode } from '@sebspark/otel'
import type {
  DefaultEventsMap,
  DisconnectReason,
  ExtendedError,
  Server,
  Socket,
} from 'socket.io'
import {
  type ClientEvents,
  NAMESPACE,
  type NewsItem,
  type Orderbook,
  type Price,
  type ServerEvents,
  type SubscribeMessage,
} from './avro-schemas'

export type BrokerServer<
  CE extends ClientEvents = ClientEvents,
  SE extends ServerEvents = ServerEvents,
  SSE extends DefaultEventsMap = DefaultEventsMap,
  SD extends { jwt: string } = { jwt: string },
> = Server<CE, SE, SSE, SD>
type BrokerNamespace<S extends BrokerServer> = ReturnType<S['of']>
type BrokerSocket<
  CE extends ClientEvents = ClientEvents,
  SE extends ServerEvents = ServerEvents,
  SSE extends DefaultEventsMap = DefaultEventsMap,
  SD extends { jwt: string } = { jwt: string },
> = Socket<CE, SE, SSE, SD>

type ChannelName = keyof ServerEvents
const CHANNELS: ChannelName[] = ['news', 'orderbook', 'price']

interface Channel {
  topic: Topic
  subscribers: Set<string>
  subscription?: Subscription | undefined
  status: 'none' | 'creating' | 'subscribing' | 'pendingDelete' | 'deleting'
  deleteTimeout?: NodeJS.Timeout | undefined
}

// How long a subscription is retained before deleting
const CHANNEL_RETENTION = 20_000

// How old a message is allowed to be before discarding
const EXPIRY_TIME = 5_000

export interface MarketDataBrokerConfig<S extends BrokerServer = BrokerServer> {
  /** Unique identifier for this server instance used in subscription naming */
  id?: string
  /** Socket.io server that pipes GCP PubSub market data to mobile clients */
  server: S
  /** GCP PubSub Topic for price updates */
  priceTopic: Topic
  /** GCP PubSub Topic for orderbook data */
  orderbookTopic: Topic
  /** GCP PubSub Topic for news articles */
  newsTopic: Topic
}

export class MarketDataBroker<S extends BrokerServer = BrokerServer> {
  private readonly id: string
  private readonly namespace: BrokerNamespace<S>
  private readonly channels: Map<ChannelName, Channel>
  private readonly logger: ReturnType<typeof getLogger>
  private readonly tracer: ReturnType<typeof getTracer>

  constructor(config: MarketDataBrokerConfig<S>) {
    this.id = config.id || randomUUID()
    this.namespace = config.server.of(NAMESPACE) as BrokerNamespace<S>
    this.channels = new Map([
      [
        'news',
        { topic: config.newsTopic, subscribers: new Set(), status: 'none' },
      ],
      [
        'orderbook',
        {
          topic: config.orderbookTopic,
          subscribers: new Set(),
          status: 'none',
        },
      ],
      [
        'price',
        { topic: config.priceTopic, subscribers: new Set(), status: 'none' },
      ],
    ])

    this.namespace.use((socket, next) => this.authorize(socket, next))
    this.namespace.on('connect', (socket) => this.onConnect(socket))

    this.logger = getLogger('MarketDataBroker', { id: this.id })
    this.tracer = getTracer('MarketDataBroker')
  }

  //#region Socket handling
  private authorize(socket: BrokerSocket, next: (err?: ExtendedError) => void) {
    const bearer = socket.handshake.headers.authorization
    socket.data.jwt = bearer as string

    // console.log('authorize', socket.id, bearer)

    next()
  }

  private onConnect(socket: BrokerSocket) {
    this.logger.debug('onConnect', { socketId: socket.id })
    socket.on('disconnect', (reason) => this.onDisconnect(socket, reason))
    socket.on('subscribe', (payload) => this.onSubscribe(socket, payload))
  }

  private onDisconnect(socket: BrokerSocket, _reason: DisconnectReason) {
    this.logger.debug('onDisconnect', { socketId: socket.id })
    for (const channel of CHANNELS) {
      this.channels.get(channel)?.subscribers.delete(socket.id)
    }
  }

  private onSubscribe(socket: BrokerSocket, { rooms }: SubscribeMessage) {
    // remove malformed subscriptions
    const filteredRooms = rooms.filter((room) =>
      CHANNELS.some((channel) => room.startsWith(channel))
    )

    if (filteredRooms.join(',') !== rooms.join(',')) {
      this.logger.warn('Malformed rooms detected', {
        socketId: socket.id,
        rooms: rooms,
      })
    }
    this.logger.debug('onSubscribe', {
      socketId: socket.id,
      rooms: filteredRooms,
    })

    const targetSet = new Set(filteredRooms)
    const currentSet = socket.rooms

    // 1. Join new rooms
    for (const room of targetSet) {
      if (!currentSet.has(room)) {
        socket.join(room)
      }
    }

    // 2. Leave rooms not in target set
    for (const room of currentSet) {
      if (room !== socket.id && !targetSet.has(room)) {
        socket.leave(room)
      }
    }

    // 3. Update listener stats
    for (const channelName of CHANNELS) {
      if (filteredRooms.find((r) => r.startsWith(channelName))) {
        this.channels.get(channelName)?.subscribers.add(socket.id)
      } else {
        this.channels.get(channelName)?.subscribers.delete(socket.id)
      }
    }

    this.handleSubscriptions()
  }
  //#endregion

  //#region PubSub Subscriptions handling
  /**
   * Orchestrates the lifecycle of GCP subscriptions based on current subscriber counts
   */
  private async handleSubscriptions() {
    // Iterate over all channels
    for (const channelName of CHANNELS) {
      const channel = this.channels.get(channelName)

      // If no-one is listening and channel has a subscription and no timeout is set
      // then mark for deletion
      if (
        channel?.subscribers.size === 0 &&
        channel.subscription &&
        channel.status === 'subscribing' &&
        !channel.deleteTimeout
      ) {
        channel.status = 'pendingDelete'
        channel.deleteTimeout = setTimeout(
          () => this.deletePubsubSubscription(channel),
          CHANNEL_RETENTION
        )
        continue
      }

      // If channel does not exist but there are listeners, create subscription
      // (unless already in progress)
      if (
        channel?.subscribers.size &&
        !channel.subscription &&
        channel.status !== 'creating'
      ) {
        this.createPubsubSubscription(channel as Channel, channelName)
      }
    }
  }

  /**
   * Creates a unique GCP PubSub subscription for a specific channel
   * @param channel The channel state object
   * @param channelName The type of data (price, news, or orderbook)
   */
  private async createPubsubSubscription(
    channel: Channel,
    channelName: ChannelName
  ) {
    // Clear and remove any timeout
    if (channel.deleteTimeout) {
      clearTimeout(channel.deleteTimeout)
      channel.deleteTimeout = undefined
    }

    // Check if subscription already exists or listeners is 0
    // or creation already in progress
    if (
      channel.subscription ||
      !channel.subscribers.size ||
      channel.status === 'creating'
    ) {
      return
    }

    // Create subscription
    const span = this.tracer.startSpan('createPubsubSubscription')
    try {
      channel.status = 'creating'

      const topicId = channel.topic.name.substring(
        channel.topic.name.lastIndexOf('/') + 1
      )
      const name = `${topicId}_sub_${this.id}`
      const options: CreateSubscriptionOptions = {
        ackDeadlineSeconds: 10,
        enableMessageOrdering: true,
        expirationPolicy: {
          ttl: {
            seconds: 3_600,
          },
        },
        messageRetentionDuration: 600,
      }

      span.setAttributes({ topic: topicId, subscription: name, channelName })

      const [subscription] = await channel.topic.createSubscription(
        name,
        options
      )

      // Handle message
      this.initPubsubSubscription(subscription, channelName)
      // console.log('created subscription and added handler for', channelName)

      channel.subscription = subscription

      channel.status = 'subscribing'
      span.setStatus({ code: SpanStatusCode.OK })
      span.end()
    } catch (err) {
      const error = err as Error
      this.logger.error('Error creating subscription', error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      span.recordException(error)
      span.end()

      await wait(1_000)
      this.logger.info(`Retry creating subscription for ${channelName})`)
      await this.createPubsubSubscription(channel, channelName)
    }
  }

  /**
   * Deletes a GCP PubSub subscription after the retention period expires
   */
  private async deletePubsubSubscription(channel: Channel) {
    if (channel.status === 'deleting') {
      return
    }

    // Clear and remove any timeout
    clearTimeout(channel.deleteTimeout)
    channel.deleteTimeout = undefined

    // Check if subscription is already removed
    if (!channel.subscription) {
      channel.status = 'none'
      return
    }

    // Check if channel has subscribers
    if (channel.subscribers.size) {
      return
    }

    // Delete subscription
    const span = this.tracer.startSpan('deletePubsubSubscription')
    span.setAttribute('subscription', channel.subscription.name)
    try {
      channel.status = 'deleting'
      await channel.subscription.delete()
      channel.subscription = undefined
      channel.status = 'none'
      span.setStatus({ code: SpanStatusCode.OK })
      span.end()
    } catch (err) {
      const error = err as Error
      this.logger.error('Error deleting subscription', error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      span.recordException(error)
      span.end()

      channel.status = 'pendingDelete'
      await wait(1_000)
      this.logger.info('Retry deleting subscription')
      await this.deletePubsubSubscription(channel)
    }
  }
  //#endregion

  //#region Pubsub Message handling
  private initPubsubSubscription(
    subscription: Subscription,
    channelName: ChannelName
  ) {
    subscription.on('message', (message) => {
      message.ack()

      // Check if message is too old
      if (Date.now() - message.publishTime.getTime() > EXPIRY_TIME) {
        this.logger.warn('Message is too old', message)
        return
      }

      try {
        switch (channelName) {
          case 'news': {
            return this.handleNewsMessage(message)
          }
          case 'orderbook': {
            return this.handleOrderbookMessage(message)
          }
          case 'price': {
            return this.handlePriceMessage(message)
          }
        }
      } catch (error) {
        this.logger.error('Error handling message', error as Error)
      }
    })
  }

  /**
   * Encodes and emits price binary data to specific instrument rooms
   * Checks of room has listeners first to avoid unnecessary encoding
   */
  private handlePriceMessage(message: Message) {
    const priceOrPrices = JSON.parse(message.data.toString('utf8')) as
      | Price
      | Price[]
    const prices = Array.isArray(priceOrPrices)
      ? priceOrPrices
      : [priceOrPrices]

    for (const price of prices) {
      const roomName = `price_${price.id}`
      const room = this.namespace.adapter.rooms.get(roomName)
      if (!room?.size) {
        continue
      }

      this.namespace.to(roomName).emit('price', price)
    }
  }

  /**
   * Encodes and emits orderbook binary data to specific instrument rooms
   * Checks of room has listeners first to avoid unnecessary encoding
   */
  private handleOrderbookMessage(message: Message) {
    const orderbookOrOrderBooks = JSON.parse(message.data.toString('utf8')) as
      | Orderbook
      | Orderbook[]
    const orderbooks = Array.isArray(orderbookOrOrderBooks)
      ? orderbookOrOrderBooks
      : [orderbookOrOrderBooks]

    for (const orderbook of orderbooks) {
      const roomName = `orderbook_${orderbook.id}`
      const room = this.namespace.adapter.rooms.get(roomName)
      if (!room?.size) {
        continue
      }

      this.namespace.to(roomName).emit('orderbook', orderbook)
    }
  }

  /**
   * Encodes and emits news binary data to global and instrument-specific rooms
   * Checks of room has listeners first to avoid unnecessary encoding
   */
  private handleNewsMessage(message: Message) {
    const newsMessageOrNewsMessages = JSON.parse(
      message.data.toString('utf8')
    ) as NewsItem | NewsItem[]
    const newsMessages = Array.isArray(newsMessageOrNewsMessages)
      ? newsMessageOrNewsMessages
      : [newsMessageOrNewsMessages]

    for (const news of newsMessages) {
      const roomNames = [
        'news_all',
        ...(news.instruments || []).map((ins) => `news_${ins}`),
      ]

      // If any listener is present, encode and send message
      let anyListeners = false
      for (const roomName of roomNames) {
        if (this.namespace.adapter.rooms.get(roomName)?.size) {
          anyListeners = true
          break
        }
      }
      if (!anyListeners) {
        continue
      }

      for (const roomName of roomNames) {
        this.namespace.to(roomName).emit('news', news)
      }
    }
  }
  //#endregion

  async close() {
    this.namespace.disconnectSockets()
    const deletions = Array.from(this.channels.values())
      .map((c) => c.subscription?.delete())
      .filter(Boolean)
    await Promise.all(deletions)
  }
}
