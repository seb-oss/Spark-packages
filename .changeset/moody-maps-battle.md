---
"@sebspark/emulator": minor
---

### Added

- `.stream(initializer)` — externally-driven streaming responder that keeps a connection open and lets the test push updates via a `StreamHandle` (`waitForCall()`, `send()`, `latestResponse`, `hasBeenCalled`)
- `.pending` — number of unspent responders registered for a method
- `.reset()` — clears responders for a method; emulator-level `reset()` clears all methods
