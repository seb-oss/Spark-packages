---
"@sebspark/openapi-core": patch
"@sebspark/cli-tester": patch
"@sebspark/promise-cache": patch
"@sebspark/socket.io-avro": patch
---

Fix instanceof for HttpError subclasses

Fix ANSI color detection in cli-tester input: `styleText('red', '> ')` includes the closing escape code immediately after the space, so it never matched Inquirer's output where the full message is wrapped in red. Detection now extracts only the opening ANSI code using a NUL probe. Also fixes green tick detection with the same approach. Tests added for both no-color and ANSI color modes.

Fix promise-cache to treat persistor errors as a cache miss rather than propagating them to the caller. Both `get` and `set` failures are now silently swallowed so the cache is always a pure performance optimisation.

Fix duplicate `makeType` helper in socket.io-avro parser spec (hoisted to module scope). Fix negated ternary and unused import in the same file.
