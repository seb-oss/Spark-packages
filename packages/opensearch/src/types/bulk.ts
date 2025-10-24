import type { API, Types } from '@opensearch-project/opensearch'
import type { IndexDefinition } from './common'
import type { DocumentFor } from './documents'
import type { DeepPartial, NestedLeafPaths } from './utilityTypes'

export type CreateOperation<T extends IndexDefinition> = Omit<
  WriteOperation<T>,
  '_id'
> & {
  _id: Types.Common.Id
}
export type DeleteOperation<T extends IndexDefinition> = OperationBase<T>
export type IndexOperation<T extends IndexDefinition> = WriteOperation<T>
export type UpdateOperation<T extends IndexDefinition> = Omit<
  Types.Core_Bulk.UpdateOperation,
  '_index' | '_id'
> & {
  _id: Types.Common.Id
  _index?: T['index']
}
type WriteOperation<T extends IndexDefinition> = Omit<
  Types.Core_Bulk.WriteOperation,
  '_index'
> & {
  _index?: T['index']
}
type OperationBase<T extends IndexDefinition> = Omit<
  Types.Core_Bulk.OperationBase,
  '_index'
> & {
  _index?: T['index']
}
type OperationContainer<T extends IndexDefinition> = {
  create?: CreateOperation<T>
  delete?: DeleteOperation<T>
  index?: IndexOperation<T>
  update?: UpdateOperation<T>
}
export type UpdateAction<T extends IndexDefinition> = Omit<
  Types.Core_Bulk.UpdateAction,
  'doc' | 'upsert'
> &
  (
    | { doc: DeepPartial<DocumentFor<T>>; upsert?: DocumentFor<T> }
    | { doc?: DeepPartial<DocumentFor<T>>; upsert: DocumentFor<T> }
  )

export type BulkRequest<T extends IndexDefinition> = Omit<
  API.Bulk_Request,
  'index' | 'body' | '_source_excludes' | '_source_includes'
> & {
  index: T['index']
  body: BulkRequestBody<T>
  _source_excludes?: NestedLeafPaths<T> | Types.Common.Fields
  _source_includes?: NestedLeafPaths<T> | Types.Common.Fields
}

export type BulkRequestBody<T extends IndexDefinition> = (
  | OperationContainer<T>
  | UpdateAction<T>
  | DocumentFor<T>
)[]

type ResponseItem<T extends IndexDefinition> = Omit<
  Types.Core_Bulk.ResponseItem,
  '_index'
> & {
  _index: T['index']
}

type CustomOperation = string
type BulkOperation = 'index' | 'update' | 'delete' | 'create' | CustomOperation

type BulkResponseBody<T extends IndexDefinition> = Omit<
  API.Bulk_ResponseBody,
  'items'
> & {
  items: Record<BulkOperation, ResponseItem<T>>[]
}

export type BulkResponse<T extends IndexDefinition> = Omit<
  API.Bulk_ResponseBody,
  'body'
> & {
  body: BulkResponseBody<T>
}
