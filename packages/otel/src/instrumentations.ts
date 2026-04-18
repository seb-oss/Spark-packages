import type {
  Instrumentation,
  InstrumentationConfig,
} from '@opentelemetry/instrumentation'
import type { DnsInstrumentationConfig } from '@opentelemetry/instrumentation-dns'
import type { ExpressInstrumentationConfig } from '@opentelemetry/instrumentation-express'
import type { FsInstrumentationConfig } from '@opentelemetry/instrumentation-fs'
import type { GrpcInstrumentationConfig } from '@opentelemetry/instrumentation-grpc'
import type { RedisInstrumentationConfig } from '@opentelemetry/instrumentation-redis'
import type { SocketIoInstrumentationConfig } from '@opentelemetry/instrumentation-socket.io'
import type { OpenSearchInstrumentationConfig } from '@sebspark/opentelemetry-instrumentation-opensearch'
import {
  buildHttpConfig,
  buildUndiciConfig,
  type OutgoingHttpEnrichmentConfig,
} from './enrichments/outgoing-http'

const cache = new Map<string, Promise<Instrumentation>>()
const cacheKey = (
  instrumentationName: string,
  config?: InstrumentationConfig
) => {
  return config
    ? `${instrumentationName}:${JSON.stringify(config)}`
    : instrumentationName
}

export const instrumentations = {
  http(config?: OutgoingHttpEnrichmentConfig) {
    const key = cacheKey('http', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-http').then(
          ({ HttpInstrumentation }) =>
            new HttpInstrumentation(buildHttpConfig(config))
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  express(config?: ExpressInstrumentationConfig) {
    const key = cacheKey('express', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-express').then(
          ({ ExpressInstrumentation }) => new ExpressInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  grpc(config?: GrpcInstrumentationConfig) {
    const key = cacheKey('grpc', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-grpc').then(
          ({ GrpcInstrumentation }) => new GrpcInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  redis(config?: RedisInstrumentationConfig) {
    const key = cacheKey('redis', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-redis').then(
          ({ RedisInstrumentation }) => new RedisInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  dns(config?: DnsInstrumentationConfig) {
    const key = cacheKey('dns', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-dns').then(
          ({ DnsInstrumentation }) => new DnsInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  net(config?: InstrumentationConfig) {
    const key = cacheKey('dns', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-net').then(
          ({ NetInstrumentation }) => new NetInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  fs(config?: FsInstrumentationConfig) {
    const key = cacheKey('fs', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-fs').then(
          ({ FsInstrumentation }) => new FsInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  undici(config?: OutgoingHttpEnrichmentConfig) {
    const key = cacheKey('undici', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-undici').then(
          ({ UndiciInstrumentation }) =>
            new UndiciInstrumentation(buildUndiciConfig(config))
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  socketIo(config?: SocketIoInstrumentationConfig) {
    const key = cacheKey('socket-io', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@opentelemetry/instrumentation-socket.io').then(
          ({ SocketIoInstrumentation }) => new SocketIoInstrumentation(config)
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },

  opensearch(config?: OpenSearchInstrumentationConfig) {
    const key = cacheKey('opensearch', config)
    if (!cache.has(key)) {
      cache.set(
        key,
        import('@sebspark/opentelemetry-instrumentation-opensearch').then(
          ({ OpenSearchInstrumentation }) =>
            new OpenSearchInstrumentation({
              suppressInternalInstrumentation: true,
              ...(config || {}),
            })
        )
      )
    }
    // biome-ignore lint/style/noNonNullAssertion: it will always exist
    return cache.get(key)!
  },
} as const
