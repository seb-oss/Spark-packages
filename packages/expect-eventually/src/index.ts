import type { PromisifyAssertion } from '@vitest/expect'
import { expect } from 'vitest'

type EventuallyConfig = {
  timeout?: number
  interval?: number
}

const DEFAULT_TIMEOUT = 1000
const DEFAULT_INTERVAL = 50

/**
 * Resolves the value to assert against. If `received` is a plain function
 * (not a spy/mock), it is called so callers can pass a getter like
 * `() => someVar` to observe a value that changes over time.
 */
function getValue(received: unknown): unknown {
  return typeof received === 'function' && !('mock' in received)
    ? received()
    : received
}

/**
 * Reads `prop` from an assertion chain node. Chain nodes are objects or, for
 * chai's chainable methods like `.a`, functions; anything else has no members.
 */
function readMember(node: unknown, prop: string): unknown {
  return (typeof node === 'object' && node !== null) ||
    typeof node === 'function'
    ? Reflect.get(node, prop)
    : undefined
}

/**
 * Builds a fresh vitest assertion for `received` and walks `propChain` (e.g.
 * `.not`, `.resolves`), returning the final node and its member `prop`.
 * Used to check whether a member is a method (terminal matcher) or a
 * chainable property like `.not`.
 */
function resolveAssertion(
  received: unknown,
  propChain: string[],
  prop: string
): { target: unknown; member: unknown } {
  const target = propChain.reduce<unknown>(
    readMember,
    expect(getValue(received))
  )
  return { target, member: readMember(target, prop) }
}

/**
 * Retries `fn` on a fixed interval until it stops throwing or the deadline
 * is reached. Resolves immediately on success; rejects with the last error
 * on timeout.
 */
function retryUntil(
  fn: () => void,
  timeout: number,
  interval: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    let lastError: unknown

    function attempt() {
      try {
        fn()
        resolve()
      } catch (err) {
        lastError = err
        if (Date.now() >= deadline) {
          reject(lastError)
        } else {
          setTimeout(attempt, interval)
        }
      }
    }

    attempt()
  })
}

/**
 * Returns a proxy over the vitest assertion chain that wraps every terminal
 * matcher in a retry loop. Property accesses (`.not`, `.resolves`, etc.) are
 * recorded and replayed on a fresh assertion on each attempt, so that the
 * full chain is re-evaluated against the latest state of `received`.
 */
function createRetryProxy(
  received: unknown,
  config: EventuallyConfig,
  propChain: string[] = []
): object {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT
  const interval = config.interval ?? DEFAULT_INTERVAL

  return new Proxy(
    {},
    {
      get(_target, prop) {
        // Prevent the proxy from being treated as a thenable, primitive, or
        // accessed via an unexpected symbol property.
        if (
          prop === 'then' ||
          prop === Symbol.toPrimitive ||
          prop === Symbol.iterator ||
          typeof prop !== 'string'
        ) {
          return undefined
        }

        // Speculatively resolve to check whether `prop` is a callable matcher
        // or a chainable property (e.g. `.not`).
        const { member } = resolveAssertion(received, propChain, prop)

        if (typeof member === 'function') {
          return (...args: unknown[]) =>
            retryUntil(
              () => {
                const { target: t, member: m } = resolveAssertion(
                  received,
                  propChain,
                  prop
                )
                if (typeof m !== 'function') {
                  throw new TypeError(`${prop} is not a function`)
                }
                Reflect.apply(m, t, args)
              },
              timeout,
              interval
            )
        }

        // Chainable property — record it and return a deeper proxy
        return createRetryProxy(received, config, [...propChain, prop])
      },
    }
  )
}

// Patch the Assertion prototype directly so eventually() can return our proxy.
// expect.extend cannot be used here because vitest always returns `this` from
// extended matchers, ignoring any return value.
const assertionProto = Object.getPrototypeOf(expect(undefined))
assertionProto.eventually = function (config: EventuallyConfig = {}) {
  return createRetryProxy(this._obj, config)
}

declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > {
    eventually(config?: EventuallyConfig): PromisifyAssertion<T>
  }
}
