import { randomBytes } from 'node:crypto'
import type { Topic } from '@google-cloud/pubsub'
import { encode } from '@msgpack/msgpack'
import { type ClusterMessage, MessageType } from 'socket.io-adapter'
import type {
  EventNames,
  EventParams,
  EventsMap,
  TypedEventBroadcaster,
} from './typed-events'
import {
  type BroadcastFlags,
  type BroadcastOptions,
  type Message,
  type Packet,
  PacketType,
  RESERVED_EVENTS,
} from './types'

export class BroadcastOperator<EmitEvents extends EventsMap>
  implements TypedEventBroadcaster<EmitEvents>
{
  constructor(
    private readonly topic: Topic,
    private readonly broadcastOptions: BroadcastOptions,
    private readonly rooms: Set<string> = new Set<string>(),
    private readonly exceptRooms: Set<string> = new Set<string>(),
    private readonly flags: BroadcastFlags = {}
  ) {}

  /**
   * Emits to all clients.
   *
   * @return Always true
   * @public
   */
  public emit<Ev extends EventNames<EmitEvents>>(
    ev: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ): true {
    if (RESERVED_EVENTS.has(ev)) {
      throw new Error(`"${ev as string}" is a reserved event name`)
    }
    const uid = randomBytes(8).toString('hex')
    const nsp = this.broadcastOptions.nsp

    // set up packet object
    const data = [ev, ...args]
    const packet: Packet = {
      type: PacketType.EVENT,
      data,
      nsp,
    }

    const opts = {
      rooms: [...this.rooms],
      flags: this.flags,
      except: [...this.exceptRooms],
    }

    const clusterMessage: ClusterMessage = {
      nsp,
      uid,
      type: MessageType.BROADCAST,
      data: {
        packet,
        opts,
      },
    }

    const message: Message = {
      attributes: { nsp, uid },
      data: encode(clusterMessage),
    }

    this.topic.publishMessage(message)

    return true
  }

  /**
   * Targets a room when emitting.
   *
   * @param room
   * @return a new BroadcastOperator instance
   * @public
   */
  public to(room: string | string[]): BroadcastOperator<EmitEvents> {
    const rooms = new Set(this.rooms)
    if (Array.isArray(room)) {
      for (const r of room) {
        rooms.add(r)
      }
    } else {
      rooms.add(room)
    }
    return new BroadcastOperator(
      this.topic,
      this.broadcastOptions,
      rooms,
      this.exceptRooms,
      this.flags
    )
  }

  /**
   * Targets a room when emitting.
   *
   * @param room
   * @return a new BroadcastOperator instance
   * @public
   */
  public in(room: string | string[]): BroadcastOperator<EmitEvents> {
    return this.to(room)
  }

  /**
   * Excludes a room when emitting.
   *
   * @param room
   * @return a new BroadcastOperator instance
   * @public
   */
  public except(room: string | string[]): BroadcastOperator<EmitEvents> {
    const exceptRooms = new Set(this.exceptRooms)
    if (Array.isArray(room)) {
      for (const r of room) {
        exceptRooms.add(r)
      }
    } else {
      exceptRooms.add(room)
    }
    return new BroadcastOperator(
      this.topic,
      this.broadcastOptions,
      this.rooms,
      exceptRooms,
      this.flags
    )
  }

  /**
   * Sets the compress flag.
   *
   * @param compress - if `true`, compresses the sending data
   * @return a new BroadcastOperator instance
   * @public
   */
  public compress(compress: boolean): BroadcastOperator<EmitEvents> {
    const flags = Object.assign({}, this.flags, { compress })
    return new BroadcastOperator(
      this.topic,
      this.broadcastOptions,
      this.rooms,
      this.exceptRooms,
      flags
    )
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
   * receive messages (because of network slowness or other issues, or because they’re connected through long polling
   * and is in the middle of a request-response cycle).
   *
   * @return a new BroadcastOperator instance
   * @public
   */
  public get volatile(): BroadcastOperator<EmitEvents> {
    const flags = Object.assign({}, this.flags, { volatile: true })
    return new BroadcastOperator(
      this.topic,
      this.broadcastOptions,
      this.rooms,
      this.exceptRooms,
      flags
    )
  }
}
