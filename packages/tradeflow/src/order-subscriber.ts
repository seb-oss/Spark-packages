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

export class OrderSubscriber implements TypedListener<ServerEvents> {
  /** Underlying Socket.io client instance */
  private readonly socket: BrokerSocket

  constructor(uri: string, opts: BrokerOptions) {
    this.socket = io(`${uri}/${NAMESPACE}`, opts)
  }

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
}
