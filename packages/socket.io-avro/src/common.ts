import type { RecordType } from '@sebspark/avsc-isometric'
import type { Packet } from 'socket.io-parser'

export const kebabCase = (str: string) =>
  str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

export const pascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase())

export const SOCKET_PACKET_SCHEMA = {
  name: 'SocketPacket',
  type: 'record',
  fields: [
    { name: 'type', type: 'int' },
    { name: 'id', type: ['null', 'int'] },
    { name: 'nsp', type: 'string' },
    { name: 'attachments', type: ['null', 'int'] },
  ],
} as const satisfies RecordType

export type SocketPacketSchema = typeof SOCKET_PACKET_SCHEMA

export interface AvroSocketPacket extends Omit<Packet, 'data'> {
  // biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
  data: { [key: string]: any }
}

// biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
export type AvroToTs<T> = T extends { type: 'record'; fields: readonly any[] }
  ? { [F in T['fields'][number] as F['name']]: AvroToTs<F['type']> }
  : T extends { type: 'array'; items: infer I }
    ? AvroToTs<I>[]
    : T extends { type: 'string' }
      ? string
      : T extends { type: 'int' | 'double' }
        ? number
        : // biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
          T extends readonly any[]
          ?
              | AvroToTs<Exclude<T[number], 'null'>>
              | (Extract<T[number], 'null'> extends never ? never : null)
          : T extends string
            ? T extends 'string'
              ? string
              : T extends 'int' | 'double'
                ? number
                : // biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
                  any
            : // biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
              any

export type ToKebab<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${Lowercase<T>}${ToKebab<U>}`
    : `${Lowercase<T>}-${ToKebab<Uncapitalize<U>>}`
  : S

export type SchemasToEvents<T extends readonly { readonly name: string }[]> = {
  [K in T[number] as ToKebab<K['name']>]: (payload: AvroToTs<K>) => void
}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
