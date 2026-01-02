import type { Server as HttpServer } from 'node:http'
import type { RecordType } from '@sebspark/avsc-isometric'
import { Server, type ServerOptions } from 'socket.io'
import type { Prettify, SchemasToEvents } from './common'
import { createAvroParser } from './parser'

export const createServer = <C extends RecordType, S extends RecordType>(
  clientSchemas: C[],
  serverSchemas: S[],
  httpServer: HttpServer,
  opts?: Partial<ServerOptions>
) => {
  type ClientEvents = Prettify<SchemasToEvents<typeof clientSchemas>>
  type ServerEvents = Prettify<SchemasToEvents<typeof serverSchemas>>

  const options = opts || {}
  options.parser = createAvroParser([...serverSchemas, ...clientSchemas])
  options.perMessageDeflate = false

  return new Server<ClientEvents, ServerEvents>(httpServer, options)
}
