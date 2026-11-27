# `@sebspark/socket.io-gcp-pubsub-emitter`

A Socket.IO PubSub emitter, allowing to communicate with a group of Socket.IO servers from another Node.js process

`emit` returns `true` at once, like Socket.IO's own emitters, and publishes in the background. A publish that fails is logged with `console.error`.
