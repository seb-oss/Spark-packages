import type { RecordType } from '@sebspark/avsc-isometric'
import type {
  AvroToTs,
  Prettify,
  SchemasToEvents,
} from '@sebspark/socket.io-avro/parser'

export const NAMESPACE = 'marketdata'

export const SubscribeMessageSchema = {
  name: 'Subscribe',
  type: 'record',
  fields: [{ name: 'rooms', type: { type: 'array', items: 'string' } }],
} as const satisfies RecordType
export type SubscribeMessage = Prettify<AvroToTs<typeof SubscribeMessageSchema>>

const LastTradeValueSchema = {
  name: 'LastTradeValue',
  type: 'record',
  fields: [
    { name: 'value', type: 'double' },
    { name: 'currency', type: 'string' },
  ],
} as const satisfies RecordType
export const PriceMessageSchema = {
  name: 'Price',
  type: 'record',
  fields: [
    { name: 'id', type: 'string' },
    {
      name: 'last',
      type: LastTradeValueSchema,
    },
    {
      name: 'conversions',
      type: ['null', { type: 'array', items: 'LastTradeValue' }],
    },
  ],
} as const satisfies RecordType
export type LastTradeValue = Prettify<AvroToTs<typeof LastTradeValueSchema>>
export type Price = Prettify<AvroToTs<typeof PriceMessageSchema>>

export const NewsMessageSchema = {
  name: 'News',
  type: 'record',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'feed', type: 'int' },
    { name: 'date', type: 'long' },
    { name: 'industry', type: ['null', { type: 'array', items: 'string' }] },
    { name: 'category', type: ['null', 'string'] },
    { name: 'headline', type: ['null', 'string'] },
    { name: 'body', type: ['null', 'string'] },
    { name: 'type', type: ['null', 'string'] },
    { name: 'gics', type: ['null', 'string'] },
    { name: 'icb', type: ['null', 'string'] },
    { name: 'categories', type: ['null', { type: 'array', items: 'string' }] },
    { name: 'instruments', type: ['null', { type: 'array', items: 'string' }] },
  ],
} as const satisfies RecordType
export type NewsItem = Prettify<AvroToTs<typeof NewsMessageSchema>>

const OrderLevelSchema = {
  name: 'OrderLevel',
  type: 'record',
  fields: [
    { name: 'price', type: 'double' },
    { name: 'level', type: 'int' },
    { name: 'volume', type: 'int' },
    { name: 'orders', type: 'int' },
  ],
} as const satisfies RecordType
export const OrderbookMessageSchema = {
  name: 'Orderbook',
  type: 'record',
  fields: [
    { name: 'id', type: 'string' },
    {
      name: 'asks',
      type: [
        'null',
        {
          type: 'array',
          items: OrderLevelSchema,
        },
      ],
    },
    {
      name: 'bids',
      type: ['null', { type: 'array', items: 'OrderLevel' }],
    },
  ],
} as const satisfies RecordType
export type OrderLevel = Prettify<AvroToTs<typeof OrderLevelSchema>>
export type Orderbook = Prettify<AvroToTs<typeof OrderbookMessageSchema>>

export const clientSchemas = [SubscribeMessageSchema] as const
export const serverSchemas = [
  PriceMessageSchema,
  OrderbookMessageSchema,
  NewsMessageSchema,
] as const
export const allSchemas = [...clientSchemas, ...serverSchemas]

export type ClientEvents = Prettify<SchemasToEvents<typeof clientSchemas>>
export type ServerEvents = Prettify<SchemasToEvents<typeof serverSchemas>>
