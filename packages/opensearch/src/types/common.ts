import type {
  Indices_Create_Request,
  Indices_Create_RequestBody,
} from '@opensearch-project/opensearch/api/'
import type { Common_Mapping } from '@opensearch-project/opensearch/api/_types'
import type * as Common from '@opensearch-project/opensearch/api/_types/_common'
import type OpenSearchAPI from '@opensearch-project/opensearch/api/OpenSearchApi'
import type { NestedPaths } from './utilityTypes'

/**
 * Defines all possible field types in OpenSearch.
 */
export type FieldType = Common_Mapping.FieldType

/**
 * Defines all possible field value types in OpenSearch.
 */
export type FieldValue = Common.FieldValue

/**
 * Defines an OpenSearch field with optional properties.
 */
export type Property = Common_Mapping.Property

/**
 * Defines an OpenSearch index mapping.
 */
export type TypeMapping = Omit<Common_Mapping.TypeMapping, 'properties'> & {
  properties: Record<string, Property>
}

/**
 * Defines an OpenSearch index mapping configuration.
 */
export type IndicesCreateRequestBody = Omit<
  Indices_Create_RequestBody,
  'mappings'
> & {
  mappings: TypeMapping
}

/**
 * Defines an OpenSearch index with body required.
 */
export type IndexDefinition = Omit<Indices_Create_Request, 'body'> & {
  body: IndicesCreateRequestBody
}

/**
 * Converts OpenSearch field definitions into TypeScript types.
 */
export type MapOpenSearchTypes<T> = T extends Property
  ? T['type'] extends 'keyword' | 'text'
    ? string
    : T['type'] extends
          | 'integer'
          | 'long'
          | 'short'
          | 'byte'
          | 'float'
          | 'double'
      ? number
      : T['type'] extends 'boolean'
        ? boolean
        : T['type'] extends 'date' | 'date_nanos'
          ? Date
          : T['type'] extends 'object' | 'nested'
            ? T extends { properties: Record<string, Property> }
              ? {
                  [K in keyof T['properties']]: MapOpenSearchTypes<
                    T['properties'][K]
                  >
                }
              : never
            : never
  : T extends Record<string, Property>
    ? { [K in keyof T]: MapOpenSearchTypes<T[K]> }
    : never

export type MapQueryProperties<T extends IndexDefinition> = T extends {
  body: {
    mappings: { properties: infer P }
  }
}
  ? MapOpenSearchTypes<P> // ✅ Keep the full structure instead of modifying it
  : never

export type Indices = OpenSearchAPI['indices']

export type Sort<T> = SortOptions<T> | SortOptions<T>[]

export type SortOptions<T> =
  | '_score'
  | '_doc'
  | {
      _doc?: Common.ScoreSort
      _geo_distance?: Common.GeoDistanceSort
      _score?: Common.ScoreSort
      _script?: Common.ScriptSort
    }
  | Record<NestedPaths<T>, Common.FieldSort>

export type BuiltinKeys = '_id' | '_index'
