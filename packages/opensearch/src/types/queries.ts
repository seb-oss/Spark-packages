import type { Types } from '@opensearch-project/opensearch'
import type { BuiltinKeys, FieldValue } from './common'
import type { NestedLeafPaths, NestedPaths } from './utilityTypes'

export type BoolQuery<T> = Omit<
  Types.Common_QueryDsl.BoolQuery,
  'must' | 'should' | 'filter' | 'must_not'
> & {
  must?: QueryContainer<T> | QueryContainer<T>[]
  should?: QueryContainer<T> | QueryContainer<T>[]
  filter?: QueryContainer<T> | QueryContainer<T>[]
  must_not?: QueryContainer<T> | QueryContainer<T>[]
}

export type BoostingQuery<T> = Omit<
  Types.Common_QueryDsl.BoostingQuery,
  'positive' | 'negative'
> & {
  positive: QueryContainer<T>
  negative: QueryContainer<T>
}

export type CombinedFieldsQuery<T> = Omit<
  Types.Common_QueryDsl.CombinedFieldsQuery,
  'fields'
> & {
  fields: NestedPaths<T>[]
}

export type CommonTermsQuery = Types.Common_QueryDsl.CommonTermsQuery

export type ConstantScoreQuery<T> = Omit<
  Types.Common_QueryDsl.ConstantScoreQuery,
  'filter'
> & {
  filter: QueryContainer<T>
}

export type DecayFunction = Types.Common_QueryDsl.DecayFunction

export type DecayFunctionBase = Types.Common_QueryDsl.DecayFunctionBase

export type DisMaxQuery<T> = Omit<
  Types.Common_QueryDsl.DisMaxQuery,
  'queries'
> & {
  queries: QueryContainer<T>[]
}

export type DistanceFeatureQuery<T> = Omit<
  Types.Common_QueryDsl.DistanceFeatureQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type ExistsQuery<T> = Omit<
  Types.Common_QueryDsl.ExistsQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type FieldAndFormat<T> = Omit<
  Types.Common_QueryDsl.FieldAndFormat,
  'field'
> & {
  field: NestedPaths<T>
}

export type FieldQuery<T, K> = Partial<
  Record<NestedLeafPaths<T> | BuiltinKeys, K>
>

export type FieldValueFactorScoreFunction<T> = Omit<
  Types.Common_QueryDsl.FieldValueFactorScoreFunction,
  'field'
> & {
  field: NestedPaths<T>
}

export type FunctionBoostMode = Types.Common_QueryDsl.FunctionBoostMode

export type FunctionScoreQuery<T> = Omit<
  Types.Common_QueryDsl.FunctionScoreQuery,
  'query'
> & {
  query?: QueryContainer<T> | undefined
}

export type FuzzyQuery = Types.Common_QueryDsl.FuzzyQuery

export type GeoExecution = Types.Common_QueryDsl.GeoExecution

export type GeoPolygonQuery<T> = Omit<
  Types.Common_QueryDsl.GeoPolygonQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type GeoShapeQuery<T> = Omit<
  Types.Common_QueryDsl.GeoShapeQuery,
  'ignore_unmapped' | 'field'
> & {
  field: NestedPaths<T>
}

export type GeoValidationMethod = Types.Common_QueryDsl.GeoValidationMethod

export type HasChildQuery<T> = Omit<
  Types.Common_QueryDsl.HasChildQuery,
  'query'
> & {
  query: QueryContainer<T>
}

export type HasParentQuery<T> = Omit<
  Types.Common_QueryDsl.HasParentQuery,
  'query'
> & {
  query: QueryContainer<T>
}

export type HybridQuery<T> = Omit<
  Types.Common_QueryDsl.HybridQuery,
  'queries'
> & {
  queries?: QueryContainer<T>[]
}

export type IntervalsQuery = Types.Common_QueryDsl.IntervalsQuery

export type KnnQuery<T> = Omit<Types.Common_QueryDsl.KnnQuery, 'filter'> & {
  filter?: QueryContainer<T>[]
}

export type Like = Types.Common_QueryDsl.Like

export type LikeDocument = Types.Common_QueryDsl.LikeDocument

export type MatchBoolPrefixQuery<T> = Omit<
  Types.Common_QueryDsl.MatchBoolPrefixQuery,
  'query' | 'fields'
> & {
  fields: NestedPaths<T>[]
  query: string
}

export type MatchPhrasePrefixQuery<T> = Omit<
  Types.Common_QueryDsl.MatchPhrasePrefixQuery,
  'query' | 'field'
> & {
  field: NestedPaths<T>
  query: string
}

export type MatchPhraseQuery<T> = Omit<
  Types.Common_QueryDsl.MatchPhraseQuery,
  'query' | 'field'
> & {
  field: NestedPaths<T>
  query: string
}

export type MatchQuery = FieldValue | Types.Common_QueryDsl.MatchQuery

export type MoreLikeThisQuery<T> = Omit<
  Types.Common_QueryDsl.MoreLikeThisQuery,
  'fields'
> & {
  fields?: NestedPaths<T>[]
}

export type MultiMatchQuery<T> = Omit<
  Types.Common_QueryDsl.MultiMatchQuery,
  'fields'
> & {
  fields?: NestedPaths<T>[]
}

export type NestedQuery<T> = Omit<
  Types.Common_QueryDsl.NestedQuery,
  'query' | 'path'
> & {
  path: NestedPaths<T>
  query: QueryContainer<T>
}

export type NeuralQuery<T> = Omit<
  Types.Common_QueryDsl.NeuralQuery,
  'filter'
> & {
  filter?: QueryContainer<T>
}

export type PercolateQuery<T> = Omit<
  Types.Common_QueryDsl.PercolateQuery,
  'field'
> & {
  field: NestedPaths<T>
}

export type PrefixQuery = Types.Common_QueryDsl.PrefixQuery

export type QueryContainer<T> = Omit<
  Types.Common_QueryDsl.QueryContainer,
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
  | 'geo_polygon'
  | 'geo_shape'
  | 'has_child'
  | 'has_parent'
  | 'hybrid'
  | 'intervals'
  | 'knn'
  | 'match'
  | 'match_bool_prefix'
  | 'match_phrase'
  | 'match_phrase_prefix'
  | 'more_like_this'
  | 'multi_match'
  | 'nested'
  | 'neural'
  | 'percolate'
  | 'prefix'
  | 'range'
  | 'rank_feature'
  | 'regexp'
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
  | 'wildcard'
  | 'xy_shape'
> & {
  bool?: BoolQuery<T>
  boosting?: BoostingQuery<T>
  combined_fields?: CombinedFieldsQuery<T>
  common?: FieldQuery<T, Types.Common_QueryDsl.CommonTermsQuery>
  constant_score?: ConstantScoreQuery<T>
  dis_max?: DisMaxQuery<T>
  distance_feature?: DistanceFeatureQuery<T>
  exists?: ExistsQuery<T>
  function_score?: FunctionScoreQuery<T>
  fuzzy?: FieldQuery<T, Types.Common_QueryDsl.FuzzyQuery>
  geo_polygon?: GeoPolygonQuery<T>
  geo_shape?: GeoShapeQuery<T>
  has_child?: HasChildQuery<T>
  has_parent?: HasParentQuery<T>
  hybrid?: HybridQuery<T>
  intervals?: FieldQuery<T, IntervalsQuery>
  knn?: FieldQuery<T, KnnQuery<T>>
  match?: FieldQuery<T, MatchQuery>
  match_bool_prefix?: FieldQuery<T, MatchBoolPrefixQuery<T>>
  match_phrase?: FieldQuery<T, MatchPhraseQuery<T>>
  match_phrase_prefix?: FieldQuery<T, MatchPhrasePrefixQuery<T>>
  more_like_this?: MoreLikeThisQuery<T>
  multi_match?: MultiMatchQuery<T>
  nested?: NestedQuery<T>
  neural?: FieldQuery<T, NeuralQuery<T>>
  percolate?: PercolateQuery<T>
  prefix?: FieldQuery<T, PrefixQuery>
  range?: FieldQuery<T, Types.Common_QueryDsl.RangeQuery>
  rank_feature?: RankFeatureQuery
  regexp?: FieldQuery<T, RegexpQuery>
  script_score?: ScriptScoreQuery<T>
  simple_query_string?: SimpleQueryStringQuery<T>
  span_containing?: SpanContainingQuery<T>
  span_first?: SpanFirstQuery<T>
  span_multi?: SpanMultiTermQuery<T>
  span_near?: SpanNearQuery<T>
  span_not?: SpanNotQuery<T>
  span_or?: SpanOrQuery<T>
  span_term?: FieldQuery<T, SpanTermQuery>
  span_within?: SpanWithinQuery<T>
  term?: FieldQuery<T, TermQuery>
  terms?: TermsQuery<T>
  terms_set?: FieldQuery<T, TermsSetQuery>
  wildcard?: FieldQuery<T, WildcardQuery>
  xy_shape?: XyShapeQuery<T>
}

export type RankFeatureQuery = Types.Common_QueryDsl.RankFeatureQuery

export type RegexpQuery = Types.Common_QueryDsl.RegexpQuery

export type ScriptScoreQuery<T> = Omit<
  Types.Common_QueryDsl.ScriptScoreQuery,
  'query'
> & {
  query?: QueryContainer<T>
}

export type SimpleQueryStringQuery<T> = Omit<
  Types.Common_QueryDsl.SimpleQueryStringQuery,
  'fields'
> & {
  fields: NestedLeafPaths<T>[]
}

export type SpanQuery<T> = Omit<
  Types.Common_QueryDsl.SpanQuery,
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
  span_term?: Record<NestedPaths<T>, SpanTermQuery>
  span_within?: SpanWithinQuery<T>
}

export type SpanContainingQuery<T> = Omit<
  Types.Common_QueryDsl.SpanContainingQuery,
  'big' | 'little'
> & {
  big: SpanQuery<T>
  little: SpanQuery<T>
}

export type SpanFieldMaskingQuery<T> = Omit<
  Types.Common_QueryDsl.SpanFieldMaskingQuery,
  'field' | 'query'
> & {
  field: NestedPaths<T>
  query: SpanQuery<T>
}

export type SpanFirstQuery<T> = Omit<
  Types.Common_QueryDsl.SpanFirstQuery,
  'match'
> & {
  match: SpanQuery<T>
}

export type SpanMultiTermQuery<T> = Omit<
  Types.Common_QueryDsl.SpanMultiTermQuery,
  'match'
> & {
  match: QueryContainer<T>
}

export type SpanNearQuery<T> = Omit<
  Types.Common_QueryDsl.SpanNearQuery,
  'clauses'
> & {
  clauses: SpanQuery<T>[]
}

export type SpanNotQuery<T> = Omit<
  Types.Common_QueryDsl.SpanNotQuery,
  'include' | 'exclude'
> & {
  include: SpanQuery<T>
  exclude: SpanQuery<T>
}

export type SpanOrQuery<T> = Omit<
  Types.Common_QueryDsl.SpanOrQuery,
  'clauses'
> & {
  clauses: SpanQuery<T>[]
}

export type SpanTermQuery = Types.Common_QueryDsl.SpanTermQuery

export type SpanWithinQuery<T> = Omit<
  Types.Common_QueryDsl.SpanWithinQuery,
  'big' | 'little'
> & {
  big: SpanQuery<T>
  little: SpanQuery<T>
}

export type TermQuery = Types.Common_QueryDsl.TermQuery

export type TermsQuery<T> = FieldQuery<T, FieldValue[]>

export type TermsSetQuery = Omit<
  Types.Common_QueryDsl.TermsSetQuery,
  'terms'
> & {
  terms: FieldValue[]
}

export type WildcardQuery = Types.Common_QueryDsl.WildcardQuery

export type XyShapeQuery<T> = Omit<
  Types.Common_QueryDsl.XyShapeQuery,
  'field'
> & {
  field: NestedPaths<T>
}
