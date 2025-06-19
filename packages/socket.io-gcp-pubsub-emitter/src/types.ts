import type { Topic } from '@google-cloud/pubsub'

export enum RequestType {
  SOCKETS = 0,
  ALL_ROOMS = 1,
  REMOTE_JOIN = 2,
  REMOTE_LEAVE = 3,
  REMOTE_DISCONNECT = 4,
  REMOTE_FETCH = 5,
  SERVER_SIDE_EMIT = 6,
}

export interface Parser {
  // biome-ignore lint/suspicious/noExplicitAny: It is any
  encode: (msg: any) => any
}

export type EmitterOptions = unknown // No options yet

export interface BroadcastOptions {
  nsp: string
}

export interface BroadcastFlags {
  volatile?: boolean
  compress?: boolean
}

export enum PacketType {
  CONNECT = 0,
  DISCONNECT = 1,
  EVENT = 2,
  ACK = 3,
  CONNECT_ERROR = 4,
  BINARY_EVENT = 5,
  BINARY_ACK = 6,
}

export const RESERVED_EVENTS: ReadonlySet<string | symbol> = new Set(<const>[
  'connect',
  'connect_error',
  'disconnect',
  'disconnecting',
  'newListener',
  'removeListener',
])

export interface Packet {
  type: PacketType
  nsp: string
  // biome-ignore lint/suspicious/noExplicitAny: It is any
  data?: any
  id?: number
  attachments?: number
}

export type Message = Parameters<Topic['publishMessage']>[0]
