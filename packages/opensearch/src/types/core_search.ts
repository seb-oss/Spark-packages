import type { Types } from '@opensearch-project/opensearch'
import type { IndexDefinition, Sort } from './common'
import type { DocumentFor } from './documents'
import type { FieldQuery, QueryContainer } from './queries'
import type { NestedPaths } from './utilityTypes'

export type FieldCollapse<T> = Omit<
  Types.Core_Search.FieldCollapse,
  'field'
> & {
  field: NestedPaths<T>
}

export type Highlight<T> = Omit<Types.Core_Search.Highlight, 'fields'> & {
  fields: FieldQuery<T, Types.Core_Search.HighlightField>
}

export type InnerHits<T> = Omit<
  Types.Core_Search.InnerHits,
  'collapse' | 'highlight' | 'sort' | '_source'
> & {
  collapse?: FieldCollapse<T>
  highlight?: Highlight<T>
  sort?: Sort<T>
  _source?: SourceConfig<T>
}

export type Hit<T extends IndexDefinition> = Omit<
  Types.Core_Search.Hit,
  '_source'
> & {
  _source: DocumentFor<T>
}

export type HitsMetadata<T extends IndexDefinition> = Omit<
  Types.Core_Search.HitsMetadata,
  'hits'
> & {
  hits: Hit<T>[]
}

export type ResponseBody<T extends IndexDefinition> = Omit<
  Types.Core_Search.ResponseBody,
  'hits'
> & {
  hits: HitsMetadata<T>
}

export type RescoreQuery<T> = Omit<
  Types.Core_Search.RescoreQuery,
  'rescore_query'
> & {
  rescore_query: QueryContainer<T>
}

export type SourceConfig<T> = boolean | SourceFilter<T>

export type SourceConfigParam<T> = boolean | NestedPaths<T>[]

export type SourceFilter<T> =
  | NestedPaths<T>[]
  | {
      excludes?: NestedPaths<T>[]
      includes?: NestedPaths<T>[]
    }
