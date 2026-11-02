---
"@sebspark/socket.io-avro": patch
---

`socket.io` and `socket.io-client` are now optional peer dependencies. `/server` only needs `socket.io` and `/client` only needs `socket.io-client`, so client apps no longer get an unmet-peer warning for `socket.io`, and servers no longer get one for `socket.io-client`.
