import type { Instrumentation } from '@opentelemetry/instrumentation'
import { DnsInstrumentation } from '@opentelemetry/instrumentation-dns'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { FsInstrumentation } from '@opentelemetry/instrumentation-fs'
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NetInstrumentation } from '@opentelemetry/instrumentation-net'
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis'
import { SocketIoInstrumentation } from '@opentelemetry/instrumentation-socket.io'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'

let _http: HttpInstrumentation
let _express: ExpressInstrumentation
let _grpc: GrpcInstrumentation
let _redis: RedisInstrumentation
let _dns: DnsInstrumentation
let _net: NetInstrumentation
let _fs: FsInstrumentation
let _undici: UndiciInstrumentation
let _socketIo: SocketIoInstrumentation

export const instrumentations = {
  get http(): Instrumentation {
    if (!_http) {
      _http = new HttpInstrumentation()
    }
    return _http
  },

  get express() {
    if (!_express) {
      _express = new ExpressInstrumentation()
    }
    return _express
  },

  get grpc() {
    if (!_grpc) {
      _grpc = new GrpcInstrumentation()
    }
    return _grpc
  },

  get redis() {
    if (!_redis) {
      _redis = new RedisInstrumentation()
    }
    return _redis
  },

  get dns() {
    if (!_dns) {
      _dns = new DnsInstrumentation()
    }
    return _dns
  },

  get net() {
    if (!_net) {
      _net = new NetInstrumentation()
    }
    return _net
  },

  get fs() {
    if (!_fs) {
      _fs = new FsInstrumentation()
    }
    return _fs
  },

  get undici() {
    if (!_undici) {
      _undici = new UndiciInstrumentation()
    }
    return _undici
  },

  get socketIo() {
    if (!_socketIo) {
      _socketIo = new SocketIoInstrumentation()
    }
    return _socketIo
  },
} as const
