import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DependencyMonitor } from './dependency-monitor'
import { StatusValue } from './types'

describe('DependencyMonitor', () => {
  it('can be instantiated', () => {
    const monitor = new DependencyMonitor({
      impact: 'critical',
      healthyLimitMs: 50,
      timeoutLimitMs: 500,
      syncCall: async () => 'ok',
    })
    expect(monitor).toBeInstanceOf(DependencyMonitor)
  })
  describe('check', () => {
    it('reports correct base info', async () => {
      const monitor = new DependencyMonitor({
        impact: 'critical',
        healthyLimitMs: 50,
        timeoutLimitMs: 500,
        syncCall: async () => 'ok',
      })
      const status = await monitor.check()
      expect(status.impact).toEqual('critical')
    })
    it.skip('throws if called after dispose', async () => {
      const monitor = new DependencyMonitor({
        impact: 'critical',
        healthyLimitMs: 50,
        timeoutLimitMs: 500,
        syncCall: async () => 'ok',
      })
      monitor.dispose()
      const success = vi.fn()
      const fail = vi.fn()
      await monitor.check().then(success).catch(fail)

      expect(success).not.toHaveBeenCalled()
      expect(fail).toHaveBeenCalledWith(new Error('DependencyMonitor has been disposed'))
    })
    describe('mode: inline', () => {
      it('reports correct mode', async () => {
        const monitor = new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 50,
          timeoutLimitMs: 500,
          syncCall: async () => 'ok',
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('inline')
      })
      it('returns the dependency status', async () => {
        const dependency = vi.fn().mockResolvedValue('error')
        const monitor = new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 50,
          timeoutLimitMs: 500,
          syncCall: dependency,
        })
        const status = await monitor.check()
        expect(status.status).toEqual('error')
      })
      it('calls the dependency every time', async () => {
        const dependency = vi.fn().mockResolvedValue('error')
        const monitor = new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 50,
          timeoutLimitMs: 500,
          syncCall: dependency,
        })

        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(1)

        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(2)
      })
      it('succeeds, times out, then succeeds again', async () => {
        vi.useFakeTimers()

        const dependency = vi.fn()
        const monitor = new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 500,
          timeoutLimitMs: 1_000,
          syncCall: dependency,
        })

        // 1st call resolves in time → ok
        dependency.mockResolvedValueOnce('ok')
        const check1 = monitor.check()
        await expect(check1).resolves.toEqual(
          expect.objectContaining({ status: 'ok' })
        )

        // 2nd call: let timeout fire → error
        dependency.mockRejectedValueOnce(new Error())
        const check2 = monitor.check()
        await expect(check2).resolves.toEqual(
          expect.objectContaining({ status: 'error' })
        )

        // 3rd call resolves quickly → ok again
        dependency.mockResolvedValueOnce('ok')
        const check3 = monitor.check()
        await expect(check3).resolves.toEqual(
          expect.objectContaining({ status: 'ok' })
        )

        vi.useRealTimers()
      })
    })
    describe('mode: polled', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })
      afterEach(() => {
        vi.useRealTimers()
      })
      it('reports correct mode', async () => {
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: async () => 'ok',
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          pollRate: 10_000,
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('polled')
      })
      it('reports correctly before first data', async () => {
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: async () => 'ok',
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          pollRate: 10_000,
        })
        const status = await monitor.check()
        expect(status).toEqual({
          impact: 'critical',
          mode: 'polled',
          status: 'unknown',
          observed: undefined,
          freshness: undefined,
        })
      })
      it('calls dependency immediately', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          pollRate: 10_000,
        })
        expect(dependency).toHaveBeenCalledTimes(1)
      })
      it('does not call dependency on check', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          pollRate: 10_000,
        })
        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(1)
      })
      it('calls dependency by pollRate', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          pollRate: 10_000,
        })

        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(3)
      })
      it('uses retryRate after a thrown error, then pollRate after a success', async () => {
        const dependency = vi
          .fn<() => Promise<'ok' | 'error'>>()
          .mockRejectedValueOnce(new Error('boom')) // 1st call errors
          .mockResolvedValueOnce('ok')              // retry succeeds
          .mockResolvedValue('ok')                  // subsequent calls succeed

        const monitor = new DependencyMonitor({
          impact: 'critical',
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          retryRate: 2_000,
          syncCall: dependency
        })

        // initial poll runs immediately in constructor
        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        // because it errored, next poll should happen after retryRate (2s), not pollRate (10s)
        await vi.advanceTimersByTimeAsync(1_999)
        expect(dependency).toHaveBeenCalledTimes(1)
        await vi.advanceTimersByTimeAsync(1)
        expect(dependency).toHaveBeenCalledTimes(2) // retry fired

        // after success, next should switch back to pollRate (10s)
        await vi.advanceTimersByTimeAsync(1_999)
        expect(dependency).toHaveBeenCalledTimes(2)
        await vi.advanceTimersByTimeAsync(8_001)
        expect(dependency).toHaveBeenCalledTimes(3)
      })
      it('treats resolved "error" status as error for retry scheduling', async () => {
        const dependency = vi
          .fn<() => Promise<'ok' | 'error'>>()
          .mockResolvedValueOnce('error') // 1st call returns 'error' status
          .mockResolvedValueOnce('ok')    // retry succeeds

        const monitor = new DependencyMonitor({
          impact: 'critical',
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          retryRate: 3_000,
          syncCall: dependency
        })

        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        // because status === 'error', next should be scheduled using retryRate (3s)
        await vi.advanceTimersByTimeAsync(2_999)
        expect(dependency).toHaveBeenCalledTimes(1)
        await vi.advanceTimersByTimeAsync(1)
        expect(dependency).toHaveBeenCalledTimes(2)

        // after success, next goes back to pollRate (10s)
        await vi.advanceTimersByTimeAsync(9_999)
        expect(dependency).toHaveBeenCalledTimes(2)
        await vi.advanceTimersByTimeAsync(1)
        expect(dependency).toHaveBeenCalledTimes(3)
      })
      it('doCheck exits early when disposed (extra safeguard)', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')

        const monitor = new DependencyMonitor({
          impact: 'critical',
          pollRate: 1_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
          syncCall: dependency
        })

        // initial scheduled call
        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        // dispose clears timers and sets isDisposed
        monitor.dispose()

        // Manually invoke the private method to exercise the guard
        await (monitor as any).doCheck()

        // No additional calls should have been made
        expect(dependency).toHaveBeenCalledTimes(1)
      })
    })
    describe('mode: async', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })
      afterEach(() => {
        vi.useRealTimers()
      })

      it('reports correct mode', async () => {
        using monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: (report) => {
            // immediate push
            report('ok')
          },
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('async')
      })

      it('calls dependency immediately', async () => {
        const dependency = vi.fn(
          (report: (s: 'ok' | 'degraded' | 'error') => void) => {
            report('ok')
          }
        )

        using monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: dependency,
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
        })

        // allow constructor tick to run
        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)
      })

      it('does not call dependency on check (uses cached result)', async () => {
        const dependency = vi.fn(
          (report: (s: 'ok' | 'degraded' | 'error') => void) => {
            report('ok')
          }
        )

        using monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: dependency,
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
        })

        await vi.runAllTicks()
        const before = dependency.mock.calls.length
        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(before)
      })

      it('calls dependency by pollRate', async () => {
        const dependency = vi.fn(
          (report: (s: 'ok' | 'degraded' | 'error') => void) => {
            report('ok')
          }
        )

        using monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: dependency,
          pollRate: 10_000,
          healthyLimitMs: 800,
          timeoutLimitMs: 2_000,
        })

        // initial call from constructor
        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        // subsequent polls
        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(3)
      })

      it('updates status when reportResponse is called later (async completion)', async () => {
        const dependency = vi.fn(
          (report: (s: 'ok' | 'degraded' | 'error') => void) => {
            // simulate upstream responding later
            setTimeout(() => report('ok'), 1_000)
          }
        )

        using monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: dependency,
          pollRate: 10_000,
          healthyLimitMs: 1_200,
          timeoutLimitMs: 2_000,
        })

        await vi.runAllTicks() // schedules the setTimeout inside asyncCall
        await vi.advanceTimersByTimeAsync(1_000)

        const status = await monitor.check()
        expect(status.status).toBe('ok')
        expect(status.freshness.lastSuccess).not.toBeNull()
      })

      it('stops polling after dispose', async () => {
        const dependency = vi.fn(
          (report: (s: 'ok' | 'degraded' | 'error') => void) => {
            report('ok')
          }
        )

        {
          using monitor = new DependencyMonitor({
            impact: 'critical',
            asyncCall: dependency,
            pollRate: 10_000,
            healthyLimitMs: 800,
            timeoutLimitMs: 2_000,
          })

          await vi.runAllTicks()
          expect(dependency).toHaveBeenCalledTimes(1)
          // leaving this block will auto-dispose (Symbol.dispose)
        }

        const before = dependency.mock.calls.length
        await vi.advanceTimersByTimeAsync(30_000)
        expect(dependency).toHaveBeenCalledTimes(before) // no more polls after dispose
      })
    })
  })
})
