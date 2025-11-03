import type { Instrumentation } from '@opentelemetry/instrumentation'

let _http: Promise<Instrumentation> | undefined
let _express: Promise<Instrumentation> | undefined
let _grpc: Promise<Instrumentation> | undefined
let _redis: Promise<Instrumentation> | undefined
let _dns: Promise<Instrumentation> | undefined
let _net: Promise<Instrumentation> | undefined
let _fs: Promise<Instrumentation> | undefined
let _undici: Promise<Instrumentation> | undefined
let _socketIo: Promise<Instrumentation> | undefined

export const instrumentations = {
  get http() {
    if (!_http) {
      _http = import('@opentelemetry/instrumentation-http').then(
        ({ HttpInstrumentation }) => new HttpInstrumentation()
      )
    }
    return _http
  },

  get express() {
    if (!_express) {
      _express = import('@opentelemetry/instrumentation-express').then(
        ({ ExpressInstrumentation }) => new ExpressInstrumentation()
      )
    }
    return _express
  },

  get grpc() {
    if (!_grpc) {
      _grpc = import('@opentelemetry/instrumentation-grpc').then(
        ({ GrpcInstrumentation }) => new GrpcInstrumentation()
      )
    }
    return _grpc
  },

  get redis() {
    if (!_redis) {
      _redis = import('@opentelemetry/instrumentation-redis').then(
        ({ RedisInstrumentation }) => new RedisInstrumentation()
      )
    }
    return _redis
  },

  get dns() {
    if (!_dns) {
      _dns = import('@opentelemetry/instrumentation-dns').then(
        ({ DnsInstrumentation }) => new DnsInstrumentation()
      )
    }
    return _dns
  },

  get net() {
    if (!_net) {
      _net = import('@opentelemetry/instrumentation-net').then(
        ({ NetInstrumentation }) => new NetInstrumentation()
      )
    }
    return _net
  },

  get fs() {
    if (!_fs) {
      _fs = import('@opentelemetry/instrumentation-fs').then(
        ({ FsInstrumentation }) => new FsInstrumentation()
      )
    }
    return _fs
  },

  get undici() {
    if (!_undici) {
      _undici = import('@opentelemetry/instrumentation-undici').then(
        ({ UndiciInstrumentation }) => new UndiciInstrumentation()
      )
    }
    return _undici
  },

  get socketIo() {
    if (!_socketIo) {
      _socketIo = import('@opentelemetry/instrumentation-socket.io').then(
        ({ SocketIoInstrumentation }) => new SocketIoInstrumentation()
      )
    }
    return _socketIo
  },
} as const
