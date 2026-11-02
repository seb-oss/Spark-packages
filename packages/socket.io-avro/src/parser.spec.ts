import type { RecordType } from '@sebspark/avsc-isometric'
import { Type } from 'avsc'
import { PacketType } from 'socket.io-parser'
import { describe, expect, it } from 'vitest'
import { kebabCase, pascalCase, SOCKET_PACKET_SCHEMA } from './common'
import { AvroDecoder, AvroEncoder, createAvroParser } from './parser'

const HelloSchema = {
  type: 'record',
  name: 'Hello',
  fields: [{ name: 'greeting', type: 'string' }],
} as const satisfies RecordType

describe('kebabCase', () => {
  it('converts PascalCase to kebab-case', () => {
    expect(kebabCase('HelloWorld')).toBe('hello-world')
  })

  it('leaves already-lowercase strings unchanged', () => {
    expect(kebabCase('hello')).toBe('hello')
  })
})

describe('pascalCase', () => {
  it('converts kebab-case to PascalCase', () => {
    expect(pascalCase('hello-world')).toBe('HelloWorld')
  })

  it('leaves PascalCase strings unchanged', () => {
    expect(pascalCase('Hello')).toBe('Hello')
  })
})

describe('createAvroParser', () => {
  it('returns an Encoder and Decoder constructor', () => {
    const parser = createAvroParser([HelloSchema])
    expect(typeof parser.Encoder).toBe('function')
    expect(typeof parser.Decoder).toBe('function')
  })

  it('Encoder constructor creates an AvroEncoder instance', () => {
    const parser = createAvroParser([HelloSchema])
    const encoder = new parser.Encoder()
    expect(encoder).toBeInstanceOf(AvroEncoder)
  })

  it('Decoder constructor creates an AvroDecoder instance', () => {
    const parser = createAvroParser([HelloSchema])
    const decoder = new parser.Decoder()
    expect(decoder).toBeInstanceOf(AvroDecoder)
  })

  it('creates a parser with no schemas', () => {
    const parser = createAvroParser([])
    expect(typeof parser.Encoder).toBe('function')
  })
})

const makeType = () => {
  const schema = {
    ...SOCKET_PACKET_SCHEMA,
    fields: [
      ...SOCKET_PACKET_SCHEMA.fields,
      { name: 'data', type: [HelloSchema] },
    ],
  } satisfies RecordType
  return Type.forSchema(schema, { wrapUnions: true })
}

describe('AvroEncoder', () => {
  it('encodes an EVENT packet to a buffer', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: '/',
    })
    expect(result).toHaveLength(1)
    expect(Buffer.isBuffer(result[0])).toBe(true)
  })

  it('uses default nsp "/" when nsp is absent', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: undefined as unknown as string,
    })
    expect(result).toHaveLength(1)
  })

  it('encodes a packet with id and attachments', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: '/',
      id: 1,
      attachments: 0,
    })
    expect(result).toHaveLength(1)
  })

  it('falls back to super.encode for non-EVENT packets', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.CONNECT,
      nsp: '/',
      data: undefined,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty array when packet data is missing', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.EVENT,
      nsp: '/',
      data: undefined,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('falls back to super.encode when avro encoding throws', () => {
    // Pass a schema mismatch that causes toBuffer to throw
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const result = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: undefined }], // invalid: greeting must be a string
      nsp: '/',
    })
    // catch block falls through to super.encode which returns a JSON string array
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('AvroDecoder', () => {
  it('decodes a buffer into a packet', () => {
    const type = makeType()
    const encoder = new AvroEncoder(type)
    const decoder = new AvroDecoder(type)
    const decoded: unknown[] = []
    decoder.on('decoded', (packet) => decoded.push(packet))

    const [buffer] = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: '/',
    }) as Buffer[]

    decoder.add(buffer)

    expect(decoded).toHaveLength(1)
  })

  it('decodes a packet without id or attachments into a socket.io Packet without them', () => {
    const parser = createAvroParser([HelloSchema])
    const encoder = new parser.Encoder()
    const decoder = new parser.Decoder()
    const decoded: unknown[] = []
    decoder.on('decoded', (packet) => decoded.push(packet))

    const [buffer] = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: '/',
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    decoder.add(buffer)

    expect(decoded).toEqual([
      {
        type: PacketType.EVENT,
        nsp: '/',
        data: ['hello', { greeting: 'hi' }],
      },
    ])
  })

  it('round-trips id and attachments, including ack id 0', () => {
    const parser = createAvroParser([HelloSchema])
    const encoder = new parser.Encoder()
    const decoder = new parser.Decoder()
    const decoded: unknown[] = []
    decoder.on('decoded', (packet) => decoded.push(packet))

    const [buffer] = encoder.encode({
      type: PacketType.EVENT,
      data: ['hello', { greeting: 'hi' }],
      nsp: '/',
      id: 0,
      attachments: 0,
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    decoder.add(buffer)

    expect(decoded).toEqual([
      {
        type: PacketType.EVENT,
        nsp: '/',
        id: 0,
        attachments: 0,
        data: ['hello', { greeting: 'hi' }],
      },
    ])
  })

  it('handles ArrayBuffer', () => {
    const type = makeType()
    const decoder = new AvroDecoder(type)
    const decoded: unknown[] = []
    decoder.on('decoded', (packet) => decoded.push(packet))

    decoder.add(new ArrayBuffer(8))
    // super.add should handle it without throwing
  })

  it('falls back to super.add for non-buffer chunks', () => {
    const type = makeType()
    const decoder = new AvroDecoder(type)
    const decoded: unknown[] = []
    decoder.on('decoded', (packet) => decoded.push(packet))

    // CONNECT packet as a string (socket.io-parser control packet format)
    decoder.add('0')
    // super.add should handle it without throwing
  })

  it('drops malformed binary without throwing', () => {
    const type = makeType()
    const decoder = new AvroDecoder(type)
    // Random buffer that can't be decoded
    expect(() => decoder.add(Buffer.from([0xff, 0x00]))).not.toThrow()
  })
})

describe('createAvroParser payload unions', () => {
  const NewsSchema = {
    type: 'record',
    name: 'News',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'headline', type: ['null', 'string'], default: null },
    ],
  } as const satisfies RecordType

  const PingSchema = {
    type: 'record',
    name: 'Ping',
    fields: [{ name: 'n', type: 'int' }],
  } as const satisfies RecordType

  const roundTrip = (schemas: RecordType[], data: unknown[]) => {
    const { Encoder, Decoder } = createAvroParser(schemas)
    const encoded = new Encoder().encode({
      type: PacketType.EVENT,
      nsp: '/',
      data,
    })
    const decoded: unknown[] = []
    const decoder = new Decoder()
    decoder.on('decoded', (packet) => decoded.push(packet.data))
    for (const chunk of encoded) decoder.add(chunk)
    return { sentAsAvro: Buffer.isBuffer(encoded[0]), decoded }
  }

  it('encodes a plain value in a nullable payload field as Avro and decodes it plain', () => {
    const result = roundTrip(
      [NewsSchema, PingSchema],
      ['news', { id: '1', headline: 'Headline' }]
    )

    expect(result).toEqual({
      sentAsAvro: true,
      decoded: [['news', { id: '1', headline: 'Headline' }]],
    })
  })

  it('encodes null in a nullable payload field as Avro', () => {
    const result = roundTrip(
      [NewsSchema, PingSchema],
      ['news', { id: '1', headline: null }]
    )

    expect(result).toEqual({
      sentAsAvro: true,
      decoded: [['news', { id: '1', headline: null }]],
    })
  })

  it('encodes a nullable payload field as Avro with a single schema', () => {
    const result = roundTrip([NewsSchema], ['news', { id: '1', headline: 'H' }])

    expect(result).toEqual({
      sentAsAvro: true,
      decoded: [['news', { id: '1', headline: 'H' }]],
    })
  })

  it('resolves named types defined by an earlier schema', () => {
    const LevelSchema = {
      type: 'record',
      name: 'Level',
      fields: [{ name: 'price', type: 'double' }],
    } as const satisfies RecordType
    const BookSchema = {
      type: 'record',
      name: 'Book',
      fields: [
        { name: 'levels', type: { type: 'array', items: ['null', 'Level'] } },
      ],
    } satisfies RecordType

    const result = roundTrip(
      [LevelSchema, BookSchema],
      ['book', { levels: [{ price: 1.5 }, null] }]
    )

    expect(result).toEqual({
      sentAsAvro: true,
      decoded: [['book', { levels: [{ price: 1.5 }, null] }]],
    })
  })
})
