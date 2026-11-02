import type { Types } from '@opensearch-project/opensearch'
import type {
  FieldPaths,
  IndexDefinition,
  MapQueryProperties,
  QueryProperties,
  Sort,
} from './common'
import type { SourceConfig } from './core_search'
import type { QueryContainer } from './queries'
import type { Suggest } from './utilityTypes'

type Upstream = Types.Common_Aggregations.AggregationContainer
type BucketAggregationBase = Types.Common_Aggregations.BucketAggregationBase
type FormatMetricAggregationBase =
  Types.Common_Aggregations.FormatMetricAggregationBase

/**
 * `field`/`script` for a value source. `field` autocompletes paths in the
 * index mapping but accepts any field name, e.g. one added by dynamic
 * mapping. Restores what `@opensearch-project/opensearch` 3.9.0 dropped from
 * its generated types (opensearch-js#1154).
 */
export type ValueSource<T extends IndexDefinition> = {
  field?: Suggest<FieldPaths<T>>
  script?: Types.Common.Script
}

/**
 * Sub-aggregations of a bucket aggregation, typed against the same index.
 */
export type SubAggregations<T extends IndexDefinition> = {
  aggregations?: Record<string, AggregationContainer<T>>
  aggs?: Record<string, AggregationContainer<T>>
}

/**
 * Metric and bucket aggregations whose upstream types are overridden with
 * index-aware ones.
 */
export type IndexAwareAggregations<T extends IndexDefinition> = {
  avg: FormatMetricAggregationBase & ValueSource<T>
  cardinality: Types.Common_Aggregations.CardinalityAggregation & ValueSource<T>
  max: Types.Common_Aggregations.MaxAggregation & ValueSource<T>
  min: Types.Common_Aggregations.MinAggregation & ValueSource<T>
  sum: FormatMetricAggregationBase & ValueSource<T>
  value_count: FormatMetricAggregationBase & ValueSource<T>
  terms: Types.Common_Aggregations.TermsAggregationFields & ValueSource<T>
  date_histogram: Omit<
    Types.Common_Aggregations.DateHistogramAggregationFields,
    'field'
  > &
    ValueSource<T>
  date_range: Omit<
    Types.Common_Aggregations.DateRangeAggregationFields,
    'field'
  > &
    Pick<ValueSource<T>, 'field'>
  range: Omit<Types.Common_Aggregations.RangeAggregationFields, 'field'> &
    ValueSource<T>
  filter: QueryContainer<QueryProperties<T>> &
    Types.Common_QueryDsl.QueryContainer
  top_hits: Omit<
    Types.Common_Aggregations.TopHitsAggregation,
    'sort' | '_source'
  > & {
    sort?: Sort<T> & Types.Common_Aggregations.TopHitsAggregation['sort']
    _source?: SourceConfig<MapQueryProperties<T>> &
      Types.Core_Search.SourceConfig
  }
}

type BucketAggregationName =
  | 'terms'
  | 'date_histogram'
  | 'date_range'
  | 'range'
  | 'filter'

type OverriddenName = keyof IndexAwareAggregations<IndexDefinition>

type IndexAwareContainer<T extends IndexDefinition> = {
  [K in OverriddenName]: {
    [P in K]: IndexAwareAggregations<T>[K]
  } & (K extends BucketAggregationName ? SubAggregations<T> : unknown)
}[OverriddenName]

type HasKey<K extends PropertyKey> = K extends unknown
  ? Record<K, unknown>
  : never

/**
 * Upstream variants that are not overridden keep their type, but bucket
 * aggregations get index-aware sub-aggregations.
 */
type UpstreamContainer<T extends IndexDefinition> =
  Exclude<Upstream, HasKey<OverriddenName>> extends infer U
    ? U extends BucketAggregationBase
      ? Omit<U, keyof BucketAggregationBase> & SubAggregations<T>
      : U
    : never

/**
 * An aggregation in a search request, typed against index `T`.
 */
export type AggregationContainer<T extends IndexDefinition> =
  Types.Common_Aggregations.Aggregation &
    (IndexAwareContainer<T> | UpstreamContainer<T>)
