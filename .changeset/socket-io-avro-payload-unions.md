---
"@sebspark/socket.io-avro": patch
---

Fix payloads with union fields being sent as JSON instead of Avro.

Since 0.1.28, `wrapUnions: true` also applied to unions inside the payload schemas, such as a nullable field `["null", "string"]`. Plain values like `{ headline: 'Headline' }` failed to encode. Each such event logged "Error encoding packet" and fell back to JSON.

The option now only applies to the packet's own unions. Payload fields encode and decode plain values, as in 0.1.27. A single schema still encodes as Avro, and a schema can still reference named types defined by an earlier one.
