import type { Socket } from 'socket.io'
import type { EventEmitter } from 'node:events'

declare module 'socketio-wildcard' {
  /**
   * Returns a middleware function to allow wildcard event listeners
   */
  function wildcard(emitterCtor?: {
    prototype: typeof EventEmitter.prototype
    // biome-ignore lint/suspicious/noExplicitAny: Defined in external package
  }): (socket: Socket, next?: (err?: any) => void) => void

  export default wildcard
}
