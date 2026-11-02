---
"@sebspark/spanner-migrate": patch
---

Validate rows read from the `migrations` table instead of casting them. A malformed row now fails with `Invalid migration row` before any down script runs. Error messages also include the text of thrown values that are not `Error` instances, instead of `undefined`.
