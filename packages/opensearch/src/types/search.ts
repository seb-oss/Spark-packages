import type {
  Search_Request,
  Search_RequestBody,
  Search_Response,
  Search_ResponseBody,
} from '@opensearch-project/opensearch/api'
import type { IndexDefinition, MapQueryProperties, Sort } from './common'
import type {
  FieldCollapse,
  Highlight,
  HitsMetadata,
  SourceConfig,
} from './core_search'
import type { QueryContainer } from './queries'

export type SearchRequest<T extends IndexDefinition> = Omit<
  Search_Request,
  'body' | 'index'
> & {
  index: T['index']
  body: SearchRequestBody<T>
}

export type SearchRequestBody<T extends IndexDefinition> = Omit<
  Search_RequestBody,
  'query' | 'collapse' | 'highlight' | 'sort' | '_source'
> & {
  query?: QueryContainer<MapQueryProperties<T>>
  collapse?: FieldCollapse<MapQueryProperties<T>>
  highlight?: Highlight<MapQueryProperties<T>>
  sort?: Sort<MapQueryProperties<T>>
  _source?: SourceConfig<MapQueryProperties<T>>
}

export type SearchResponse<T extends IndexDefinition> = Omit<
  Search_Response,
  'body'
> & {
  body: SearchResponseBody<T>
}

export type SearchResponseBody<T extends IndexDefinition> = Omit<
  Search_ResponseBody,
  'hits'
> & {
  hits: HitsMetadata<T>
}
