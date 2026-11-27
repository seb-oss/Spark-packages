---
"@sebspark/drizzle-live": minor
---

First release: pg-live for Drizzle. `defineLiveTable(table, { casing })` derives the live table from a Drizzle table, with precise key types; rows have your schema's keys and Drizzle's value mapping, and `writeAndNotify` runs in an ordinary Drizzle transaction.
