import type { PromisifyAssertion } from '@vitest/expect'
import { expect } from 'vitest'

type EventuallyConfig = {
  timeout?: number
  interval?: number
}

/** A vitest assertion chain node — the object returned by `expect()`. */
type VitestAssertion = ReturnType<typeof expect>

/**
 * A member of a vitest assertion node: either another assertion (chain
 * property like `.not`) or a callable matcher (terminal method).
 */
type AssertionMember = VitestAssertion | ((...args: unknown[]) => void)

const DEFAULT_TIMEOUT = 1000
const DEFAULT_INTERVAL = 50

/**
 * Resolves the value to assert against. If `received` is a plain function
 * (not a spy/mock), it is called so callers can pass a getter like
 * `() => someVar` to observe a value that changes over time.
 */
function getValue(received: unknown): unknown {
  const isPlainFunction =
    typeof received === 'function' && !('mock' in (received as object))
  return isPlainFunction ? (received as () => unknown)() : received
}

/**
 * Walks an assertion chain by traversing `props` on the root object one step
 * at a time, returning the final object. Used to replay `.not`, `.resolves`,
 * etc. before invoking the terminal matcher.
 */
function walkChain(root: VitestAssertion, props: string[]): VitestAssertion {
  let node: unknown = root
  for (const prop of props) {
    node = (node as Record<string, unknown>)[prop]
  }
  return node as VitestAssertion
}

/**
 * Builds a fresh vitest assertion for `received` and walks to the node
 * described by `propChain`, returning both the node and the named member.
 * Used to check whether a member is a method (terminal matcher) or a
 * chainable property like `.not`.
 */
function resolveAssertion(
  received: unknown,
  propChain: string[],
  prop: string
): { target: VitestAssertion; member: AssertionMember } {
  const root = expect(getValue(received))
  const target = walkChain(root, propChain)
  const member = (target as unknown as Record<string, AssertionMember>)[prop]
  return { target, member }
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
        const { target, member } = resolveAssertion(received, propChain, prop)

        if (typeof member === 'function') {
          return (...args: unknown[]) =>
            retryUntil(
              () => {
                const { target: t, member: m } = resolveAssertion(
                  received,
                  propChain,
                  prop
                )
                const matcher = m as (...a: unknown[]) => void
                matcher.call(t, ...args)
              },
              timeout,
              interval
            )
        }

        // Chainable property — record it and return a deeper proxy
        void target // resolveAssertion called only for the type check above
        return createRetryProxy(received, config, [...propChain, prop])
      },
    }
  )
}

// Patch the Assertion prototype directly so eventually() can return our proxy.
// expect.extend cannot be used here because vitest always returns `this` from
// extended matchers, ignoring any return value.
// biome-ignore lint/suspicious/noExplicitAny: needed for prototype access
const assertionProto = Object.getPrototypeOf((expect as any)(undefined))
assertionProto.eventually = function (config: EventuallyConfig = {}) {
  return createRetryProxy(this._obj, config)
}

declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: must match vitest's Assertion signature exactly
  interface Assertion<T = any> {
    eventually(config?: EventuallyConfig): PromisifyAssertion<T>
  }
}
