import type { Types } from '@opensearch-project/opensearch'
import type {
  BulkRequest,
  CreateOperation,
  DeleteOperation,
  IndexOperation,
  UpdateAction,
  UpdateOperation,
} from './types/bulk'
import type { IndexDefinition } from './types/common'
import type { DocumentFor } from './types/documents'

export type IdFunction<T extends IndexDefinition> = (
  doc: DocumentFor<T>
) => Types.Common.Id

/**
 * Constructs a bulk request payload for indexing documents.
 *
 * For each document in the provided array, this helper creates a two‑line bulk operation:
 *   1. An action object for an index operation. If an id generator is provided, its result is used as _id.
 *   2. The document itself.
 *
 * @param index - The name of the index.
 * @param docs  - An array of documents to insert.
 * @param idFn  - Optional function that returns an _id for a given document.
 * @returns A BulkRequest payload for insert operations.
 */
export function bulkIndex<T extends IndexDefinition>(
  index: T['index'],
  docs: DocumentFor<T>[],
  idFn?: IdFunction<T>
): BulkRequest<T> {
  const body = docs.flatMap((doc) => {
    const op: IndexOperation<T> = idFn ? { _id: idFn(doc) } : {}
    return [{ index: op }, doc]
  })
  return { index, body }
}

/**
 * Constructs a bulk request payload for creating documents.
 *
 * For each document in the provided array, this helper creates a two‑line bulk operation:
 *   1. An action object for a create operation with a generated _id.
 *   2. The document itself.
 *
 * @param index - The name of the index.
 * @param docs  - An array of documents to create.
 * @param idFn  - A function that returns a unique _id for each document.
 * @returns A BulkRequest payload for create operations.
 */
export function bulkCreate<T extends IndexDefinition>(
  index: T['index'],
  docs: DocumentFor<T>[],
  idFn: IdFunction<T>
): BulkRequest<T> {
  const body = docs.flatMap((doc) => {
    const op: CreateOperation<T> = { _id: idFn(doc) }
    return [{ create: op }, doc]
  })
  return { index, body }
}

/**
 * Constructs a bulk request payload for update operations.
 *
 * This helper takes an array of update actions (of type UpdateAction<T>),
 * splits each into its action metadata and payload (with the `doc` and/or `upsert` properties),
 * and returns a BulkRequest payload formatted as a flat array.
 *
 * @param index - The name of the index.
 * @param updates - An array of update actions.
 * @param idFn  - A function that returns a unique _id for each document.
 * @returns A BulkRequest payload for update operations.
 */
export function bulkUpdate<T extends IndexDefinition>(
  index: T['index'],
  updates: UpdateAction<T>[],
  idFn: IdFunction<T>
): BulkRequest<T> {
  const body = updates.flatMap((update) => {
    const op: UpdateOperation<T> = {
      _id: idFn((update.doc as DocumentFor<T>) || update.upsert),
    }
    return [{ update: op }, update]
  })

  return { index, body }
}

/**
 * Constructs a bulk request payload for deleting documents.
 *
 * For each document in the provided array, this helper creates a single‑line bulk operation:
 *   { delete: { _id: <id> } }
 * The provided id generator function is used to compute the _id for each document.
 *
 * @param index - The name of the index.
 * @param docs  - An array of documents to delete.
 * @param idFn  - A function that returns the _id for a given document.
 * @returns A BulkRequest payload for delete operations.
 */
export function bulkDelete<T extends IndexDefinition>(
  index: T['index'],
  ids: Types.Common.Id[]
): BulkRequest<T> {
  const body = ids.map((_id) => {
    const op: DeleteOperation<T> = { _id }
    return { delete: op }
  })
  return { index, body }
}
