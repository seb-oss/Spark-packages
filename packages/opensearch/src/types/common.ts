import type { API, Client, Types } from '@opensearch-project/opensearch'
import type { NestedPaths } from './utilityTypes'

/**
 * Defines all possible field types in OpenSearch.
 */
export type FieldType = Types.Common_Mapping.FieldType

/**
 * Defines all possible field value types in OpenSearch.
 */
export type FieldValue = Types.Common.FieldValue

/**
 * Defines an OpenSearch field with optional properties.
 */
export type Property = Types.Common_Mapping.Property

/**
 * Defines an OpenSearch index mapping.
 */
export type TypeMapping = Omit<
  Types.Common_Mapping.TypeMapping,
  'properties'
> & {
  properties: Record<string, Property>
}

/**
 * Defines an OpenSearch index mapping configuration.
 */
export type IndicesCreateRequestBody = Omit<
  API.Indices_Create_RequestBody,
  'mappings'
> & {
  mappings: TypeMapping
}

/**
 * Defines an OpenSearch index with body required.
 */
export type IndexDefinition = Omit<API.Indices_Create_Request, 'body'> & {
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
                  -readonly [K in keyof T['properties']]:
                    | MapOpenSearchTypes<T['properties'][K]>
                    | undefined
                }
              : T extends { dynamic: 'true' }
                ? Record<string, unknown>
                : never
            : never
  : T extends Record<string, Property>
    ? { -readonly [K in keyof T]: MapOpenSearchTypes<T[K]> }
    : never

export type MapQueryProperties<T extends IndexDefinition> = T extends {
  body: {
    mappings: { properties: infer P }
  }
}
  ? MapOpenSearchTypes<P> // ✅ Keep the full structure instead of modifying it
  : never

export type Indices = Client['indices']
export type TransportRequestOptions = Parameters<Indices['exists']>[1]
export interface TransportRequestPromise<T> extends Promise<T> {
  abort: () => void
  finally(onFinally?: (() => void) | undefined | null): Promise<T>
}

export type Sort<T> = SortOptions<T> | SortOptions<T>[]

export type SortOptions<T> =
  | '_score'
  | '_doc'
  | {
      _doc?: Types.Common.ScoreSort
      _geo_distance?: Types.Common.GeoDistanceSort
      _score?: Types.Common.ScoreSort
      _script?: Types.Common.ScriptSort
    }
  | Record<NestedPaths<T>, Types.Common.FieldSort>

export type BuiltinKeys = '_id' | '_index'
