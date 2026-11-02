import type { PromisifyAssertion } from '@vitest/expect'
import { expect, expectTypeOf, test } from 'vitest'
import './index'

test('eventually() keeps the received type', () => {
  expectTypeOf(expect(42).eventually()).toEqualTypeOf<
    PromisifyAssertion<number>
  >()
})

test('eventually() returns promises from matchers', () => {
  expectTypeOf(expect(42).eventually().toBe(42)).toEqualTypeOf<Promise<void>>()
})
