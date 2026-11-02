import type { IndexDefinition, MapOpenSearchTypes } from './common'
import type { Prettify } from './utilityTypes'

/**
 * A document in index `T`. Mapped fields are typed from the mapping; other
 * fields are accepted as `unknown`, since OpenSearch maps them dynamically.
 */
export type DocumentFor<T extends IndexDefinition> = Prettify<
  {
    -readonly [P in keyof T['body']['mappings']['properties']]?: MapOpenSearchTypes<
      T['body']['mappings']['properties'][P]
    >
  } & Record<string, unknown>
>
