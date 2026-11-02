---
"@sebspark/socket.io-avro": patch
---

Fix Avro encoding of event packets.

- With a single schema in total, every event was silently sent as JSON instead of Avro. The packet type now uses `wrapUnions: true`, so the representation no longer depends on how many schemas there are. The binary format on the wire is unchanged.
- Ack id `0`, which is the first ack in both socket.io client and server, was encoded as "no id", so the first acknowledgement never fired. It now round-trips.
- Decoded packets now conform to socket.io's `Packet`: `id` and `attachments` are omitted when absent instead of being `null`.
- `createAvroParser` returns real constructor types for `Encoder` and `Decoder`, and `AvroSocketPacket` describes the Avro representation exactly.
