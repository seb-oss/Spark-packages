import { type API, Client } from '@opensearch-project/opensearch'
import type {
  BulkRequest,
  BulkResponse,
  IndexDefinition,
  IndexRequest,
  SearchRequest,
  SearchResponse,
} from './types'
import type {
  Indices,
  TransportRequestOptions,
  TransportRequestPromise,
} from './types/common'
import type { IndicesExistsRequest } from './types/indx'

type TypedIndices = Omit<Indices, 'exists'> & {
  exists<T extends IndexDefinition>(
    params: IndicesExistsRequest<T>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<API.Indices_Exists_Response>
}

/**
 * ✅ Custom interface that extends `Client`, but replaces the `search()` method signature.
 * - Uses `Omit<Client, "search">` to remove `search()` from `Client`.
 * - Defines a new `search<T>()` method with stricter type safety.
 */
export interface OpenSearchClient
  extends Omit<Client, 'search' | 'index' | 'bulk' | 'indices'> {
  search<T extends IndexDefinition>(
    params: SearchRequest<T>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<SearchResponse<T>>

  index<T extends IndexDefinition>(
    params: IndexRequest<T>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<API.Index_Response>

  bulk<T extends IndexDefinition>(
    params: BulkRequest<T>,
    options?: TransportRequestOptions
  ): TransportRequestPromise<BulkResponse<T>>

  indices: TypedIndices
}

/**
 * ✅ Constructor type that ensures `new OpenSearchClient()` works.
 * - This type is necessary because `OpenSearchClient` is actually a function (not a class).
 */
type OpenSearchClientConstructor = new (
  ...args: ConstructorParameters<typeof Client>
) => OpenSearchClient

/**
 * ✅ A function that behaves like a class constructor.
 * - Instantiates a new `Client` internally.
 * - Casts the instance to `OpenSearchClient` so TypeScript recognizes the new `search<T>()` signature.
 * - The `as unknown as` trick ensures `new OpenSearchClient()` is valid.
 */
export const OpenSearchClient: OpenSearchClientConstructor = function (
  this: Client,
  ...args: ConstructorParameters<typeof Client>
) {
  const clientInstance = new Client(...args)
  return clientInstance as unknown as OpenSearchClient
} as unknown as {
  new (...args: ConstructorParameters<typeof Client>): OpenSearchClient
}
