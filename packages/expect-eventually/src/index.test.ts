import { expect, test, vi } from 'vitest'
import './index'

test('resolves immediately when assertion passes', async () => {
  const fn = vi.fn()
  fn()
  await expect(fn).eventually().toHaveBeenCalled()
})

test('retries until assertion passes', async () => {
  const fn = vi.fn()
  setTimeout(() => fn(), 100)
  await expect(fn).eventually().toHaveBeenCalled()
})

test('throws last assertion error when timeout is exceeded', async () => {
  const fn = vi.fn()
  await expect(
    expect(fn).eventually({ timeout: 100, interval: 20 }).toHaveBeenCalled()
  ).rejects.toThrow()
})

test('accepts custom timeout and interval', async () => {
  const fn = vi.fn()
  setTimeout(() => fn(), 150)
  await expect(fn).eventually({ timeout: 500, interval: 50 }).toHaveBeenCalled()
})

test('supports .not chaining', async () => {
  const fn = vi.fn()
  await expect(fn).eventually().not.toHaveBeenCalled()
})

test('supports .not chaining — retries until condition is met', async () => {
  let value = 'initial'
  setTimeout(() => {
    value = 'changed'
  }, 100)
  await expect(() => value)
    .eventually()
    .not.toEqual('initial')
})

test('supports .toEqual', async () => {
  let value = 0
  setTimeout(() => {
    value = 42
  }, 100)
  await expect(() => value)
    .eventually()
    .toEqual(42)
})

test('returns undefined for non-string, non-special symbol access', async () => {
  const fn = vi.fn()
  const proxy = expect(fn).eventually()
  // Accessing via an arbitrary symbol reaches the typeof prop !== 'string' guard
  expect(
    (proxy as Record<symbol, unknown>)[Symbol.for('custom')]
  ).toBeUndefined()
})
