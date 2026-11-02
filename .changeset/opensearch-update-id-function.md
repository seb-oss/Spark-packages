---
"@sebspark/opensearch": minor
---

`bulkUpdate` takes an `UpdateIdFunction<T>`, which receives `DeepPartial<WritableDocument<T>>`. That is what the function actually gets: `doc` when it is set, otherwise `upsert`. For concrete indices the type equals `IdFunction<T>`, so existing id functions keep working. `UpdateIdFunction` is exported. Internally, a type guard replaces the type assertion.
