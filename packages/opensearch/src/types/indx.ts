import type { API } from '@opensearch-project/opensearch'
import type { IndexDefinition, MapOpenSearchTypes } from './common'
import type { SearchRequest } from './search'

export interface IndexRequest<T>
  extends Omit<API.Index_Request, 'body' | 'index'> {
  index: T extends { index: infer I } ? I : never
  body: T extends { body: { mappings: { properties: infer P } } }
    ? MapOpenSearchTypes<P>
    : never
}

export type IndexRequestBody<T> = T extends {
  body: { mappings: { properties: infer P } }
}
  ? MapOpenSearchTypes<P>
  : // biome-ignore lint/suspicious/noExplicitAny: not our definition
    Record<string, any>

export interface IndexResponse extends API.Index_Response {}

export type IndexResponseBody = API.Index_ResponseBody

export type InferIndex<R extends SearchRequest<IndexDefinition>> =
  R extends SearchRequest<infer T> ? T : never

export type IndicesExistsRequest<T extends IndexDefinition> = Omit<
  API.Indices_Exists_Request,
  'index'
> & {
  index: Extract<T['index'], string> // Ensures the index resolves as a string
}
