import { afterEach } from 'node:test'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Persistor } from './index.js'

vi.mock('redis')

const REDIS_URL = {
  url: 'redis://127.0.0.1:6379',
}

const store: Persistor = new Persistor({
  redis: REDIS_URL,
})

describe('Persistor', () => {
  afterAll(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.runAllTimers()
  })

  it('should cache and return the result', async () => {
    const timestamp = Date.now()
    store.set<number>('testKey', { value: 43, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: 43,
      ttl: 10,
      timestamp,
    })
  })

  it('should delete the value in cache', async () => {
    const timestamp = Date.now()
    store.set('testKey', { value: 43, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: 43,
      ttl: 10,
      timestamp,
    })
    store.delete('testKey')
    expect(await store.get('testKey')).toEqual(null)
  })

  it('should store all primitives in javascript', async () => {
    const timestamp = Date.now()
    // String
    store.set('testKey', { value: '43', ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: '43',
      ttl: 10,
      timestamp,
    })
    // Number
    store.set('testKey', { value: 43, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: 43,
      ttl: 10,
      timestamp,
    })
    // Bigint
    const hugeHex = BigInt('0x1fffffffffffff')
    // 9007199254740991n
    store.set('testKey', { value: hugeHex, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: hugeHex,
      ttl: 10,
      timestamp,
    })
    const alsoHuge = BigInt(9007199254740991)
    // 9007199254740991n
    store.set('testKey', { value: alsoHuge, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: alsoHuge,
      ttl: 10,
      timestamp,
    })
    const hugeString = BigInt('9007199254740991')
    // 9007199254740991n
    store.set('testKey', { value: hugeString, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: hugeString,
      ttl: 10,
      timestamp,
    })
    const hugeOctal = BigInt('0o377777777777777777')
    // 9007199254740991n
    store.set('testKey', { value: hugeOctal, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: hugeOctal,
      ttl: 10,
      timestamp,
    })
    const hugeBin = BigInt(
      '0b11111111111111111111111111111111111111111111111111111'
    )
    store.set('testKey', { value: hugeBin, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: hugeBin,
      ttl: 10,
      timestamp,
    })
    // Boolean
    store.set('testKey', { value: true, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: true,
      ttl: 10,
      timestamp,
    })
    // Undefined
    store.set('testKey', { value: undefined, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: undefined,
      ttl: 10,
      timestamp,
    })
    // Null
    store.set('testKey', { value: null, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: null,
      ttl: 10,
      timestamp,
    })
  })

  it('should store all complex data types in javascript', async () => {
    const timestamp = Date.now()

    // Simple object
    store.set('testKey', { value: { a: 1, b: 2 }, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: { a: 1, b: 2 },
      ttl: 10,
      timestamp,
    })

    // Nested object
    const nestedObject = {
      user: {
        id: 123,
        profile: {
          name: 'Jane Doe',
          hobbies: ['reading', 'traveling', 'gaming'],
        },
      },
      settings: {
        darkMode: true,
        notifications: {
          email: false,
          sms: true,
        },
      },
    }
    store.set('testKey', { value: nestedObject, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: nestedObject,
      ttl: 10,
      timestamp,
    })

    // Mixed object
    const mixedObject = {
      numberKey: 42,
      stringKey: 'Hello World',
      booleanKey: false,
      nullKey: null,
      bigintKey: BigInt(123),
      arrayKey: [1, 'a', null],
      mapKey: new Map<string, unknown>([
        ['key1', 'value1'],
        ['key2', 2],
      ]),
      setKey: new Set(['x', 'y', 'z']),
    }

    store.set('testKey', { value: mixedObject, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: mixedObject,
      ttl: 10,
      timestamp,
    })

    // Simple set
    const simpleSet = new Set([1, 2, 3, 4, 5])
    store.set<Set<number>>('testKey', { value: simpleSet, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: simpleSet,
      ttl: 10,
      timestamp,
    })

    // Mixed set
    const big = BigInt(123)
    const mixedSet = new Set([42, 'hello', true, null, big])
    store.set('testKey', { value: mixedSet, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: mixedSet,
      ttl: 10,
      timestamp,
    })

    // Nested set
    const nestedSet = new Set([new Set([1, 2, 3]), new Set(['a', 'b', 'c'])])
    store.set('testKey', { value: nestedSet, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: nestedSet,
      ttl: 10,
      timestamp,
    })

    // Simple map
    const simpleMap = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ])

    store.set('testKey', { value: simpleMap, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: simpleMap,
      ttl: 10,
      timestamp,
    })

    // Map with mixed data type
    const mixedMap = new Map<unknown, unknown>([
      [1, 'one'],
      ['two', 2],
      [true, 'booleanKey'],
      [null, 'nullKey'],
    ])

    store.set('testKey', { value: mixedMap, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: mixedMap,
      ttl: 10,
      timestamp,
    })

    // Nested map
    const nestedMap = new Map<unknown, unknown>([
      [
        'innerMap',
        new Map<string, unknown>([
          ['nestedKey1', 'nestedValue1'],
          ['nestedKey2', 42],
        ]),
      ],
      [
        'anotherMap',
        new Map<boolean, string>([
          [true, 'trueValue'],
          [false, 'falseValue'],
        ]),
      ],
    ])
    store.set('testKey', { value: nestedMap, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: nestedMap,
      ttl: 10,
      timestamp,
    })

    store.set('testKey', { value: nestedMap, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: nestedMap,
      ttl: 10,
      timestamp,
    })

    // Complex structure
    const complexTestStructure = {
      sets: {
        simpleSet: new Set([1, 2, 3]),
        mixedSet: new Set([42, 'hello', true, null, 123]),
      },
      maps: {
        simpleMap: new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
        nestedMap: new Map([
          [
            'innerMap',
            new Map<string, unknown>([
              ['nestedKey1', 'nestedValue1'],
              ['nestedKey2', 42],
            ]),
          ],
        ]),
      },
      object: {
        basic: {
          name: 'Alice',
          age: 25,
        },
        withNestedData: {
          hobbies: ['reading', 'coding'],
          preferences: {
            theme: 'dark',
            notifications: false,
          },
        },
      },
    }

    store.set('testKey', { value: complexTestStructure, ttl: 10, timestamp })
    expect(await store.get('testKey')).toEqual({
      value: complexTestStructure,
      ttl: 10,
      timestamp,
    })
  })
})
