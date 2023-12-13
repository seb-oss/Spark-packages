import type { RequestParams } from '@opensearch-project/opensearch'
import {
  DeepPartial,
  ExcludeId,
  NestedFields,
  NestedNumberPaths,
  NestedPaths,
  NestedStringPaths,
  SubstringOf,
  WithId,
} from './typescriptExtensions'

// OpenSearchFields: Selects specific fields from a data model.
type FieldName<T> = NestedStringPaths<ExcludeId<T>> | '*' | (string & {})
type FieldObject<T> = {
  field: FieldName<T>
  format?: string
}
type OpenSearchFields<T> = (FieldName<T> | FieldObject<T>)[]

type FuzzyOptions = {
  fuzziness?: string
  max_expansions?: number
  prefix_length?: number
  transpositions?: boolean
  rewrite?: string
}

export type Fuzzy<T> = {
  [P in NestedStringPaths<T>]?: {
    value: string
  } & FuzzyOptions
}

type TermOptions<T> = T extends string | number | boolean
  ? { value: T; boost?: number; case_insensitive?: boolean }
  : never

export type Term<T> = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [P in NestedPaths<T>]?: TermOptions<any>
}

type TermsProperty<T> = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [P in NestedPaths<T>]?: any[]
}

export type Terms<T> = TermsProperty<T> & {
  boost?: number
}

export type Range<T> = {
  [P in NestedNumberPaths<T>]: {
    gte?: number
    lte?: number
    gt?: number
    lt?: number
    boost?: number
  }
}

export type Exists<T> = {
  field: NestedPaths<T>
}

type Regexp<T> = {
  [P in NestedStringPaths<T>]:
    | string
    | {
        value: string
        flags?: string
        max_determinized_states?: number
        boost?: number
      }
}

export type StandardAnalyzer =
  | 'standard'
  | 'simple'
  | 'whitespace'
  | 'stop'
  | 'keyword'
  | 'pattern'
  | 'fingerprint'
export type LanguageAnalyzer =
  | 'arabic'
  | 'armenian'
  | 'basque'
  | 'bengali'
  | 'brazilian'
  | 'bulgarian'
  | 'catalan'
  | 'czech'
  | 'danish'
  | 'dutch'
  | 'english'
  | 'estonian'
  | 'finnish'
  | 'french'
  | 'galician'
  | 'german'
  | 'greek'
  | 'hindi'
  | 'hungarian'
  | 'indonesian'
  | 'irish'
  | 'italian'
  | 'latvian'
  | 'lithuanian'
  | 'norwegian'
  | 'persian'
  | 'portuguese'
  | 'romanian'
  | 'russian'
  | 'sorani'
  | 'spanish'
  | 'swedish'
  | 'turkish'
  | 'thai'
export type Analyzer = StandardAnalyzer | LanguageAnalyzer

export type Match<T> = {
  [P in NestedStringPaths<T>]:
    | string
    | {
        query: string
        operator?: 'and' | 'or'
        minimum_should_match?: number
        analyzer?: Analyzer
      }
}

type MultiMatchParam<T extends string> =
  | T
  | `${T}^${number}`
  | `${SubstringOf<T>}*`

export type MultiMatch<T> = {
  query: string
  fields: MultiMatchParam<NestedStringPaths<T>>[]
  type?:
    | 'best_fields'
    | 'most_fields'
    | 'cross_fields'
    | 'phrase'
    | 'phrase_prefix'
  operator?: 'and' | 'or'
}
export type SimpleFilterQueryString<T> = {
  query: string
  fields?: Array<keyof NestedFields<T>>
}
export type FilterQueryString<T> = SimpleFilterQueryString<T> & {
  default_field?: keyof NestedFields<T>
}
export type FilterBool<T> = {
  must?: OpenSearchFilter<T> | OpenSearchFilter<T>[]
  filter?: OpenSearchFilter<T> | OpenSearchFilter<T>[]
  should?: OpenSearchFilter<T> | OpenSearchFilter<T>[]
  must_not?: OpenSearchFilter<T> | OpenSearchFilter<T>[]
  minimum_should_match?: number
  boost?: number
}

// OpenSearchFilter: Allows filtering of results based on specific conditions.
export type OpenSearchFilter<T> = {
  term?: Term<T>
  terms?: Terms<T>
  range?: Range<T>
  exists?: Exists<T>
  fuzzy?: Fuzzy<T>
  prefix?: Partial<NestedFields<T>>
  wildcard?: Partial<NestedFields<T>>
  regexp?: Regexp<T>
  match?: Match<T>
  match_phrase?: Partial<NestedFields<T>>
  match_phrase_prefix?: Partial<NestedFields<T>>
  multi_match?: MultiMatch<T>
  query_string?: FilterQueryString<T>
  simple_query_string?: SimpleFilterQueryString<T>
  bool?: FilterBool<T>
}

export type Collapse<T> = { field: keyof NestedFields<T> }
export type Aggregations<T> = {
  [key: string]: { field?: keyof NestedFields<T> }
}
export type ScriptScore = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  script: { source: string; params?: { [key: string]: any } }
}
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Highlight<T> = { fields: { [P in keyof NestedFields<T>]?: {} } }
export type Prefix<T> = {
  [P in keyof NestedFields<T>]?:
    | NestedFields<T>[P]
    | { value: NestedFields<T>[P]; boost?: number }
}
export type Wildcard<T> = {
  [P in keyof NestedFields<T>]?:
    | NestedFields<T>[P]
    | { value: NestedFields<T>[P]; boost?: number }
}
export type MatchPhrase<T> = {
  [P in keyof NestedFields<T>]?:
    | NestedFields<T>[P]
    | {
        query: NestedFields<T>[P]
        analyzer?: string
        slop?: number
        boost?: number
      }
}
export type MatchPhrasePrefix<T> = {
  [P in keyof NestedFields<T>]?:
    | NestedFields<T>[P]
    | {
        query: NestedFields<T>[P]
        max_expansions?: number
        slop?: number
        boost?: number
      }
}
export type MoreLikeThis<T> = {
  fields: OpenSearchFields<T>
  like: string | string[] | { _index: string; _id: string }[]
  unlike?: string | string[] | { _index: string; _id: string }[]
  min_term_freq?: number
  max_query_terms?: number
  min_doc_freq?: number
  max_doc_freq?: number
  min_word_length?: number
  max_word_length?: number
  stop_words?: string[]
  analyzer?: string
  minimum_should_match?: number
  boost?: number
  include?: boolean
  fail_on_unsupported_field?: boolean
}

// OpenSearchQuery: Constructs an OpenSearch query.
export type OpenSearchQueryBody<
  T extends { id: string },
  K = T,
> = K extends DeepPartial<T>
  ? {
      query: {
        // Fields to return in the result
        fields?: OpenSearchFields<K>

        // Criteria to filter the results
        filter?: OpenSearchFilter<T>

        // Criteria to match the results
        match?: Match<T>

        // Criteria to match the results
        multi_match?: MultiMatch<T>

        // Number of results to skip (for pagination)
        from?: number

        // Number of results to return (for pagination)
        size?: number

        // Collapse results based on field values
        collapse?: Collapse<K>

        // Custom score calculation
        script_score?: ScriptScore

        // Highlight matching text snippets
        highlight?: Highlight<K>

        // A boolean query allows you to build complex query using logical operators
        bool?: FilterBool<T>

        // Range query to find documents where the field falls within a specified range
        range?: Range<T>

        // Exists query to find documents where a field exists or not
        exists?: Exists<T>

        // Terms query to find documents containing one or more exact terms
        terms?: Terms<T>

        // Term query to find documents containing a specific term
        term?: Term<T>

        // Fuzzy query to find documents containing terms similar to the search term
        fuzzy?: Fuzzy<T>

        // Prefix query to find documents having a field starting with a specific prefix
        prefix?: Prefix<T>

        // Wildcard query to find documents matching a wildcard pattern
        wildcard?: Wildcard<T>

        // Regexp query to find documents matching a regular expression
        regexp?: Regexp<T>

        // Match phrase query to find documents with exact phrases or proximity matches
        match_phrase?: MatchPhrase<T>

        // Match phrase prefix query to find documents with exact prefix phrases
        match_phrase_prefix?: MatchPhrasePrefix<T>

        // More_like_this query to find documents similar to specified documents
        more_like_this?: MoreLikeThis<T>
      }
    }
  : never

export type Sort<T> = {
  [P in keyof NestedFields<T>]?: { order: 'asc' | 'desc' }
}[]

export type OpenSearchQuery<
  T extends { id: string },
  K = T,
> = RequestParams.Search<OpenSearchQueryBody<T, K>> & K extends DeepPartial<T>
  ? {
      index: string

      body: OpenSearchQueryBody<T, K>

      // Aggregate results based on fields
      aggregations?: Aggregations<K>

      // Sort order for the results
      sort?: Sort<K>

      from?: number
      size?: number
    }
  : never

export type OpenSearchQueryResult<K> = {
  results: K[]
  total: number
  from: number
  size: number
}

// Define a type for basic Elasticsearch field types
export type BasicOpenSearchFieldTypes =
  | 'text'
  | 'keyword'
  | 'long'
  | 'integer'
  | 'short'
  | 'byte'
  | 'double'
  | 'float'
  | 'date'
  | 'boolean'
  | 'binary'

type ElementType<T> = T extends Array<infer U> ? U : T

// Utility type to suggest Elasticsearch field type based on TypeScript type
export type OpenSearchFieldType<T> = ElementType<T> extends string
  ? 'text' | 'keyword'
  : ElementType<T> extends number
    ? 'long' | 'integer' | 'short' | 'byte' | 'double' | 'float'
    : ElementType<T> extends boolean
      ? 'boolean'
      : ElementType<T> extends Date
        ? 'date'
        : BasicOpenSearchFieldTypes

// Define options for each field
export type FieldOptions<T> = {
  type: OpenSearchFieldType<T>
  // Add other Elasticsearch field mapping properties as needed
}

export type NestedFieldOptions<T> = {
  [P in keyof T]?: T[P] extends object
    ? NestedFieldOptions<T[P]>
    : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      FieldOptions<any>
}

// Map each property of T to its Elasticsearch field options
export type IndexOptions<T extends WithId> = {
  settings?: {
    index?: {
      number_of_shards: number
      number_of_replicas: number
    }
  }
  mappings?: {
    properties?: IndexProperties<ExcludeId<T>>
  }
  aliases?: Record<string, Record<string, never>>
}
export type IndexProperties<T> = {
  [K in keyof Partial<T>]: T[K] extends object
    ? T[K] extends Array<infer U>
      ? FieldOptions<T[K]>
      : IndexProperties<T[K]>
    : FieldOptions<T[K]>
}
