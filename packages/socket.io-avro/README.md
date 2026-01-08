# `@sebspark/socket.io-avro`

Efficient, type-safe **Socket.io** communication using **Apache Avro** for binary serialization. This package provides a custom parser that replaces the default JSON serializer, reducing payload size and enforcing schema contracts between server and client.

## Install

```zsh
# server
yarn add @sebspark/socket.io-avro @sebspark/avsc-isometric socket.io

# client
yarn add @sebspark/socket.io-avro @sebspark/avsc-isometric socket.io-client
```

## Usage

### 1. Define your schemas

Use as const satisfies RecordType to ensure TypeScript can infer the types. Event names are inferred as `kebabCase(schema.name)` when decoding and schema name will be inferred as `pascalCase(eventName)` when encoding.

```typescript
import type { RecordType } from '@sebspark/avsc-isometric'

export const HelloSchema = {
  type: 'record',
  name: 'Hello', // event name will be 'hello'
  fields: [{ name: 'greeting', type: 'string' }]
} as const satisfies RecordType

export const WorldSchema = {
  type: 'record',
  name: 'World', // event name will be 'world'
  fields: [{ name: 'response', type: 'string' }]
} as const satisfies RecordType
```

### 2a. Create your server

The server requires an array of schemas it listens for (from client) and an array of schemas it emits (to client).

```typescript
import { createServer as createHttpServer } from 'node:http'
import { createServer } from '@sebspark/socket.io-avro/server'
import { HelloSchema, WorldSchema } from './schemas'

const httpServer = createHttpServer()
const server = createServer([HelloSchema], [WorldSchema], httpServer)

server.on('connect', (socket) => {
  socket.on('hello', ({ greeting }) => {
    console.log(greeting) 
    socket.emit('world', { response: 'Hi!' })
  })
})

httpServer.listen(3000)
```

### 2b. Create your client

The client uses the same schemas in reverse order (Emits client schemas, listens for server schemas).

```typescript
import { createClient } from '@sebspark/socket.io-avro/client'
import { HelloSchema, WorldSchema } from './schemas'

const uri = 'http://localhost:3000'
const client = createClient([HelloSchema], [WorldSchema], uri)

client.on('world', ({ response }) => {
  console.log(response)
})

client.emit('hello', { greeting: 'Hello!' })
```

## Under the Hood

This package bundles a custom **Socket.io** `Parser` that uses `@sebspark/avsc-isometric`. It handles:

1. **Handshake**: Initial control packets remain JSON.
2. **Events**: Binary encoding for all data packets.
3. **Type Inference**: Complex Avro types (unions, arrays, records) are mapped to their TypeScript equivalents automatically.

### Exports

The package is optimized for tree-shaking and separate environments:

- `@sebspark/socket.io-avro/server`: Server-side logic (depends on `socket.io`).
- `@sebspark/socket.io-avro/client`: Client-side logic (depends on `socket.io-client`).
- `@sebspark/socket.io-avro/parser`: The underlying Avro parser and classes.
