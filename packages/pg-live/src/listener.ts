import { setTimeout } from 'node:timers/promises'
import { Client } from 'pg'
import { quoteIdent } from './table'

export type Subscriber = {
  onNotify: (payload: string) => void
  /** Called after a lost connection is back and listening again. */
  onReconnect: () => void
}

export type Listener = {
  /** Listens on `channel` until the returned function is called. */
  listen: (
    channel: string,
    subscriber: Subscriber
  ) => Promise<() => Promise<void>>
  /** Stops listening and releases the connection. */
  close: () => Promise<void>
}

const MAX_RETRY_DELAY_MS = 5000

/**
 * One dedicated connection per process for `LISTEN`, shared by every live
 * table and channel.
 */
export const createListener = ({
  connectionString,
}: {
  connectionString: string
}): Listener => {
  const channels = new Map<string, Set<Subscriber>>()
  const subscribers = () => [...channels.values()].flatMap((set) => [...set])
  let client: Promise<Client> | undefined
  let closed = false

  const connect = async (): Promise<Client> => {
    const connection = new Client({ connectionString })
    connection.on('notification', ({ channel, payload = '' }) => {
      for (const subscriber of channels.get(channel) ?? []) {
        subscriber.onNotify(payload)
      }
    })
    // A lost connection is recovered by reconnecting, so it is not reported
    connection.on('error', () => lost(connection))
    connection.on('end', () => lost(connection))
    await connection.connect()
    for (const channel of channels.keys()) {
      await connection.query(`LISTEN ${quoteIdent(channel)}`)
    }
    return connection
  }

  let current: Client | undefined
  const connected = () => {
    client ??= connect().then((connection) => {
      current = connection
      return connection
    })
    return client
  }

  const lost = async (connection: Client) => {
    if (closed || connection !== current) return
    current = undefined
    client = undefined

    for (
      let delay = 100;
      !closed;
      delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS)
    ) {
      try {
        await connected()
        for (const subscriber of subscribers()) subscriber.onReconnect()
        return
      } catch {
        client = undefined
        await setTimeout(delay)
      }
    }
  }

  const listen = async (channel: string, subscriber: Subscriber) => {
    const listeners = channels.get(channel) ?? new Set()
    listeners.add(subscriber)
    channels.set(channel, listeners)
    await (await connected()).query(`LISTEN ${quoteIdent(channel)}`)

    return async () => {
      listeners.delete(subscriber)
      if (listeners.size > 0 || closed) return
      channels.delete(channel)
      await current?.query(`UNLISTEN ${quoteIdent(channel)}`)
    }
  }

  const close = async () => {
    if (closed) return
    closed = true
    channels.clear()
    await (await client?.catch(() => undefined))?.end()
  }

  return { listen, close }
}
