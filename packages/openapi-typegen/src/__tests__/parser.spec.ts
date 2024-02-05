import {
  ComponentsObject,
  HeaderObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@sebspark/openapi-core'
import { describe, expect, it } from 'vitest'
import { findRef } from '../parser/common'
import { parseHeader } from '../parser/headers'
import { parseParameter } from '../parser/parameters'
import { parsePath } from '../parser/paths'
import { parseRequestBodies } from '../parser/requestBodies'
import { parseResponseBodies } from '../parser/responseBodies'
import { parseSchema } from '../parser/schema'
import {
  ArrayType,
  CustomType,
  EnumType,
  Header,
  ObjectType,
  Parameter,
  Path,
  PrimitiveType,
  ResponseBody,
} from '../types'

describe('findRef', () => {
  it('finds headers', () => {
    const MyHeader: HeaderObject = {}
    const components: ComponentsObject = {
      headers: {
        MyHeader,
      },
    }

    expect(findRef(components, '#/components/headers/MyHeader')).toEqual(
      MyHeader
    )
  })
})

describe('openapi parser', () => {
  describe('parsePaths', () => {
    it('parses a simple path', () => {
      const path: PathItemObject = {
        get: {
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'get',
          args: undefined,
          responses: {
            204: {
              description: 'No Content',
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path)).toEqual(expected)
    })
    it('parses multiple simple paths', () => {
      const path: PathItemObject = {
        get: {
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
        post: {
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'get',
          args: undefined,
          responses: {
            204: {
              description: 'No Content',
            },
          },
        },
        {
          url: '/users/:userId',
          method: 'post',
          args: undefined,
          responses: {
            204: {
              description: 'No Content',
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path)).toEqual(expected)
    })
    it('parses a path with response schema ref', () => {
      const path: PathItemObject = {
        get: {
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/responseBodies/UserResponse',
                  },
                },
              },
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'get',
          args: undefined,
          responses: {
            200: {
              data: { type: 'UserResponse' },
              description: 'OK',
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path)).toEqual(expected)
    })
    it('parses a path with response schema', () => {
      const path: PathItemObject = {
        get: {
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      age: { type: 'integer' },
                    },
                    required: ['name'],
                  },
                },
              },
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'get',
          args: undefined,
          responses: {
            200: {
              data: {
                type: 'object',
                extends: [],
                name: undefined,
                properties: [
                  { name: 'name', type: [{ type: 'string' }], optional: false },
                  { name: 'age', type: [{ type: 'number' }], optional: true },
                ],
              },
              description: 'OK',
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path)).toEqual(expected)
    })
    it('parses a path with all parameters inline', () => {
      const path: PathItemObject = {
        get: {
          parameters: [
            {
              in: 'path',
              name: 'userId',
              schema: {
                type: 'integer',
              },
              required: true,
            },
            {
              in: 'query',
              name: 'page',
              schema: {
                type: 'integer',
              },
              required: false,
            },
            {
              in: 'query',
              name: 'size',
              schema: {
                type: 'integer',
              },
              required: false,
            },
            {
              in: 'header',
              name: 'x-api-key',
              schema: {
                type: 'string',
              },
              required: true,
            },
            {
              in: 'cookie',
              name: 'sessionId',
              schema: {
                type: 'string',
              },
              required: true,
            },
          ],
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'get',
          responses: {
            204: {
              description: 'No Content',
            },
          },
          args: {
            path: {
              type: 'object',
              extends: [],
              optional: false,
              properties: [
                { name: 'userId', optional: false, type: [{ type: 'number' }] },
              ],
            },
            query: {
              type: 'object',
              extends: [],
              optional: true,
              properties: [
                { name: 'page', optional: true, type: [{ type: 'number' }] },
                { name: 'size', optional: true, type: [{ type: 'number' }] },
              ],
            },
            header: {
              type: 'object',
              extends: [],
              optional: false,
              properties: [
                {
                  name: 'x-api-key',
                  optional: false,
                  type: [{ type: 'string' }],
                },
              ],
            },
            cookie: {
              type: 'object',
              extends: [],
              optional: false,
              properties: [
                {
                  name: 'sessionId',
                  optional: false,
                  type: [{ type: 'string' }],
                },
              ],
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path)).toEqual(expected)
    })
    it('parses a path with all inline requestBody', () => {
      const path: PathItemObject = {
        post: {
          parameters: [],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  properties: {
                    name: { type: 'string' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
      }
      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'post',
          responses: {
            204: {
              description: 'No Content',
            },
          },
          args: {
            body: {
              type: 'object',
              name: undefined,
              extends: [],
              optional: true,
              properties: [
                {
                  name: 'name',
                  optional: false,
                  type: [{ type: 'string' }],
                },
              ],
            },
          },
        },
      ]
      const parsed = parsePath('/users/{userId}', path)
      expect(parsed).toEqual(expected)
    })
    it('parses a path with all parameters as refs', () => {
      const path: PathItemObject = {
        post: {
          parameters: [
            {
              $ref: '#/components/parameters/UserIdParam',
            },
            {
              $ref: '#/components/parameters/PageParam',
            },
            {
              $ref: '#/components/parameters/ApiSecretHeader',
            },
            {
              $ref: '#/components/headers/x-api-key',
            },
          ],
          requestBody: {
            $ref: '#/components/requestBodies/User',
          },
          responses: {
            '204': {
              description: 'No Content',
            },
          },
        },
      }
      const components: ComponentsObject = {
        parameters: {
          UserIdParam: {
            in: 'path',
            name: 'userId',
            schema: {
              type: 'string',
            },
            required: true,
          },
          PageParam: {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
            },
            required: false,
          },
          ApiSecretHeader: {
            in: 'header',
            name: 'x-api-secret',
            schema: {
              type: 'string',
            },
            required: true,
          },
          SessionKeyCookie: {
            in: 'cookie',
            name: 'sessionKey',
            schema: {
              type: 'string',
            },
            required: true,
          },
        },
        headers: {
          'x-api-key': {
            schema: {
              type: 'string',
            },
            required: true,
          },
        },
        requestBodies: {
          User: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Personality',
                },
              },
            },
          },
        },
        schemas: {
          Personality: {
            type: 'string',
          },
        },
      }

      const expected: Path[] = [
        {
          url: '/users/:userId',
          method: 'post',
          args: {
            body: {
              type: 'object',
              extends: [{ type: 'User' }],
              optional: true,
              properties: [],
            },
            path: {
              type: 'object',
              extends: [{ type: 'UserIdParam' }],
              optional: false,
              properties: [],
            },
            query: {
              type: 'object',
              extends: [{ type: 'PageParam' }],
              optional: true,
              properties: [],
            },
            header: {
              type: 'object',
              extends: [{ type: 'ApiSecretHeader' }],
              optional: false,
              properties: [
                {
                  name: 'x-api-key',
                  optional: false,
                  type: [{ type: 'string' }],
                },
              ],
            },
          },
          responses: {
            204: {
              description: 'No Content',
            },
          },
        },
      ]

      expect(parsePath('/users/{userId}', path, components)).toEqual(expected)
    })
  })
  describe('parseSchema', () => {
    it('parses a simple schema', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses a required properties', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        required: ['name'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses refs', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          friend: {
            $ref: '#components/schemas/User',
          },
        },
        required: ['friend'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
          { name: 'friend', type: [{ type: 'User' }], optional: false },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('marshalls types', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
        },
        required: ['age'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
          { name: 'age', type: [{ type: 'number' }], optional: false },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses inline objects', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          description: {
            type: 'object',
            properties: {
              nick: { type: 'string' },
            },
            required: ['nick'],
          },
        },
        required: ['description'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
          {
            name: 'description',
            type: [
              {
                type: 'object',
                extends: [],
                properties: [
                  { name: 'nick', type: [{ type: 'string' }], optional: false },
                ],
              },
            ],
            optional: false,
          },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses ref arrays', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          interests: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Interest',
            },
          },
        },
        required: ['interests'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
          {
            name: 'interests',
            type: [{ type: 'array', items: { type: 'Interest' } }],
            optional: false,
          },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses inline arrays', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          interests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
        required: ['interests'],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: true },
          {
            name: 'interests',
            type: [
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: [
                    {
                      name: 'name',
                      type: [{ type: 'string' }],
                      optional: false,
                    },
                  ],
                  extends: [],
                },
              },
            ],
            optional: false,
          },
        ],
        extends: [],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses named arrays', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/User',
        },
      }
      const parsed = parseSchema('UserList', schema)
      const expected: ArrayType = {
        type: 'array',
        name: 'UserList',
        items: { type: 'User' },
      }
      expect(parsed).toEqual(expected)
    })
    it('parses string enums', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['Foo', 'Bar'],
      }
      const parsed = parseSchema('Value', schema)
      const expected: EnumType = {
        type: 'enum',
        name: 'Value',
        values: ['Foo', 'Bar'],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses integer enums', () => {
      const schema: SchemaObject = {
        type: 'integer',
        enum: [1, 2, 3],
      }
      const parsed = parseSchema('Value', schema)
      const expected: EnumType = {
        type: 'enum',
        name: 'Value',
        values: [1, 2, 3],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses allOf', () => {
      const schema: SchemaObject = {
        allOf: [
          { $ref: '#/components/schemas/Role' },
          { $ref: '#/components/schemas/Person' },
        ],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [],
        extends: [{ type: 'Role' }, { type: 'Person' }],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses combined properties and allOf', () => {
      const schema: SchemaObject = {
        allOf: [
          { $ref: '#/components/schemas/Person' },
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        ],
      }
      const parsed = parseSchema('User', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [],
        extends: [
          { type: 'Person' },
          {
            type: 'object',
            extends: [],
            properties: [
              { name: 'name', type: [{ type: 'string' }], optional: true },
            ],
          },
        ],
      }
      expect(parsed).toEqual(expected)
    })
    it('parses empty data types', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {},
        },
        required: ['status', 'message'],
        additionalProperties: false,
      }

      const parsed = parseSchema('SuccessResponse', schema)

      const expected: ObjectType = {
        type: 'object',
        name: 'SuccessResponse',
        extends: [],
        properties: [
          { name: 'status', type: [{type: 'string'}], optional: false},
          { name: 'message', type: [{type: 'string'}], optional: false},
          { name: 'data', type: [], optional: true},
        ]
      }

      expect(parsed).toEqual(expected)
    })
    it('parses allOf as property', () => {
      const schema: SchemaObject = {
        properties: {
          eventId: { type: 'number' },
          eventType: {
            allOf: [{ $ref: '#/components/schemas/EventTypeResponse' }],
            nullable: true,
          }
        },
        required: ['eventId', 'eventType']
      }

      const parsed = parseSchema('EventResponse', schema)
      const expected: ObjectType = {
        type: 'object',
        name: 'EventResponse',
        extends: [],
        properties: [
          { name: 'eventId', type: [{type: 'number'}], optional: false },
          { name: 'eventType', type: [{type: 'EventTypeResponse'}], optional: false },
        ]
      }

      expect(parsed).toEqual(expected)
    })
  })
  describe('parseParameters', () => {
    it('parses a simple schema', () => {
      const schema: ParameterObject = {
        in: 'query',
        name: 'page',
        schema: {
          type: 'integer',
        },
      }
      const parsed = parseParameter('PageParam', schema)
      const expected: Parameter = {
        in: 'query',
        name: 'PageParam',
        parameterName: 'page',
        optional: true,
        type: { type: 'number' } as PrimitiveType,
      }
      expect(parsed).toEqual(expected)
    })
    it('parses refs', () => {
      const schema: ParameterObject = {
        in: 'query',
        name: 'page',
        schema: {
          $ref: '#/components/schemas/Page',
        },
      }
      const parsed = parseParameter('PageParam', schema)
      const expected: Parameter = {
        in: 'query',
        name: 'PageParam',
        parameterName: 'page',
        optional: true,
        type: { type: 'Page' } as CustomType,
      }
      expect(parsed).toEqual(expected)
    })
  })
  describe('parseHeaders', () => {
    it('parses a simple schema', () => {
      const schema: HeaderObject = {
        required: true,
        schema: {
          type: 'integer',
        },
      }
      const parsed = parseHeader('X-Rate-Limit', schema)
      const expected: Header = {
        name: 'X-Rate-Limit',
        optional: false,
        type: { type: 'number' } as PrimitiveType,
      }
      expect(parsed).toEqual(expected)
    })
    it('parses a ref', () => {
      const schema: HeaderObject = {
        required: true,
        schema: {
          $ref: '#/components/schemas/RateLimit',
        },
      }
      const parsed = parseHeader('X-Rate-Limit', schema)
      const expected: Header = {
        name: 'X-Rate-Limit',
        optional: false,
        type: { type: 'RateLimit' } as CustomType,
      }
      expect(parsed).toEqual(expected)
    })
  })
  describe('parseRequestBodies', () => {
    it('parses a requestBody with inline definition', () => {
      const body: RequestBodyObject = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
              required: ['name'],
            },
          },
        },
      }

      const expected: ObjectType = {
        type: 'object',
        name: 'UserRequest',
        extends: [],
        properties: [
          { name: 'name', optional: false, type: [{ type: 'string' }] },
        ],
      }

      const parsed = parseRequestBodies({ UserRequest: body })[0]
      expect(parsed).toEqual(expected)
    })
    it('parses a requestBody with a ref', () => {
      const body: RequestBodyObject = {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      }

      const expected: CustomType = {
        name: 'UserRequest',
        type: 'User',
      }

      const parsed = parseRequestBodies({ UserRequest: body })[0]
      expect(parsed).toEqual(expected)
    })
  })
  describe('parseResponseBodies', () => {
    it('parses a responseObject with only headers', () => {
      const responseBody: ResponseObject = {
        description: 'UserResponse',
        headers: {
          'x-api-key': {
            schema: {
              type: 'string',
            },
            required: true,
          },
        },
      }
      const expected: ResponseBody = {
        name: 'UserResponse',
        description: 'UserResponse',
        headers: [
          { name: 'x-api-key', optional: false, type: { type: 'string' } },
        ],
      }
      const parsed = parseResponseBodies({ UserResponse: responseBody })[0]
      expect(parsed).toEqual(expected)
    })
    it('parses a responseObject with only data', () => {
      const responseBody: ResponseObject = {
        description: 'UserResponse',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      }
      const expected: ResponseBody = {
        name: 'UserResponse',
        description: 'UserResponse',
        data: { type: 'User', name: undefined },
      }
      const parsed = parseResponseBodies({ UserResponse: responseBody })[0]
      expect(parsed).toEqual(expected)
    })
    it('parses a responseObject with headers and data', () => {
      const responseBody: ResponseObject = {
        description: 'UserResponse',
        headers: {
          'x-api-key': {
            schema: {
              type: 'string',
            },
            required: true,
          },
        },
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      }
      const expected: ResponseBody = {
        name: 'UserResponse',
        description: 'UserResponse',
        headers: [
          { name: 'x-api-key', optional: false, type: { type: 'string' } },
        ],
        data: { type: 'User', name: undefined },
      }
      const parsed = parseResponseBodies({ UserResponse: responseBody })[0]
      expect(parsed).toEqual(expected)
    })
  })
})
