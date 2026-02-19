import type { API } from '@opensearch-project/opensearch'
import type { IndexDefinition, MapQueryProperties, Sort } from './common'
import type {
  FieldCollapse,
  Highlight,
  HitsMetadata,
  SourceConfig,
} from './core_search'
import type { QueryContainer } from './queries'
import { Prettify } from './utilityTypes'

export type SearchRequest<T extends IndexDefinition> = Prettify<
  Omit<API.Search_Request, 'body' | 'index'> & {
    index: T['index']
    body: SearchRequestBody<T>
  }
>

export type SearchRequestBody<T extends IndexDefinition> = Omit<
  API.Search_RequestBody,
  'query' | 'collapse' | 'highlight' | 'sort' | '_source'
> & {
  query?: QueryContainer<MapQueryProperties<T>>
  collapse?: FieldCollapse<MapQueryProperties<T>>
  highlight?: Highlight<MapQueryProperties<T>>
  sort?: Sort<MapQueryProperties<T>>
  _source?: SourceConfig<MapQueryProperties<T>>
}

export type SearchResponse<T extends IndexDefinition> = Prettify<
  Omit<API.Search_Response, 'body'> & {
    body: SearchResponseBody<T>
  }
>

export type SearchResponseBody<T extends IndexDefinition> = Omit<
  API.Search_ResponseBody,
  'hits'
> & {
  hits: HitsMetadata<T>
}
