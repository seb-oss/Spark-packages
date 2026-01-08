import { type RecordType, Type } from '@sebspark/avsc-isometric'
import {
  Decoder as BaseDecoder,
  Encoder as BaseEncoder,
  type Packet,
  PacketType,
} from 'socket.io-parser'
import {
  type AvroSocketPacket,
  kebabCase,
  pascalCase,
  SOCKET_PACKET_SCHEMA,
} from './common'

export type { AvroToTs, Prettify, SchemasToEvents } from './common'

const encodePacket = (packet: Packet) => {
  const payloadTypeName = pascalCase(packet.data[0])
  const payload = packet.data[1]

  return {
    type: packet.type,
    nsp: packet.nsp || '/',
    id: packet.id || null,
    attachments: packet.attachments !== undefined ? packet.attachments : null,
    data: {
      [payloadTypeName]: payload,
    },
  } as AvroSocketPacket
}

const decodePacket = (packet: AvroSocketPacket) => {
  const [payloadTypeName, payload] = Object.entries(packet.data)[0]
  const eventName = kebabCase(payloadTypeName)
  return {
    ...packet,
    data: [eventName, payload],
  } as Packet
}

// biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
export type Replacer = (this: any, key: string, value: any) => any
export class AvroEncoder extends BaseEncoder {
  private readonly type: Type

  constructor(type: Type, replacer?: Replacer) {
    super(replacer)
    this.type = type
  }

  /**
   * Encodes a packet into a transportable format
   * @param packet Internal Socket.io packet
   * @returns Array containing the Avro buffer or a JSON string
   */
  override encode(packet: Packet) {
    if (packet.type === PacketType.EVENT && packet.data) {
      try {
        // console.log('Packet to encode', packet)
        const encoded = encodePacket(packet)

        if (!encoded) {
          console.warn('Unencodable message', packet)
          return []
        }

        // console.log('Encoded packet', encoded)
        const buffer = this.type.toBuffer(encoded)

        return [buffer]
      } catch (err) {
        console.error('Error encoding packet', err)
      }
    }

    return super.encode(packet)
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
export type Reviver = (this: any, key: string, value: any) => any
export class AvroDecoder extends BaseDecoder {
  private readonly type: Type

  constructor(type: Type, reviver?: Reviver) {
    super(reviver)
    this.type = type
  }

  /**
   * Receives incoming data chunks from the transport
   * @param chunk Buffer for binary data or string for control packets
   */
  // biome-ignore lint/suspicious/noExplicitAny: Defined in outside package
  override add(chunk: any) {
    if (Buffer.isBuffer(chunk)) {
      try {
        const packet = this.type.fromBuffer(chunk)
        const decoded = decodePacket(packet)

        if (decoded) {
          // console.log('Decoded', decoded)
          this.emitReserved('decoded', decoded)
        } else {
          console.warn('Undecodable payload', packet)
        }
      } catch (err) {
        // Drop malformed binary
        console.warn('Malformed binary', err)
      }
    } else {
      super.add(chunk)
    }
  }
}

export const createAvroParser = (schemas: RecordType[]) => {
  const packetSchema = {
    ...SOCKET_PACKET_SCHEMA,
    fields: [
      ...SOCKET_PACKET_SCHEMA.fields,
      {
        name: 'data',
        type: schemas.length ? schemas : ['null'],
      },
    ],
  } satisfies RecordType
  const packetType = Type.forSchema(packetSchema)

  return {
    // biome-ignore lint/complexity/useArrowFunction: Must be a function expression to satisfy constructor requirements
    Encoder: function (replacer?: Replacer) {
      return new AvroEncoder(packetType, replacer)
    },
    // biome-ignore lint/complexity/useArrowFunction: Must be a function expression to satisfy constructor requirements
    Decoder: function (reviver?: Reviver) {
      return new AvroDecoder(packetType, reviver)
    },
  }
}
