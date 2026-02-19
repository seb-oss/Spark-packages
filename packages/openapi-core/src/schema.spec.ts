import { beforeEach, describe, expect, it } from 'vitest'
import { OpenApiDocument, PathItemObject } from './openapi'
import {
  appendVersionToServers,
  disableUnimplementedPaths,
  flattenEnums,
  resolveRef,
} from './schema'

let baseDocument: OpenApiDocument

beforeEach(() => {
  baseDocument = {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        StatusEnum: { type: 'string', enum: ['active', 'inactive'] },
        TypeEnum: { type: 'string', enum: ['stock', 'fund'] },
      },
      parameters: {},
    },
    servers: [{ url: 'https://api.example.com' }],
  }
})

describe('disableUnimplementedPaths', () => {
  beforeEach(() => {
    baseDocument.paths = {
      '/instruments': { get: { responses: {} } },
      '/instruments/{id}': { get: { responses: {} } },
    }
  })

  it('marks unimplemented paths as deprecated', () => {
    const result = disableUnimplementedPaths(baseDocument, {
      '/instruments': {},
    })
    const pathItem = result.paths['/instruments/{id}'] as PathItemObject
    expect(pathItem.get?.deprecated).toBe(true)
  })
  it('tags unimplemented paths with not-implemented', () => {
    const result = disableUnimplementedPaths(baseDocument, {
      '/instruments': {},
    })
    const pathItem = result.paths['/instruments/{id}'] as PathItemObject
    expect(pathItem.get?.tags).toContain('not-implemented')
  })
  it('leaves implemented paths unchanged', () => {
    const result = disableUnimplementedPaths(baseDocument, {
      '/instruments': {},
    })
    const pathItem = result.paths['/instruments'] as PathItemObject
    expect(pathItem.get?.deprecated).toBeUndefined()
  })
  it('does not modify the original document', () => {
    disableUnimplementedPaths(baseDocument, {})
    const pathItem = baseDocument.paths['/instruments'] as PathItemObject
    expect(pathItem.get?.deprecated).toBeUndefined()
  })
  it('does not mark health paths as unimplemented', () => {
    baseDocument.paths['/health'] = { get: { responses: {} } }
    const result = disableUnimplementedPaths(baseDocument, {})
    const pathItem = result.paths['/health'] as PathItemObject
    expect(pathItem.get?.deprecated).toBeUndefined()
  })
})

describe('appendVersionToServers', () => {
  it('appends v2 to server URLs', () => {
    const result = appendVersionToServers(baseDocument, 'v2')
    expect(result.servers?.[0].url).toBe('https://api.example.com/v2')
  })
  it('does not modify the original document', () => {
    appendVersionToServers(baseDocument, 'v2')
    expect(baseDocument.servers?.[0].url).toBe('https://api.example.com')
  })
  it('handles missing servers gracefully', () => {
    baseDocument.servers = undefined
    const result = appendVersionToServers(baseDocument, 'v2')
    expect(result.servers).toBeUndefined()
  })
})

describe('resolveRef', () => {
  it('resolves a valid $ref to its schema', () => {
    const result = resolveRef('#/components/schemas/StatusEnum', baseDocument)
    expect(result).toEqual({ type: 'string', enum: ['active', 'inactive'] })
  })
  it('returns undefined for an unknown $ref', () => {
    const result = resolveRef('#/components/schemas/Unknown', baseDocument)
    expect(result).toBeUndefined()
  })
  it('returns undefined for an invalid path', () => {
    const result = resolveRef('#/foo/bar/baz', baseDocument)
    expect(result).toBeUndefined()
  })
})

describe('flattenEnums', () => {
  beforeEach(() => {
    baseDocument.components!.parameters = {
      SortBy: {
        name: 'sort',
        in: 'query',
        schema: {
          oneOf: [
            { $ref: '#/components/schemas/StatusEnum' },
            { $ref: '#/components/schemas/TypeEnum' },
          ],
        },
      },
      Plain: {
        name: 'plain',
        in: 'query',
        schema: { type: 'string' },
      },
    }
  })

  describe('parameters', () => {
    it('flattens oneOf enum refs into a single enum', () => {
      const result = flattenEnums(baseDocument)
      expect(result.components?.parameters?.SortBy.schema).toEqual({
        type: 'string',
        enum: ['active', 'inactive', 'stock', 'fund'],
      })
    })
    it('deduplicates enum values across refs', () => {
      baseDocument.components!.schemas!.TypeEnum = {
        type: 'string',
        enum: ['active', 'fund'],
      }
      const result = flattenEnums(baseDocument)
      const schema = result.components?.parameters?.SortBy.schema as {
        enum: string[]
      }
      expect(schema.enum).toEqual(['active', 'inactive', 'fund'])
    })
    it('leaves non-enum parameters unchanged', () => {
      const result = flattenEnums(baseDocument)
      expect(result.components?.parameters?.Plain.schema).toEqual({
        type: 'string',
      })
    })
    it('leaves oneOf with non-enum refs unchanged', () => {
      baseDocument.components!.schemas!.ComplexSchema = {
        type: 'object',
        properties: {},
      }
      baseDocument.components!.parameters!.Complex = {
        name: 'complex',
        in: 'query',
        schema: { oneOf: [{ $ref: '#/components/schemas/ComplexSchema' }] },
      }
      const result = flattenEnums(baseDocument)
      expect(result.components?.parameters?.Complex.schema).toEqual({
        oneOf: [{ $ref: '#/components/schemas/ComplexSchema' }],
      })
    })
    it('handles missing parameters gracefully', () => {
      baseDocument.components!.parameters = undefined
      const result = flattenEnums(baseDocument)
      expect(result.components?.parameters).toBeUndefined()
    })
  })

  describe('component schemas', () => {
    it('flattens oneOf enum refs in component schemas', () => {
      baseDocument.components!.schemas!.MergedEnum = {
        oneOf: [
          { $ref: '#/components/schemas/StatusEnum' },
          { $ref: '#/components/schemas/TypeEnum' },
        ],
      }
      const result = flattenEnums(baseDocument)
      expect(result.components?.schemas?.MergedEnum).toEqual({
        type: 'string',
        enum: ['active', 'inactive', 'stock', 'fund'],
      })
    })
    it('leaves non-enum component schemas unchanged', () => {
      baseDocument.components!.schemas!.ComplexSchema = {
        type: 'object',
        properties: {},
      }
      const result = flattenEnums(baseDocument)
      expect(result.components?.schemas?.ComplexSchema).toEqual({
        type: 'object',
        properties: {},
      })
    })
  })

  describe('inline path parameters', () => {
    beforeEach(() => {
      baseDocument.paths = {
        '/instruments': {
          get: {
            parameters: [
              {
                name: 'sort',
                in: 'query',
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/StatusEnum' },
                    { $ref: '#/components/schemas/TypeEnum' },
                  ],
                },
              },
            ],
            responses: {},
          },
        },
      }
    })

    it('flattens oneOf enum refs in inline path parameters', () => {
      const result = flattenEnums(baseDocument)
      const pathItem = result.paths['/instruments'] as PathItemObject
      const params = pathItem.get?.parameters as {
        schema: { enum: string[] }
      }[]
      expect(params[0].schema).toEqual({
        type: 'string',
        enum: ['active', 'inactive', 'stock', 'fund'],
      })
    })
    it('leaves inline parameters without oneOf unchanged', () => {
      const pathItem = baseDocument.paths['/instruments'] as PathItemObject
      pathItem.get!.parameters = [
        { name: 'q', in: 'query', schema: { type: 'string' } },
      ]
      const result = flattenEnums(baseDocument)
      const resultPathItem = result.paths['/instruments'] as PathItemObject
      const params = resultPathItem.get?.parameters as { schema: unknown }[]
      expect(params[0].schema).toEqual({ type: 'string' })
    })
  })

  describe('immutability', () => {
    it('does not modify the original document', () => {
      flattenEnums(baseDocument)
      expect(baseDocument.components?.parameters?.SortBy.schema).toHaveProperty(
        'oneOf'
      )
    })
    it('does not modify original component schemas', () => {
      baseDocument.components!.schemas!.MergedEnum = {
        oneOf: [{ $ref: '#/components/schemas/StatusEnum' }],
      }
      flattenEnums(baseDocument)
      expect(baseDocument.components?.schemas?.MergedEnum).toHaveProperty(
        'oneOf'
      )
    })
  })
})
