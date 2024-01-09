import { readFileSync } from 'fs'
import prettier from 'prettier'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ParsedType } from '../../shared/schema'

const format = (str: string) => {
  return prettier.format(str, {
    semi: false,
    parser: 'typescript',
    singleQuote: true,
    trailingComma: 'es5',
  })
}

const schemaTxt = readFileSync(`${__dirname}/openapi.json`, 'utf-8')

const findType = (types: ParsedType[], find: string) => {
  return types.find((it) => it.name === find)
}

const getType = (types: ParsedType[], find: string) => {
  return findType(types, find)?.type
}

describe.skip('schema', () => {
  let schema: OpenAPI3
  beforeAll(() => {
    schema = JSON.parse(schemaTxt)
  })
  describe('generateBaseData', () => {
    describe('types', () => {
      it('finds all types', () => {
        const generated = {}

        expect(generated.types).toHaveLength(5)
      })
      it('generates all properties', () => {
        const generated = {}

        expect(getType(generated.types, 'Card')).toEqual(
          `{'id': string; 'ownerId': string; 'name-on-card': string; 'settings/foo'?: CardSettings}`
        )
      })
      it('generates deep properties', () => {
        const generated = {}

        expect(getType(generated.types, 'CardSettings')).toEqual(
          `{'cardId': string; 'frozen': {'value': boolean; 'editableByChild': boolean}}`
        )
      })
      it('generates array properties', () => {
        const generated = {}

        expect(getType(generated.types, 'CardList')).toEqual(
          `{'cards': (Card)[]}`
        )
      })
      it('generates docs', () => {
        const generated = {}

        expect(
          findType(generated.types, 'Documented')?.description
        ).toBeTruthy()
      })
    })
    describe('paths', () => {
      it('rewrites urls', () => {
        const generated = {}

        expect(generated.paths[1].url).toEqual('/:cardId')
      })
      it('sets the correct method', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.method).toEqual('get')
      })
      it('finds all methods', () => {
        const generated = {}
        const deleteCard = generated.paths[2]

        expect(deleteCard.url).toEqual('/:cardId')
        expect(deleteCard.method).toEqual('delete')
      })
      it('generates parameters', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.requestParams).toEqual('{cardId: string}')
      })
      it('generates query', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.requestQuery).toEqual('{cardNickname: boolean}')
      })
      it('generates headers', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.requestHeaders).toEqual(
          "{'X-User-Id': string, 'X-Distributor-Id'?: string}"
        )
      })
      it('generates body', () => {
        const generated = {}
        const putCardSettings = generated.paths[3]

        expect(putCardSettings.requestBody).toEqual('CardSettings')
      })
      it('generates response', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.response).toEqual({ code: 200, type: 'Card' })
      })
      it('generates errorResponse', () => {
        const generated = {}
        const getCard = generated.paths[1]

        expect(getCard.errorResponses).toEqual([
          { code: 401, type: 'HttpError' },
        ])
      })
    })
  })
  describe('generateRouteDefinitions', () => {
    let routes: RouteDefinition[]
    beforeEach(() => {
      const generated = {}
      routes = generateRouteDefinitions(generated.paths)
    })
    it('generates a router', () => {
      expect(routes.length).toBeGreaterThan(0)
    })
    it('sets response', () => {
      expect(routes[1].response).toEqual({ code: 200, type: 'Card' })
    })
    it('sets args', () => {
      expect(routes[1].args).toEqual({
        params: '{cardId: string}',
        query: '{cardNickname: boolean}',
        headers: `{'X-User-Id': string, 'X-Distributor-Id'?: string}`,
      })
    })
  })
  describe('generate', () => {
    it('generates a correct document', async () => {
      const generated = await generateOpenApi(schema)
      const expected = await format(
        readFileSync(`${__dirname}/openapi.generated.ts`, 'utf8')
      )
      expect(generated).toEqual(expected)
    })
  })
})
