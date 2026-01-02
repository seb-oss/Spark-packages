import type { RecordType } from '@sebspark/avsc-isometric'
import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from 'socket.io-client'
import type { Prettify, SchemasToEvents } from './common'
import { createAvroParser } from './parser'

export const createClient = <C extends RecordType, S extends RecordType>(
  clientSchemas: C[],
  serverSchemas: S[],
  uri: string,
  opts?: Partial<ManagerOptions & SocketOptions>
) => {
  type ClientEvents = Prettify<SchemasToEvents<typeof clientSchemas>>
  type ServerEvents = Prettify<SchemasToEvents<typeof serverSchemas>>

  const options = opts || {}
  options.parser = createAvroParser([...serverSchemas, ...clientSchemas])

  return io(uri, options) as Socket<ServerEvents, ClientEvents>
}
