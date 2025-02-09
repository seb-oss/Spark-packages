import type { Common_QueryDsl } from '@opensearch-project/opensearch/api/_types'
import type { BuiltinKeys, FieldValue, MapOpenSearchTypes } from './common'
import type { NestedLeafPaths, NestedPaths } from './utilityTypes'

export type BoolQuery<T> = Omit<
  Common_QueryDsl.BoolQuery,
  'must' | 'should' | 'filter' | 'must_not'
> & {
  must?: QueryContainer<T>[]
  should?: QueryContainer<T>[]
  filter?: QueryContainer<T>[]
  must_not?: QueryContainer<T>[]
}

export type BoostingQuery<T> = Omit<
  Common_QueryDsl.BoostingQuery,
  'positive' | 'negative'
> & {
  positive: QueryContainer<T>
  negative: QueryContainer<T>
}

export type CombinedFieldsQuery<T> = Omit<
  Common_QueryDsl.CombinedFieldsQuery,
  'fields'
> & {
  fields: NestedPaths<T>[]
}

export type CommonTermsQuery = Common_QueryDsl.CommonTermsQuery

export type ConstantScoreQuery<T> = Omit<
  Common_QueryDsl.ConstantScoreQuery,
  'filter'
> & {
  filter: QueryContainer<T>
}

export type DateDecayFunction = Common_QueryDsl.DateDecayFunction

export type DateDistanceFeatureQuery = Common_QueryDsl.DateDistanceFeatureQuery

export type DateRangeQuery = Common_QueryDsl.DateRangeQuery

export type DecayFunction = Common_QueryDsl.DecayFunction

export type DecayFunctionBase = Common_QueryDsl.DecayFunctionBase

export type DisMaxQuery<T> = Omit<Common_QueryDsl.DisMaxQuery, 'queries'> & {
  queries: QueryContainer<T>[]
}

export type DistanceFeatureQuery<T> = Omit<
  Common_QueryDsl.DistanceFeatureQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type ExistsQuery<T> = Omit<Common_QueryDsl.ExistsQuery, 'field'> & {
  field: NestedPaths<T>
}

export type FieldAndFormat<T> = Omit<
  Common_QueryDsl.FieldAndFormat,
  'field'
> & {
  field: NestedPaths<T>
}

export type FieldQuery<T, K> = Partial<
  Record<NestedLeafPaths<T> | BuiltinKeys, K>
>

export type FieldValueFactorScoreFunction<T> = Omit<
  Common_QueryDsl.FieldValueFactorScoreFunction,
  'field'
> & {
  field: NestedPaths<T>
}

export type FunctionBoostMode = Common_QueryDsl.FunctionBoostMode

export type FunctionScoreQuery<T> = Omit<
  Common_QueryDsl.FunctionScoreQuery,
  'query'
> & {
  query?: QueryContainer<T> | undefined
}

export type FuzzyQuery = Common_QueryDsl.FuzzyQuery

export type GeoBoundingBoxQuery = Common_QueryDsl.GeoBoundingBoxQuery

export type GeoDecayFunction = Common_QueryDsl.GeoDecayFunction

export type GeoDistanceFeatureQuery = Common_QueryDsl.GeoDistanceFeatureQuery

export type GeoDistanceQuery = Common_QueryDsl.GeoDistanceQuery

export type GeoExecution = Common_QueryDsl.GeoExecution

export type GeoPolygonQuery<T> = Omit<
  Common_QueryDsl.GeoPolygonQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type GeoShapeQuery<T> = Omit<
  Common_QueryDsl.GeoShapeQuery,
  'ignore_unmapped' | 'field'
> & {
  field: NestedPaths<T>
}

export type GeoValidationMethod = Common_QueryDsl.GeoValidationMethod

export type HasChildQuery<T> = Omit<Common_QueryDsl.HasChildQuery, 'query'> & {
  query: QueryContainer<T>
}

export type HasParentQuery<T> = Omit<
  Common_QueryDsl.HasParentQuery,
  'query'
> & {
  query: QueryContainer<T>
}

export type HybridQuery<T> = Omit<Common_QueryDsl.HybridQuery, 'queries'> & {
  queries?: QueryContainer<T>[]
}

export type IdsQuery = Common_QueryDsl.IdsQuery

export type IntervalsQuery = Common_QueryDsl.IntervalsQuery

export type KnnQuery<T> = Omit<Common_QueryDsl.KnnQuery, 'filter'> & {
  filter?: QueryContainer<T>[]
}

export type Like = Common_QueryDsl.Like

export type LikeDocument = Common_QueryDsl.LikeDocument

export type MatchAllQuery = Common_QueryDsl.MatchAllQuery

export type MatchBoolPrefixQuery<T> = Omit<
  Common_QueryDsl.MatchBoolPrefixQuery,
  'query' | 'fields'
> & {
  fields: NestedPaths<T>[]
  query: string
}

export type MatchNoneQuery = Common_QueryDsl.MatchNoneQuery

export type MatchPhrasePrefixQuery<T> = Omit<
  Common_QueryDsl.MatchPhrasePrefixQuery,
  'query' | 'field'
> & {
  field: NestedPaths<T>
  query: string
}

export type MatchPhraseQuery<T> = Omit<
  Common_QueryDsl.MatchPhraseQuery,
  'query' | 'field'
> & {
  field: NestedPaths<T>
  query: string
}

export type MatchQuery = FieldValue | Common_QueryDsl.MatchQuery

export type MoreLikeThisQuery<T> = Omit<
  Common_QueryDsl.MoreLikeThisQuery,
  'fields'
> & {
  fields?: NestedPaths<T>[]
}

export type MultiMatchQuery<T> = Omit<
  Common_QueryDsl.MultiMatchQuery,
  'fields'
> & {
  fields?: NestedPaths<T>[]
}

export type NestedQuery<T> = Omit<
  Common_QueryDsl.NestedQuery,
  'query' | 'path'
> & {
  path: NestedPaths<T>
  query: QueryContainer<T>
}

export type NeuralQuery<T> = Omit<Common_QueryDsl.NeuralQuery, 'filter'> & {
  filter?: QueryContainer<T>
}

export type NumberRangeQuery<T> = Omit<
  Common_QueryDsl.NumberRangeQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type ParentIdQuery = Common_QueryDsl.ParentIdQuery

export type PercolateQuery<T> = Omit<
  Common_QueryDsl.PercolateQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type PinnedQuery = Common_QueryDsl.PinnedQuery

export type PrefixQuery<T> = Omit<
  Common_QueryDsl.PrefixQuery,
  'value' | 'field'
> & {
  field: NestedPaths<T>
  value: MapOpenSearchTypes<T>
}

export type QueryContainer<T> = Omit<
  Common_QueryDsl.QueryContainer,
  | 'bool'
  | 'boosting'
  | 'combined_fields'
  | 'common'
  | 'constant_score'
  | 'dis_max'
  | 'distance_feature'
  | 'exists'
  | 'function_score'
  | 'fuzzy'
  | 'geo_bounding_box'
  | 'geo_distance'
  | 'geo_polygon'
  | 'geo_shape'
  | 'has_child'
  | 'has_parent'
  | 'hybrid'
  | 'ids'
  | 'intervals'
  | 'knn'
  | 'match'
  | 'match_all'
  | 'match_bool_prefix'
  | 'match_none'
  | 'match_phrase'
  | 'match_phrase_prefix'
  | 'more_like_this'
  | 'multi_match'
  | 'nested'
  | 'neural'
  | 'parent_id'
  | 'percolate'
  | 'pinned'
  | 'prefix'
  | 'query_string'
  | 'range'
  | 'rank_feature'
  | 'regexp'
  | 'script'
  | 'script_score'
  | 'simple_query_string'
  | 'span_containing'
  | 'span_first'
  | 'span_multi'
  | 'span_near'
  | 'span_not'
  | 'span_or'
  | 'span_term'
  | 'span_within'
  | 'term'
  | 'terms'
  | 'terms_set'
  | 'type'
  | 'wildcard'
  | 'wrapper'
  | 'xy_shape'
> & {
  bool?: BoolQuery<T>
  boosting?: BoostingQuery<T>
  combined_fields?: CombinedFieldsQuery<T>
  common?: FieldQuery<T, Common_QueryDsl.CommonTermsQuery>
  constant_score?: ConstantScoreQuery<T>
  dis_max?: DisMaxQuery<T>
  distance_feature?: DistanceFeatureQuery<T>
  exists?: ExistsQuery<T>
  function_score?: FunctionScoreQuery<T>
  fuzzy?: FieldQuery<T, Common_QueryDsl.FuzzyQuery>
  geo_bounding_box?: GeoBoundingBoxQuery
  geo_distance?: GeoDistanceQuery
  geo_polygon?: GeoPolygonQuery<T>
  geo_shape?: GeoShapeQuery<T>
  has_child?: HasChildQuery<T>
  has_parent?: HasParentQuery<T>
  hybrid?: HybridQuery<T>
  ids?: IdsQuery
  intervals?: FieldQuery<T, IntervalsQuery>
  knn?: FieldQuery<T, KnnQuery<T>>
  match?: FieldQuery<T, MatchQuery>
  match_all?: MatchAllQuery
  match_bool_prefix?: FieldQuery<T, MatchBoolPrefixQuery<T>>
  match_none?: MatchNoneQuery
  match_phrase?: FieldQuery<T, MatchPhraseQuery<T>>
  match_phrase_prefix?: FieldQuery<T, MatchPhrasePrefixQuery<T>>
  more_like_this?: MoreLikeThisQuery<T>
  multi_match?: MultiMatchQuery<T>
  nested?: NestedQuery<T>
  neural?: FieldQuery<T, NeuralQuery<T>>
  parent_id?: ParentIdQuery
  percolate?: PercolateQuery<T>
  pinned?: PinnedQuery
  prefix?: FieldQuery<T, PrefixQuery<T>>
  query_string?: QueryStringQuery
  range?: FieldQuery<T, RangeQuery<T>>
  rank_feature?: RankFeatureQuery
  regexp?: FieldQuery<T, RegexpQuery<T>>
  script?: ScriptQuery
  script_score?: ScriptScoreQuery<T>
  simple_query_string?: SimpleQueryStringQuery<T>
  span_containing?: SpanContainingQuery<T>
  span_first?: SpanFirstQuery<T>
  span_multi?: SpanMultiTermQuery<T>
  span_near?: SpanNearQuery<T>
  span_not?: SpanNotQuery<T>
  span_or?: SpanOrQuery<T>
  span_term?: FieldQuery<T, SpanTermQuery<T>>
  span_within?: SpanWithinQuery<T>
  term?: FieldQuery<T, TermQuery<T>>
  terms?: TermsQuery<T>
  terms_set?: FieldQuery<T, TermsSetQuery<T>>
  type?: TypeQuery
  wildcard?: FieldQuery<T, WildcardQuery<T>>
  wrapper?: WrapperQuery
  xy_shape?: XyShapeQuery<T>
}

export type QueryStringQuery = Common_QueryDsl.QueryStringQuery

export type RangeQuery<T> = Omit<Common_QueryDsl.RangeQuery, 'field'> & {
  field: NestedPaths<T>
}

export type RankFeatureQuery = Common_QueryDsl.RankFeatureQuery

export type RegexpQuery<T> = Omit<
  Common_QueryDsl.RegexpQuery,
  'value' | 'field'
> & {
  field: NestedPaths<T>
  value: MapOpenSearchTypes<T>
}

export type ScriptQuery = Common_QueryDsl.ScriptQuery

export type ScriptScoreQuery<T> = Omit<
  Common_QueryDsl.ScriptScoreQuery,
  'query'
> & {
  query?: QueryContainer<T>
}

export type SimpleQueryStringQuery<T> = Omit<
  Common_QueryDsl.SimpleQueryStringQuery,
  'fields'
> & {
  fields: NestedLeafPaths<T>[]
}

export type SpanQuery<T> = Omit<
  Common_QueryDsl.SpanQuery,
  | 'field_masking_span'
  | 'span_containing'
  | 'span_first'
  | 'span_multi'
  | 'span_near'
  | 'span_not'
  | 'span_or'
  | 'span_term'
  | 'span_within'
> & {
  field_masking_span?: SpanFieldMaskingQuery<T>
  span_containing?: SpanContainingQuery<T>
  span_first?: SpanFirstQuery<T>
  span_multi?: SpanMultiTermQuery<T>
  span_near?: SpanNearQuery<T>
  span_not?: SpanNotQuery<T>
  span_or?: SpanOrQuery<T>
  span_term?: Record<NestedPaths<T>, SpanTermQuery<T>>
  span_within?: SpanWithinQuery<T>
}

export type SpanContainingQuery<T> = Omit<
  Common_QueryDsl.SpanContainingQuery,
  'big' | 'little'
> & {
  big: SpanQuery<T>
  little: SpanQuery<T>
}

export type SpanFieldMaskingQuery<T> = Omit<
  Common_QueryDsl.SpanFieldMaskingQuery,
  'field' | 'query'
> & {
  field: NestedPaths<T>
  query: SpanQuery<T>
}

export type SpanFirstQuery<T> = Omit<
  Common_QueryDsl.SpanFirstQuery,
  'match'
> & {
  match: SpanQuery<T>
}

export type SpanMultiTermQuery<T> = Omit<
  Common_QueryDsl.SpanMultiTermQuery,
  'match'
> & {
  match: QueryContainer<T>
}

export type SpanNearQuery<T> = Omit<
  Common_QueryDsl.SpanNearQuery,
  'clauses'
> & {
  clauses: SpanQuery<T>[]
}

export type SpanNotQuery<T> = Omit<
  Common_QueryDsl.SpanNotQuery,
  'include' | 'exclude'
> & {
  include: SpanQuery<T>
  exclude: SpanQuery<T>
}

export type SpanOrQuery<T> = Omit<Common_QueryDsl.SpanOrQuery, 'clauses'> & {
  clauses: SpanQuery<T>[]
}

export type SpanTermQuery<T> = Omit<
  Common_QueryDsl.SpanTermQuery,
  'value' | 'field'
> & {
  field: NestedPaths<T>
  value: MapOpenSearchTypes<T>
}

export type SpanWithinQuery<T> = Omit<
  Common_QueryDsl.SpanWithinQuery,
  'big' | 'little'
> & {
  big: SpanQuery<T>
  little: SpanQuery<T>
}

export type TermQuery<T> = Omit<
  Common_QueryDsl.TermQuery,
  'value' | 'field'
> & {
  field: NestedPaths<T>
  value: MapOpenSearchTypes<T>
}

export type TermsQuery<T> = Omit<
  Common_QueryDsl.TermsQuery,
  'terms' | 'field'
> & {
  field: NestedPaths<T>
  terms: FieldValue[]
}

export type TermsSetQuery<T> = Omit<
  Common_QueryDsl.TermsSetQuery,
  'terms' | 'field'
> & {
  field: NestedPaths<T>
  terms: FieldValue[]
}

export type TypeQuery = Common_QueryDsl.TypeQuery

export type WildcardQuery<T> = Omit<
  Common_QueryDsl.WildcardQuery,
  'value' | 'field'
> & {
  field: NestedPaths<T>
  value: MapOpenSearchTypes<T>
}

export type WrapperQuery = Common_QueryDsl.WrapperQuery

export type XyShapeQuery<T> = Omit<Common_QueryDsl.XyShapeQuery, 'field'> & {
  field: NestedPaths<T>
}
