import type { RecordType } from '@sebspark/avsc-isometric'
import type {
  AvroToTs,
  Prettify,
  SchemasToEvents,
} from '@sebspark/socket.io-avro/parser'

export const NAMESPACE = 'orders'

const InstrumentSchema = {
  name: 'Instrument',
  type: 'record',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
  ],
} as const satisfies RecordType

const OrderSchema = {
  name: 'Order',
  type: 'record',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'accountId', type: 'string' },
    { name: 'side', type: 'string' },
    { name: 'instrument', type: InstrumentSchema },
    { name: 'currency', type: 'string' },
  ],
} as const satisfies RecordType
export type Order = Prettify<AvroToTs<typeof OrderSchema>>

export const clientSchemas = [] as const
export const serverSchemas = [OrderSchema] as const
export const allSchemas = [...clientSchemas, ...serverSchemas]

export type ClientEvents = Prettify<SchemasToEvents<typeof clientSchemas>>
export type ServerEvents = Prettify<SchemasToEvents<typeof serverSchemas>>
