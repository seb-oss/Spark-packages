---
"@sebspark/cli-tester": patch
---

`Prompt<'select'>` now resolves to `SelectPrompt | CheckboxPrompt` and `Prompt<undefined>` to the union of all prompt types, so narrowing a parsed prompt works without type assertions. The internal sleep helper was replaced with `node:timers/promises`.
