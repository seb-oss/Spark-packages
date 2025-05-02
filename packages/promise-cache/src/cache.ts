import { deserialize, serialize } from './serializer'
import { toSetOptions } from './setOptions'
import type { Cache, CachingOptions, IPersistor } from './types'

/**
 * Creates a cache instance using a given persistor.
 * @param {IPersistor} persistor - The underlying storage for caching.
 * @param {string?} prefix - An optional prefix that will be prepended to the key, formatted as `prefix:key`.
 * @returns {Cache} A cache instance.
 */
export const createCache = (persistor: IPersistor, prefix?: string): Cache => {
  // Tracks in-progress requests to prevent duplicate calls
  const pendingPromises = new Map<string, Promise<unknown>>()

  const cache: Cache = {
    persistor,
    wrap: <A extends unknown[], R>(
      delegate: (...args: A) => Promise<R>,
      options: CachingOptions<A, R>
    ): ((...args: A) => Promise<R>) => {
      return async (...args: A): Promise<R> => {
        // Compute key
        let key =
          typeof options.key === 'string' ? options.key : options.key(...args)

        // Apply prefix if provided
        if (prefix) {
          key = `${prefix}:${key}`
        }

        // Return the pending request if one exists
        if (pendingPromises.has(key)) {
          return pendingPromises.get(key) as R
        }

        // Create a new promise to prevent duplicate processing
        const resultPromise = (async () => {
          try {
            // Ensure persistor is connected and ready
            await ensurePersistorIsReady(persistor)

            // Check cache
            const cached = deserialize<R>(await persistor.get(key))
            if (cached !== null) {
              return cached
            }

            // No cached value
            const result = await delegate(...args)

            // Calculate expiry
            const expiry =
              typeof options.expiry === 'function'
                ? options.expiry(args, result)
                : options.expiry

            // Ensure persistor is still connected and ready
            await ensurePersistorIsReady(persistor)

            // Save to cache
            const serialized = serialize(result)
            const setOptions = toSetOptions(expiry)
            await persistor.set(key, serialized, setOptions)

            // Return result
            return result
          } finally {
            pendingPromises.delete(key)
          }
        })()

        // Store promise until it resolves or fails
        pendingPromises.set(key, resultPromise)

        return resultPromise
      }
    },
  }
  return cache
}

const ensurePersistorIsReady = async (persistor: IPersistor) => {
  // Persistor is connected and ready
  if (persistor.isReady) {
    return
  }

  // Persistor is connecting but not ready
  if (persistor.isOpen) {
    await new Promise<void>((resolve) => {
      if (persistor.isReady) return resolve()
      persistor.once('ready', resolve)
      return
    })
  }

  // Persistor should connect
  try {
    await persistor.connect()
  } catch (err) {
    if ((err as Error).message === 'Socket already opened') {
      // Connection is already in progress
      await new Promise<void>((resolve) => {
        if (persistor.isReady) return resolve()
        persistor.once('ready', resolve)
      })
    }
  }
}
