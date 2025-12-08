import type { IndexDefinition, MapOpenSearchTypes } from './common'

export type DocumentFor<T extends IndexDefinition> = {
  -readonly [P in keyof T['body']['mappings']['properties']]?: MapOpenSearchTypes<
    T['body']['mappings']['properties'][P]
  >
}
