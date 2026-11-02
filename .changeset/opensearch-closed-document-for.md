---
"@sebspark/opensearch": minor
---

Fix `keyof`, `Omit` and other mapped types on `DocumentFor<T>`, which 3.3.0 broke by accepting unmapped fields in it.

- `DocumentFor<T>` holds only mapped fields again, as in 3.2.5, so `keyof DocumentFor<T>` is the mapped field names and `Omit<DocumentFor<T>, K>` keeps the remaining fields with their types. `knn_vector` fields stay `number[]`.
- New `WritableDocument<T>` for writes. It accepts unmapped fields as `unknown`, unless the mapping sets `dynamic: 'strict'`, in which case OpenSearch rejects them and so does the type. `index`, `bulk`, `bulkIndex`, `bulkCreate`, `bulkUpdate` and `IdFunction` use it.

If you used `DocumentFor<T>` to type a document with unmapped fields, use `WritableDocument<T>` instead.
