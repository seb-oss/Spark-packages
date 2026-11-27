# @sebspark/drizzle-live

## 0.1.0

### Minor Changes

- 8e3043d: First release: pg-live for Drizzle. `defineLiveTable(table, { casing })` derives the live table from a Drizzle table, with precise key types; rows have your schema's keys and Drizzle's value mapping, and `writeAndNotify` runs in an ordinary Drizzle transaction.

### Patch Changes

- Updated dependencies [1905321]
  - @sebspark/pg-live@0.1.0
