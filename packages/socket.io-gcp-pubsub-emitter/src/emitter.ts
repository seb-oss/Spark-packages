import type { Topic } from '@google-cloud/pubsub'
import { BroadcastOperator } from './operator.js'
import type {
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap,
} from './typed-events.js'
import type { BroadcastOptions, EmitterOptions } from './types.js'

export class Emitter<EmitEvents extends EventsMap = DefaultEventsMap> {
  private readonly opts: EmitterOptions
  private readonly broadcastOptions: BroadcastOptions

  constructor(
    readonly topic: Topic,
    opts?: EmitterOptions,
    readonly nsp: string = '/'
  ) {
    this.opts = opts || {}
    this.broadcastOptions = {
      nsp,
    }
  }

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
    return new BroadcastOperator<EmitEvents>(
      this.topic,
      this.broadcastOptions
    ).emit(ev, ...args)
  }

  /**
   * Return a new emitter for the given namespace.
   *
   * @param nsp - namespace
   * @public
   */
  public of(nsp: string): Emitter<EmitEvents> {
    return new Emitter(this.topic, this.opts, (nsp[0] !== '/' ? '/' : '') + nsp)
  }

  /**
   * Targets a room when emitting.
   *
   * @param room
   * @return BroadcastOperator
   * @public
   */
  public to(room: string | string[]): BroadcastOperator<EmitEvents> {
    return new BroadcastOperator(this.topic, this.broadcastOptions).to(room)
  }

  /**
   * Targets a room when emitting.
   *
   * @param room
   * @return BroadcastOperator
   * @public
   */
  public in(room: string | string[]): BroadcastOperator<EmitEvents> {
    return new BroadcastOperator(this.topic, this.broadcastOptions).in(room)
  }

  /**
   * Excludes a room when emitting.
   *
   * @param room
   * @return BroadcastOperator
   * @public
   */
  public except(room: string | string[]): BroadcastOperator<EmitEvents> {
    return new BroadcastOperator(this.topic, this.broadcastOptions).except(room)
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
   * receive messages (because of network slowness or other issues, or because they’re connected through long polling
   * and is in the middle of a request-response cycle).
   *
   * @return BroadcastOperator
   * @public
   */
  public get volatile(): BroadcastOperator<EmitEvents> {
    return new BroadcastOperator(this.topic, this.broadcastOptions).volatile
  }

  /**
   * Sets the compress flag.
   *
   * @param compress - if `true`, compresses the sending data
   * @return BroadcastOperator
   * @public
   */
  public compress(compress: boolean): BroadcastOperator<EmitEvents> {
    return new BroadcastOperator(this.topic, this.broadcastOptions).compress(
      compress
    )
  }
}
