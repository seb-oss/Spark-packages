import { SchemaObject } from '@sebspark/openapi-core'
import { describe, expect, it } from 'vitest'
import { classname } from '..'
import { generateResponseBody, typeName } from '../generator/common'
import { format } from '../generator/formatter'
import {
  generateClient,
  generateServer,
  generateType,
} from '../generator/generator'
import { parseSchema } from '../parser/schema'
import {
  ArrayType,
  CustomType,
  EnumType,
  ObjectType,
  Path,
  ResponseBody,
} from '../types'

describe('typescript generator', () => {
  describe('generateType', () => {
    it('generates a string enum type', async () => {
      const type: EnumType = {
        type: 'enum',
        name: 'Values',
        values: ['foo', 'bar'],
      }
      const expected = await format(`export type Values = 'foo' | 'bar'`)
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a number enum type', async () => {
      const type: EnumType = {
        type: 'enum',
        name: 'Values',
        values: [1, 2, 3],
      }
      const expected = await format('export type Values = 1 | 2 | 3')
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a simple object type', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
          { name: 'age', type: [{ type: 'number' }], optional: true },
        ],
      }

      const expected = await format(
        `export type User = {
          name: string
          age?: number
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates an object with array string enum type', async () => {
      const type: ObjectType = {
        name: 'Values',
        type: 'object',
        properties: [
          {
            name: 'interests',
            optional: false,
            type: [
              {
                type: 'array',
                items: {
                  type: 'enum',
                  values: ['FOO', 'BAR'],
                },
              },
            ],
          },
        ]
      }
      const expected = await format(`
        export type Values = {
          interests: ('FOO' | 'BAR')[]
        }
      `)
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates an object type with empty definition', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'SuccessResponse',
        properties: [
          { name: 'status', type: [{ type: 'string' }], optional: false },
          { name: 'message', type: [{ type: 'string' }], optional: false },
          { name: 'data', type: [], optional: true },
        ],
      }

      const expected = await format(
        `export type SuccessResponse = {
          status: string
          message: string
          data?: unknown
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates an array type', async () => {
      const type: ArrayType = {
        type: 'array',
        name: 'UserList',
        items: { type: 'User' },
      }

      const expected = await format('export type UserList = User[]')
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates an array type with inline definition', async () => {
      const type: ArrayType = {
        type: 'array',
        name: 'Accounts',
        items: {
          type: 'object',
          properties: [
            {
              name: 'bondHoldings',
              optional: false,
              type: [
                {
                  type: 'array',
                  items: { type: 'BondHolding' } as CustomType,
                } as ArrayType,
              ],
            },
            {
              name: 'statementDateTime',
              optional: true,
              type: [{ type: 'string' }],
            },
          ],
        } as ObjectType,
      }

      const expected = await format(`
      export type Accounts = {
        bondHoldings: BondHolding[]
        statementDateTime?: string
      }[]
      `)
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a complex object type', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
          {
            name: 'interests',
            type: [{ type: 'array', items: { type: 'Interest' } }],
            optional: true,
          },
        ],
      }

      const expected = await format(
        `export type User = {
          name: string
          interests?: Interest[]
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a complex object type with inlined definition', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
          {
            name: 'interests',
            type: [{ type: 'array', items: { type: 'Interest' } }],
            optional: true,
          },
          {
            name: 'properties',
            type: [
              {
                type: 'object',
                properties: [
                  { name: 'age', type: [{ type: 'number' }], optional: false },
                ],
              },
            ],
            optional: true,
          },
        ],
      }

      const expected = await format(
        `export type User = {
          name: string
          interests?: Interest[]
          properties?: {
            age: number
          }
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates extended objects', async () => {
      const type: ObjectType = {
        type: 'object',
        allOf: [{ type: 'BaseUser' }],
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
        ],
      }

      const expected = await format(
        `export type User = BaseUser & {
          name: string
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a complex object type with inlined and extended definition', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'name', type: [{ type: 'string' }], optional: false },
          {
            name: 'interests',
            type: [{ type: 'array', items: { type: 'Interest' } }],
            optional: true,
          },
          {
            name: 'properties',
            type: [
              {
                type: 'object',
                properties: [
                  { name: 'age', type: [{ type: 'number' }], optional: false },
                ],
                allOf: [{ type: 'BaseProperties' }],
              },
            ],
            optional: true,
          },
        ],
      }

      const expected = await format(
        `export type User = {
          name: string
          interests?: Interest[]
          properties?: BaseProperties & {
            age: number
          }
        }`
      )
      const generated = await format(generateType(type))

      expect(generated).toEqual(expected)
    })
    it('generates a complex object type from extensions', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [],
        allOf: [
          { type: 'Person' },
          {
            type: 'object',
            properties: [
              { name: 'name', type: [{ type: 'string' }], optional: true },
            ],
          },
        ],
      }

      const expected = await format(
        `export type User = Person & {
          name?: string
        }`
      )
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
    it('generates a complex object type with allOf properties', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'User',
        properties: [
          { name: 'id', type: [{ type: 'string' }], optional: false },
          { name: 'props', type: [{ type: 'UserProps' }], optional: false },
        ],
      }

      const expected = await format(
        `export type User = {
          id: string
          props: UserProps
        }`
      )
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
    it('generates a oneOf object', async () => {
      const type: ObjectType = {
        type: 'object',
        properties: [],
        name: 'Details',
        oneOf: [{ type: 'StockDetails' }, { type: 'FundDetails' }],
      }

      const expected = await format(
        'export type Details = StockDetails | FundDetails'
      )
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
    it('generates a oneOf object with discriminator', async () => {
      const type: ObjectType = {
        type: 'object',
        properties: [],
        name: 'Details',
        oneOf: [{ type: 'StockDetails' }, { type: 'FundDetails' }],
        discriminator: {
          propertyName: 'instrumentType',
          mapping: {
            STOCK: { type: 'StockDetails' },
            FUND: { type: 'FundDetails' },
          },
        },
      }

      const expected = await format(`
        export type Details = StockDetails | FundDetails
        
        export type DetailsDiscriminator = {
          STOCK: StockDetails
          FUND: FundDetails
        }
        `)
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
    it('generates type with domain style name', async () => {
      const type: ObjectType = {
        type: 'object',
        name: 'com.domain.MyType',
        properties: [],
      }
      const expected = await format(`
        export type com_domain_MyType = {}
        `)
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
  })
  describe('generateResponseBody', () => {
    it('generates a response body with funky header ref', async () => {
      const response: ResponseBody = {
        description: 'Weird header',
        headers: [
          { name: 'x-foo-bar', optional: false, type: { type: 'X-Foo-Bar' } },
        ],
      }
      const generated = await format(generateResponseBody(response))
      const expected = await format(`
        APIResponse<undefined, { 'x-foo-bar': XFooBar }>
      `)

      expect(generated).toEqual(expected)
    })
    it('generates a funky response ref', async () => {
      const response: CustomType = {
        description: 'Weird header',
        type: 'X-Foo-Bar',
      }
      const generated = generateResponseBody(response)
      const expected = 'XFooBar'

      expect(generated).toEqual(expected)
    })
  })
  describe('generateClientPaths', () => {
    it('generates a simple get', async () => {
      const paths: Path[] = [
        {
          method: 'get',
          url: '/users',
          responses: {
            200: {
              data: { type: 'array', items: { type: 'User' } },
            },
          },
        },
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'get'> & {
        get: {
          /**
           * 
           * @param {string} url
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<APIResponse<Serialized<User>[]>>}
           */
          (
            url: '/users',
            opts?: RequestOptions
          ): Promise<APIResponse<Serialized<User>[]>>
        }
      }`)
      const generated = await format(generateClient('User', paths))

      expect(generated).toEqual(expected)
    })
    it('generates a get with parameters', async () => {
      const paths: Path[] = [
        {
          method: 'get',
          url: '/users/:userId/:intent',
          title: 'User',
          description: 'Gets user',
          args: {
            path: {
              type: 'object',
              optional: false,
              properties: [
                {
                  name: 'userId',
                  optional: false,
                  type: [{ type: 'number' }],
                  description: 'The user ID.',
                },
                {
                  name: 'intent',
                  optional: true,
                  type: [{ type: 'string' }],
                  description: 'The intent for the request.',
                },
              ],
            },
            query: {
              type: 'object',
              optional: true,
              properties: [
                {
                  name: 'page',
                  optional: true,
                  type: [{ type: 'number' }],
                  description: 'The page number for pagination.',
                },
                {
                  name: 'size',
                  optional: true,
                  type: [{ type: 'number' }],
                  description: 'The number of items per page.',
                },
              ],
            },
          },
          responses: {
            200: { data: { type: 'User' } },
          },
        },
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'get'> & {
        get: {
          /**
           * User
           * Gets user
           * 
           * @param {string} url
           * @param {Object} args - The arguments for the request.
           * @param {Object} args.params - Path parameters for the request.
           * @param {number} args.params.userId - The user ID.
           * @param {string} [args.params.intent] - Optional. The intent for the request.
           * @param {Object} [args.query] - Optional. Query parameters for the request.
           * @param {number} [args.query.page] - Optional. The page number for pagination.
           * @param {number} [args.query.size] - Optional. The number of items per page.
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<APIResponse<Serialized<User>>>}
           */
          (
            url: '/users/:userId/:intent',
            args: {
              params: {
                /**
                 * The user ID.
                 */
                userId: number
                /**
                 * The intent for the request.
                 */
                intent?: string
              }
              query?: {
                /**
                 * The page number for pagination.
                 */
                page?: number
                /**
                 * The number of items per page.
                 */
                size?: number
              }
            },
            opts?: RequestOptions
          ): Promise<APIResponse<Serialized<User>>>
        }
      }`)
      const generated = await format(generateClient('User', paths))

      expect(generated).toEqual(expected)
    })
    it('lowercases headers', async () => {
      const paths: Path[] = [
        {
          method: 'get',
          url: '/users/',
          title: 'User',
          description: 'Gets user',
          args: {
            header: {
              type: 'object',
              optional: false,
              properties: [
                {
                  name: 'X-Api-Key',
                  optional: false,
                  type: [{ type: 'string' }],
                },
              ],
            },
          },
          responses: {
            200: { data: { type: 'User' } },
          },
        },
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'get'> & {
        get: {
          /**
           * User
           * Gets user
           * 
           * @param {string} url
           * @param {Object} args - The arguments for the request.
           * @param {Object} args.headers - Headers for the request.
           * @param {string} args.headers["X-Api-Key"]
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<APIResponse<Serialized<User>>>}
           */
          (
            url: '/users/',
            args: {
              headers: {
                'X-Api-Key': string
              }
            },
            opts?: RequestOptions
          ): Promise<APIResponse<Serialized<User>>>
        }
      }`)
      const generated = await format(generateClient('User', paths))

      expect(generated).toEqual(expected)
    })
    it('generates a simple post', async () => {
      const paths: Path[] = [
        {
          method: 'post',
          url: '/users',
          parameters: [],
          responses: {
            200: { data: { type: 'array', items: { type: 'User' } } },
          },
        } as Path,
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'post'> & {
        post: {
          /**
           * 
           * @param {string} url
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<APIResponse<Serialized<User>[]>>}
           */
          (
            url: '/users',
            opts?: RequestOptions
          ): Promise<APIResponse<Serialized<User>[]>>
        }
      }`)
      const generated = await format(generateClient('User', paths))

      expect(generated).toEqual(expected)
    })
    it('generates a post with parameters', async () => {
      const paths: Path[] = [
        {
          method: 'post',
          url: '/users',
          args: {
            body: {
              type: 'object',
              allOf: [{ type: 'User' }],
              optional: false,
              properties: [],
            },
          },
          responses: {
            200: { data: { type: 'array', items: { type: 'User' } } },
          },
        } as Path,
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'post'> & {
        post: {
          /**
           * 
           * @param {string} url
           * @param {Object} args - The arguments for the request.
           * @param {User} args.body - Request body for the request.
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<APIResponse<Serialized<User>[]>>}
           */
          (
            url: '/users',
            args: { body: User },
            opts?: RequestOptions
          ): Promise<APIResponse<Serialized<User>[]>>
        }
      }`)
      const generated = await format(generateClient('User', paths))

      expect(generated).toEqual(expected)
    })
  })
  describe('generateServerPaths', () => {
    it('generates a simple server', async () => {
      const paths: Path[] = [
        {
          url: '/users',
          method: 'get',
          responses: {
            200: {
              data: { type: 'array', items: { type: 'User' } },
            },
          },
          title: 'Users',
          description: 'Lists users',
        },
        {
          url: '/users/:id',
          method: 'get',
          args: {
            path: {
              name: undefined,
              optional: false,
              type: 'object',
              properties: [
                { name: 'id', optional: false, type: [{ type: 'string' }] },
              ],
            },
          },
          responses: {
            200: { type: 'UserResponse' },
          },
        },
      ]
      const expected = await format(`
      export type UserServer = APIServerDefinition & {
        '/users': {
          get: {
            /**
             * Users
             * Lists users
             * 
             * @returns {Promise<[200, APIResponse<PartiallySerialized<User>[]>]>}
             */
            handler: (args: Req) => Promise<[200, APIResponse<PartiallySerialized<User>[]>]>
            pre?: GenericRouteHandler | GenericRouteHandler[]
          }
        }
        '/users/:id': {
          get: {
            /**
             * 
             * @param {Object} args - The arguments for the request.
             * @param {Object} args.params - Path parameters for the request.
             * @param {string} args.params.id
             * @returns {Promise<[200, UserResponse]>}
             */
            handler: (args: Req & {
              params: {
                id: string
              }
            }) => Promise<[200, UserResponse]>
            pre?: GenericRouteHandler | GenericRouteHandler[]
          }
        }
      }
      `)
      const generated = await format(generateServer('User', paths))

      expect(generated).toEqual(expected)
    })
  })
  describe('documentation', () => {
    it('renders title and description for a component schema', async () => {
      const schema: SchemaObject = {
        title: 'User',
        description: 'Description',
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      }
      const generated = await format(generateType(parseSchema('User', schema)))
      const expected = await format(`
        /**
         * User
         * Description
         */
        export type User = {
          name?: string
        }
      `)

      expect(generated).toEqual(expected)
    })
    it('renders title and description for a properties of a component schema', async () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            title: 'User name',
            description: 'What you call someone',
            type: 'string',
          },
        },
      }
      const generated = await format(generateType(parseSchema('User', schema)))
      const expected = await format(`
        export type User = {
          /**
           * User name
           * What you call someone
           */
          name?: string
        }
      `)

      expect(generated).toEqual(expected)
    })
    it('renders title and description for client routes', async () => {
      const path: Path = {
        url: '/foo',
        method: 'get',
        title: 'Foo',
        description: 'Get foo',
        responses: {
          204: {},
        },
      }
      const generated = await format(generateClient('Foo', [path]))
      const expected = await format(`
      export type FooClient = Pick<BaseClient, 'get'> & {
        get: {
          /**
           * Foo
           * Get foo
           * 
           * @param {string} url
           * @param {RequestOptions} [opts] - Optional.
           * @returns {Promise<undefined>}
           */
          (url: '/foo', opts?: RequestOptions): Promise<undefined>
        }
      }
      `)

      expect(generated).toEqual(expected)
    })
  })
  describe('typeName', () => {
    it('capitalizes the first character', () => {
      expect(typeName('foobar')).toEqual('Foobar')
    })
    it('capitalizes domain style names correctly', () => {
      expect(typeName('com.foo.bar.hello')).toEqual('com_foo_bar_Hello')
    })
    it('pascal styles non usable characters', () => {
      expect(typeName('com-foo')).toEqual('ComFoo')
    })
    it('only accepts numbers not at start', () => {
      expect(typeName('3com5')).toEqual('_3com5')
    })
    it('preserves generics', () => {
      expect(typeName('Serialized<com.foo.bar.hello>')).toEqual(
        'Serialized<com_foo_bar_Hello>'
      )
    })
    it('leaves a working name untouched', () => {
      expect(typeName('CFDDetails')).toEqual('CFDDetails')
    })
  })
  describe('classname', () => {
    it('returns a capitalized name', () => {
      expect(classname('card')).toEqual('Card')
    })
    it('returns a reasonable name', () => {
      expect(classname('cdapi-service.openapi-3.0')).toEqual(
        'CdapiServiceOpenapi'
      )
    })
  })
})
