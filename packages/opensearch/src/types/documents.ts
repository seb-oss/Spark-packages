import type { IndexDefinition, MapOpenSearchTypes } from './common'
import type { Prettify } from './utilityTypes'

export type DocumentFor<T extends IndexDefinition> = Prettify<{
  -readonly [P in keyof T['body']['mappings']['properties']]?: MapOpenSearchTypes<
    T['body']['mappings']['properties'][P]
  >
}>
