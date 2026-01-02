import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from 'socket.io-client'
import { type ClientEvents, NAMESPACE, type ServerEvents } from './avro-schemas'

type BrokerSocket = Socket<ServerEvents, ClientEvents>
interface TypedListener<Events> {
  on<K extends keyof Events>(event: K, listener: Events[K]): this
  off<K extends keyof Events>(event: K, listener: Events[K]): this
  once<K extends keyof Events>(event: K, listener: Events[K]): this
  removeListener<K extends keyof Events>(event: K, listener: Events[K]): this
  removeAllListeners(event?: keyof Events): this
}

type BrokerOptions = Partial<ManagerOptions & SocketOptions> &
  Pick<ManagerOptions, 'parser'>

export class MarketDataSubscriber implements TypedListener<ServerEvents> {
  /** Underlying Socket.io client instance */
  private readonly socket: BrokerSocket
  /** Active price feed instrument identifiers */
  private priceSubscriptions = new Set<string>()
  /** Active orderbook feed instrument identifiers */
  private orderbookSubscriptions = new Set<string>()
  /** Active news feed instrument identifiers */
  private newsSubscriptions = new Set<string>()

  constructor(uri: string, opts: BrokerOptions) {
    this.socket = io(`${uri}/${NAMESPACE}`, opts)
  }

  //#region Subscriptions

  /**
   * Updates price subscriptions and notifies the server
   * @param ids Array of instrument identifiers
   */
  async subscribeToPrices(ids: string[]): Promise<void> {
    this.priceSubscriptions = new Set(ids)
    this.socket.emit('subscribe', { rooms: this.subscriptions })
  }

  /**
   * Updates orderbook subscriptions and notifies the server
   * @param ids Array of instrument identifiers
   */
  async subscribeToOrderbooks(ids: string[]): Promise<void> {
    this.orderbookSubscriptions = new Set(ids)
    this.socket.emit('subscribe', { rooms: this.subscriptions })
  }

  /**
   * Updates news subscriptions and notifies the server
   * @param ids Array of instrument identifiers
   */
  async subscribeToNews(ids: string[]): Promise<void> {
    this.newsSubscriptions = new Set(ids)
    this.socket.emit('subscribe', { rooms: this.subscriptions })
  }

  /**
   * Computes the full list of room names based on current subscription sets
   * @returns Formatted room strings (e.g., "price_AAPL")
   */
  get subscriptions(): string[] {
    return [
      ...Array.from(this.priceSubscriptions, (id) => `price_${id}`),
      ...Array.from(this.orderbookSubscriptions, (id) => `orderbook_${id}`),
      ...Array.from(this.newsSubscriptions, (id) => `news_${id}`),
    ]
  }
  //#endregion

  //#region EventEmitter
  on<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]) {
    // biome-ignore lint/suspicious/noExplicitAny: Unstable union
    this.socket.on(event, listener as any)
    return this
  }

  off<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]) {
    // biome-ignore lint/suspicious/noExplicitAny: Unstable union
    this.socket.off(event, listener as any)
    return this
  }

  once<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]) {
    // biome-ignore lint/suspicious/noExplicitAny: Unstable union
    this.socket.once(event, listener as any)
    return this
  }

  removeListener<K extends keyof ServerEvents>(
    event: K,
    listener: ServerEvents[K]
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: Unstable union
    this.socket.removeListener(event, listener as any)
    return this
  }

  removeAllListeners<K extends keyof ServerEvents>(event?: K) {
    this.socket.removeAllListeners(event)
    return this
  }
  //#endregion
}
