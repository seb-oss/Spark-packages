import { Exists, FilterBool, Match, NativeOpenSearchQueryBody, NativeOpenSearchType, OpenSearchFilter, OpenSearchQuery, SimpleFilterQueryString } from './openSearchTypes'
import { WithId } from './typescriptExtensions'
import omit from 'omit'

const omitId = omit('id')

export const fixIds = <T extends WithId, K = T>(searchQuery: OpenSearchQuery<T, K>) => {
  const q = searchQuery.body.query
  const body = {
    query: {
      bool: q.bool ? fixBool(q.bool) : undefined,
      match: q.match ? fixId(q.match) : undefined,
      collapse: q.collapse,
      exists: q.exists ? fixExists(q.exists) : undefined,
      fields: q.fields,
      filter: q.filter ? fixFilter(q.filter) : undefined,
      from: q.from,
      fuzzy: q.fuzzy ? fixId(q.fuzzy) : undefined,
      highlight: q.highlight,
      match_all: q.match_all,
      match_phrase: q.match_phrase ? fixId(q.match_phrase) : undefined,
      match_phrase_prefix: q.match_phrase_prefix ? fixId(q.match_phrase_prefix) : undefined,
      more_like_this: q.more_like_this ? fixWithFields(q.more_like_this) : undefined,
      multi_match: q.multi_match ? fixId(q.multi_match): undefined,
      prefix: q.prefix ? fixId(q.prefix) : undefined,
      range: q.range ? fixId(q.range) : undefined,
      regexp: q.regexp ? fixId(q.regexp) : undefined,
      script_score: q.script_score,
      size: q.size,
      term: q.term ? fixId(q.term) : undefined,
      terms: q.terms ? fixId(q.terms) : undefined,
      wildcard: q.wildcard ? fixId(q.wildcard) : undefined,
    },
  } as NativeOpenSearchQueryBody<NativeOpenSearchType<T>, K>

  return {
    ...searchQuery,
    body: {
      ...clean(body),
    }
  }
}

const fixBool = <T extends WithId>(bool: FilterBool<T>) => ({
  ...bool,
  filter: bool.filter
    ? Array.isArray(bool.filter) ? bool.filter.map(fixFilter) : fixFilter(bool.filter)
    : undefined,
  boost: bool.boost,
  minimum_should_match: bool.minimum_should_match,
  must: bool.must
    ? Array.isArray(bool.must) ? bool.must.map(fixFilter) : fixFilter(bool.must)
    : undefined,
  must_not: bool.must_not
    ? Array.isArray(bool.must_not) ? bool.must_not.map(fixFilter) : fixFilter(bool.must_not)
    : undefined,
  should: bool.should
    ? Array.isArray(bool.should) ? bool.should.map(fixFilter) : fixFilter(bool.should)
    : undefined,
} as FilterBool<NativeOpenSearchType<T>>)

const fixFilter = <T extends WithId>(filter: OpenSearchFilter<T>): OpenSearchFilter<NativeOpenSearchType<T>> => (clean({
  bool: filter.bool ? fixBool(filter.bool) : undefined,
  exists: filter.exists ? fixExists(filter.exists) : undefined,
  fuzzy: filter.fuzzy ? fixId(filter.fuzzy) : undefined,
  match: filter.match ? fixId(filter.match) : undefined,
  match_phrase: filter.match_phrase ? fixId(filter.match_phrase) : undefined,
  multi_match: filter.multi_match ? fixId(filter.multi_match) : undefined,
  match_phrase_prefix: filter.match_phrase_prefix ? fixId(filter.match_phrase_prefix) : undefined,
  prefix: filter.prefix ? fixId(filter.prefix) : undefined,
  query_string: filter.query_string ? fixWithFields(filter.query_string) : undefined,
  range: filter.range ? fixId(filter.range) : undefined,
  regexp: filter.regexp ? fixId(filter.regexp) : undefined,
  simple_query_string: filter.simple_query_string ? fixWithFields(filter.simple_query_string) : undefined,
  term: filter.term ? fixId(filter.term) : undefined,
  terms: filter.terms ? fixId(filter.terms) : undefined,
  wildcard: filter.wildcard ? fixId(filter.wildcard) : undefined,
}) as OpenSearchFilter<NativeOpenSearchType<T>>)

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const  fixWithFields = (old: any) => ({
  ...old,
  fields: old.fields ? old.fields.map(fixIdValue) : undefined,
})

const fixExists =  <T extends WithId>(exists: Exists<T>) => ({
  ...exists,
  field: fixIdValue(exists.field)
} as Exists<NativeOpenSearchType<T>>)

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const fixId = (old: any) => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const  fixed = omitId(old) as any
  if (old.id) fixed._id = old.id

  return fixed
}

const fixIdValue = (val: string) => val === 'id' ? '_id' : val

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const  clean = (obj: any) => Object.entries(obj)
  .filter(([, val]) => val !== undefined)
  // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
  .reduce((m, [prop, val]) => ({ ...m, [prop]: val }), {})
