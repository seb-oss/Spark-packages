---
"@sebspark/tsconfig": patch
---

`base.json` now excludes the extending project's own `dist`, `build` and `node_modules` via `${configDir}`. Before, `exclude` resolved relative to `@sebspark/tsconfig` itself, so `tsc --noEmit` included the project's own build output. Typecheck running in parallel with a build could then fail intermittently with TS6053. The `**/*.spec.ts` entry, which also never matched, is removed so spec files stay typechecked.
