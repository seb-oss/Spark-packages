import type {
  ApiResponse,
  Client,
  RequestParams,
  opensearchtypes,
} from '@opensearch-project/opensearch'
import {
  IndexOptions,
  IndexProperties,
  NestedFieldOptions,
  OpenSearchQuery,
  OpenSearchQueryBody,
} from './openSearchTypes'
import { ExcludeId, WithId } from './typescriptExtensions'

export interface OpenSearchHelper extends Client {
  typedSearch: <DataType extends WithId, ReturnType = DataType>(
    query: OpenSearchQuery<DataType, ReturnType>
  ) => Promise<{
    results: ReturnType[]
    response: ApiResponse<
      opensearchtypes.SearchResponse<ExcludeId<ReturnType>>,
      unknown
    >
  }>
  typedIndex: <DataType extends WithId>(
    index: string,
    data: DataType
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => Promise<ApiResponse<Record<string, any>, unknown> | undefined>
  typedUpsert: <DataType extends WithId>(
    index: string,
    data: DataType
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => Promise<ApiResponse<Record<string, any>, unknown> | undefined>
  typedBulkUpsert: <DataType extends WithId>(
    index: string,
    data: DataType[]
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => Promise<ApiResponse<Record<string, any>, unknown> | undefined>
  typedIndexCreate: <DataType extends WithId>(
    index: string,
    options: IndexOptions<DataType>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ) => Promise<ApiResponse<Record<string, any>, unknown> | undefined>
}

const typedSearch = async <T extends WithId, K = T>(
  client: Client,
  searchQuery: OpenSearchQuery<T, K>
) => {
  // Perform the query using the OpenSearch client
  const response = await client.search(
    searchQuery as RequestParams.Search<OpenSearchQueryBody<T, K>>
  )

  // Transform the results, mapping _id to id and casting to type K
  const results: K[] = response.body.hits.hits.map(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (hit: { _id: any; _source: any }) => ({
      id: hit._id,
      ...hit._source,
    })
  ) as K[]

  return { results, response }
}

const typedIndex = async <T extends { id: string }>(
  client: Client,
  index: string,
  data: T
) => {
  const { id, ...body } = data
  const response = await client.index({
    index,
    id,
    body,
    refresh: true, // Adjust based on your requirement
  })

  return response
}

const typedUpsert = async <T extends { id: string }>(
  client: Client,
  index: string,
  data: T
) => {
  const { id, ...doc } = data
  const response = await client.update({
    index,
    id,
    body: {
      doc,
      doc_as_upsert: true,
    },
  })

  return response
}

const typedBulkUpsert = async <T extends { id: string }>(
  client: Client,
  index: string,
  items: T[]
) => {
  const body = items.flatMap((item) => {
    const { id, ...doc } = item
    return [
      { update: { _index: index, _id: id } },
      { doc, doc_as_upsert: true },
    ]
  })

  const response = await client.bulk({ body })
  return response
}

const isLeafNode = <T extends object>(obj: T): boolean => {
  return !Object.values(obj).some(
    (value) =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
  )
}

const flattenObject = <T>(
  obj: IndexProperties<T>,
  parentKey = '',
  result: Record<string, NestedFieldOptions<T>> = {}
) => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key
    if (typeof value === 'object' && value !== null && !isLeafNode(value)) {
      flattenObject(value as IndexProperties<T>, newKey, result)
    } else {
      result[newKey] = value as NestedFieldOptions<T>
    }
  }
  return result
}

const typedIndexCreate = async <T extends { id: string }>(
  client: Client,
  index: string,
  { mappings, ...props }: IndexOptions<T>
) => {
  // Do not attempt to create an existing index
  const { body: exists } = await client.indices.exists({ index })
  if (exists) {
    return
  }

  const response = await client.indices.create({
    index,
    body: {
      ...props,
      mappings: mappings?.properties
        ? { properties: flattenObject(mappings.properties) }
        : undefined,
    },
  })
  return response
}

export const helper = (client: Client): OpenSearchHelper =>
  ({
    ...client,
    typedBulkUpsert: (index, data) => typedBulkUpsert(client, index, data),
    typedIndexCreate: (index, options) =>
      typedIndexCreate(client, index, options),
    typedIndex: (index, data) => typedIndex(client, index, data),
    typedSearch: (query) => typedSearch(client, query),
    typedUpsert: (index, data) => typedUpsert(client, index, data),
  }) as Partial<OpenSearchHelper> as OpenSearchHelper
