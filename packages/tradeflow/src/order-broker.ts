import { randomUUID } from 'node:crypto'
import { setTimeout as wait } from 'node:timers/promises'
import type {
  CreateSubscriptionOptions,
  Subscription,
  Topic,
} from '@google-cloud/pubsub'
import { UnauthorizedError } from '@sebspark/openapi-core'
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
  type Order,
  type ServerEvents,
} from './avro-schemas'
import type { Ca3Client } from './ca3-client'
import { decode, pepper } from './utils'

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

// How old a message is allowed to be before discarding
const EXPIRY_TIME = 5_000

export interface OrderBrokerConfig<S extends BrokerServer = BrokerServer> {
  /** Unique identifier for this server instance used in subscription naming */
  id?: string
  /** Socket.io server that pipes GCP PubSub market data to mobile clients */
  server: S
  /** GCP PubSub Topic for order updates */
  topic: Topic
  /** Client for getting user accounts from CA3 */
  ca3Client: Ca3Client
  /** Secret for peppering */
  secret: string
}

export class OrderBroker<S extends BrokerServer = BrokerServer> {
  private readonly id: string
  private readonly secret: string
  private readonly namespace: BrokerNamespace<S>
  private readonly topic: Topic
  private readonly subscription: Promise<Subscription>
  private readonly ca3Client: Ca3Client
  private readonly logger: ReturnType<typeof getLogger>
  private readonly tracer: ReturnType<typeof getTracer>

  private status: 'starting' | 'running' | 'shutting-down' = 'starting'

  constructor(config: OrderBrokerConfig<S>) {
    this.id = config.id || randomUUID()

    this.logger = getLogger('OrderBroker', { id: this.id })
    this.tracer = getTracer('OrderBroker')

    this.secret = config.secret
    this.namespace = config.server.of(NAMESPACE) as BrokerNamespace<S>
    this.topic = config.topic
    this.subscription = this.createPubsubSubscription()
    this.ca3Client = config.ca3Client

    this.namespace.use((socket, next) => this.authorize(socket, next))
    this.namespace.on('connect', (socket) => this.onConnect(socket))
  }

  //#region Socket handling
  private async authorize(
    socket: BrokerSocket,
    next: (err?: ExtendedError) => void
  ) {
    const span = this.tracer.startSpan('authorize')
    const bearer = socket.handshake.headers.authorization

    if (!bearer || !bearer.startsWith('Bearer ')) {
      this.logger.error('Unauthorized')
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unauthorized' })
      span.end()
      return next(new UnauthorizedError())
    }

    const jwt = (bearer as string).replace('Bearer ', '')

    try {
      const accountNumbers = await this.ca3Client.getAccountNumbers(jwt)
      socket.data.jwt = jwt
      const { customerNumber } = decode(jwt)

      // Join customer number room
      socket.join(pepper(customerNumber, this.secret))

      // Join account number rooms
      for (const accountNumber of accountNumbers) {
        socket.join(pepper(accountNumber, this.secret))
      }

      span.setStatus({ code: SpanStatusCode.OK })
      span.end()
      return next()
    } catch (err) {
      const error = err as Error
      this.logger.error('Authorization failed', error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      span.recordException(error)
      span.end()
      return next(error)
    }
  }

  private onConnect(socket: BrokerSocket) {
    this.logger.debug('onConnect', { socketId: socket.id })
    socket.on('disconnect', (reason) => this.onDisconnect(socket, reason))
  }

  private onDisconnect(socket: BrokerSocket, _reason: DisconnectReason) {
    this.logger.debug('onDisconnect', { socketId: socket.id })
  }
  //#endregion

  //#region PubSub Subscriptions handling
  /**
   * Creates a unique GCP PubSub subscription for a specific channel
   * @param channel The channel state object
   * @param channelName The type of data (price, news, or orderbook)
   */
  private async createPubsubSubscription(): Promise<Subscription> {
    const span = this.tracer.startSpan('createPubsubSubscription')
    try {
      const topicId = this.topic.name.substring(
        this.topic.name.lastIndexOf('/') + 1
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

      span.setAttributes({ topic: topicId, subscription: name })

      const [subscription] = await this.topic.createSubscription(name, options)

      // Handle message
      subscription.on('message', (message) => {
        message.ack()

        // Check if message is too old
        if (Date.now() - message.publishTime.getTime() > EXPIRY_TIME) {
          this.logger.warn('Message is too old', message)
          return
        }

        const order = JSON.parse(message.data.toString('utf8')) as Order

        const roomName = pepper(order.accountId, this.secret)
        const room = this.namespace.adapter.rooms.get(roomName)

        // If no-one is listening, don't bother serializing
        if (!room?.size) {
          return
        }

        // Send to sockets
        this.namespace.to(roomName).emit('order', order)
      })
      // console.log('created subscription and added handler for', channelName)
      span.setStatus({ code: SpanStatusCode.OK })
      span.end()

      this.status = 'running'

      return subscription
    } catch (err) {
      const error = err as Error
      this.logger.error('Error creating subscription', error)
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
      span.recordException(error)
      span.end()

      if (this.status === 'starting') {
        await wait(1_000)
        this.logger.info('Retry creating subscription')
        return this.createPubsubSubscription()
      } else {
        throw err
      }
    }
  }
  //#endregion

  async close() {
    this.status = 'shutting-down'
    this.namespace.disconnectSockets()
    await this.subscription
      .then((s) => s.delete())
      .catch((err) =>
        this.logger.error('Error deleting subscription', err as Error)
      )
  }
}
