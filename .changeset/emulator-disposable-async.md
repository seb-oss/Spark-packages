---
"@sebspark/emulator": patch
---

`disposable()` now always returns a promise from `[Symbol.asyncDispose]`, even when the supplied `dispose` function is synchronous. It also requires an object emulator (`T extends object`), which it always did at runtime. Internal type assertions were replaced with type guards.
