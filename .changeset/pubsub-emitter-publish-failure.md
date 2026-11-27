---
"@sebspark/socket.io-gcp-pubsub-emitter": patch
---

A failed publish is now logged with `console.error`, instead of leaving an unhandled rejection that could end the process.
