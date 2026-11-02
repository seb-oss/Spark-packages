import type { IndexDefinition, MapOpenSearchTypes } from './common'
import type { Prettify } from './utilityTypes'

/**
 * A document in index `T`, as its mapping describes it. Only mapped fields are
 * included, so `keyof`, `Omit` and `Pick` work on it.
 */
export type DocumentFor<T extends IndexDefinition> = Prettify<{
  -readonly [P in keyof T['body']['mappings']['properties']]?: MapOpenSearchTypes<
    T['body']['mappings']['properties'][P]
  >
}>

/**
 * A document that can be written to index `T`. Mapped fields are typed from the
 * mapping. Unless the mapping sets `dynamic: 'strict'`, other fields are
 * accepted as `unknown`, as OpenSearch accepts them too.
 */
export type WritableDocument<T extends IndexDefinition> =
  T['body']['mappings'] extends { dynamic: 'strict' }
    ? DocumentFor<T>
    : DocumentFor<T> & Record<string, unknown>
