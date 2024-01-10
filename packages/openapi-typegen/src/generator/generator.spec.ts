import { describe, expect, it } from 'vitest'
import {
  ArrayType,
  EnumType,
  ObjectType,
  Path,
} from '../types'
import { format } from './formatter'
import { generateClient, generateServer, generateType } from './generator'

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
        extends: [],
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
    it('generates a complex object type', async () => {
      const type: ObjectType = {
        type: 'object',
        extends: [],
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
        extends: [],
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
                extends: [],
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
        extends: [{ type: 'BaseUser' }],
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
        extends: [],
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
                extends: [{ type: 'BaseProperties' }],
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

      const expected = await format(
        `export type User = Person & {
          name?: string
        }`
      )
      const generated = generateType(type)
      const formatted = await format(generated)

      expect(formatted).toEqual(expected)
    })
  })
  describe('generateClientPaths', () => {
    it('generates a simple get', async () => {
      const paths: Path[] = [
        {
          method: 'get',
          url: '/users',
          responses: {
            200: { type: 'array', items: { type: 'User' } },
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
           * @returns {Promise<User[]>}
           */
          (
            url: '/users',
            opts?: RequestOptions
          ): Promise<User[]>
        }
      }`)
      const generated = await format(
        generateClient('User', paths)
      )

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
              extends: [],
              optional: false,
              properties: [
                {name: 'userId', optional: false, type: [{type: 'number'}], description: 'The user ID.'},
                {name: 'intent', optional: true, type: [{type: 'string'}], description: 'The intent for the request.'},
              ],
            },
            query: {
              type: 'object',
              extends: [],
              optional: true,
              properties: [
                {name: 'page', optional: true, type: [{type: 'number'}], description: 'The page number for pagination.'},
                {name: 'size', optional: true, type: [{type: 'number'}], description: 'The number of items per page.'},
              ],
            },
          },
          responses: {
            200: { type: 'User' },
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
           * @returns {Promise<User>}
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
          ): Promise<User>
        }
      }`)
      const generated = await format(
        generateClient('User', paths)
      )

      expect(generated).toEqual(expected)
    })
    it.skip('generates a simple post', async () => {
      const paths: Path[] = [
        {
          method: 'post',
          url: '/users',
          parameters: [],
          responses: {
            200: { type: 'array', items: { type: 'User' } },
          },
        } as Path,
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'post'> & {
        post: {
          (
            url: '/users',
            opts?: RequestOptions
          ): Promise<User[]>
        }
      }`)
      const generated = await format(
        generateClient('User', paths)
      )

      expect(generated).toEqual(expected)
    })
    it.skip('generates a post with parameters', async () => {
      const paths: Path[] = [
        {
          method: 'post',
          url: '/users',
          args: {
            body: {
              type: 'object',
              extends: [{type: 'User'}],
              optional: false,
              properties: [],
            },
          },
          responses: {
            200: { type: 'array', items: { type: 'User' } },
          },
        } as Path,
      ]
      const expected = await format(`
      export type UserClient = Pick<BaseClient, 'post'> & {
        post: {
          (
            url: '/users',
            args: { body: User },
            opts?: RequestOptions
          ): Promise<User[]>
        }
      }`)
      const generated = await format(
        generateClient('User', paths)
      )

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
            200: {type: 'array', items: {type: 'User'}}
          },
        },
        {
          url: '/users/:id',
          method: 'get',
          args: {
            path: {
              name: undefined,
              optional: false,
              type: 'object',
              extends: [],
              properties: [
                { name: 'id', optional: false, type: [{type: 'string'}]},
              ],
            }
          },
          responses: {
            200: {type: 'User'}
          },
        },
      ]
      const expected = await format(`
      export type UserServer = APIServerDefinition & {
        '/users': {
          get: {
            handler: (args: Req) => Promise<[200, User[]]>
            pre?: GenericRouteHandler | GenericRouteHandler[]
          }
        }
        '/users/:id': {
          get: {
            handler: (args: Req & {
              params: {
                id: string
              }
            }) => Promise<[200, User]>
            pre?: GenericRouteHandler | GenericRouteHandler[]
          }
        }
      }
      `)
      const generated = await format(generateServer('User', paths))
      
      expect(generated).toEqual(expected)
    })
  })
})
