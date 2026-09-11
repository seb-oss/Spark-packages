---
"@sebspark/tsconfig": patch
---

Force the tsdown `tsc` declaration generator instead of the TS 7-triggered `tsgo` default, which writes stray `.d.ts`/`.d.ts.map` files next to source on watch rebuilds (rolldown/tsdown#1048).
