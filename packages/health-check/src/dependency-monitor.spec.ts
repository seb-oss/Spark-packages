import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DependencyMonitor } from './dependency-monitor'

describe('DependencyMonitor', () => {
  it('can be instantiated', () => {
    const monitor = new DependencyMonitor({
      impact: 'critical',
      syncCall: async () => 'ok',
    })
    expect(monitor).toBeInstanceOf(DependencyMonitor)
  })
  describe('check', () => {
    it('reports correct base info', async () => {
      const monitor = new DependencyMonitor({
        impact: 'critical',
        syncCall: async () => 'ok',
      })
      const status = await monitor.check()
      expect(status.impact).toEqual('critical')
    })
    describe('mode: inline', () => {
      it('reports correct mode', async () => {
        const monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: async () => 'ok',
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('inline')
      })
      it('returns the dependency status', async () => {
        const dependency = vi.fn().mockResolvedValue('error')
        const monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
        })
        const status = await monitor.check()
        expect(status.status).toEqual('error')
      })
      it('calls the dependency every time', async () => {
        const dependency = vi.fn().mockResolvedValue('error')
        const monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
        })

        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(1)

        await monitor.check()
        expect(dependency).toHaveBeenCalledTimes(2)
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
          pollRate: 10_000,
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('polled')
      })
      it('calls dependency immediately', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
          pollRate: 10_000,
        })
        expect(dependency).toHaveBeenCalledTimes(1)
      })
      it('does not call dependency on check', async () => {
        const dependency = vi.fn().mockResolvedValue('ok')
        using monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: dependency,
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
          pollRate: 10_000,
        })

        await vi.runAllTicks()
        expect(dependency).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(10_000)
        expect(dependency).toHaveBeenCalledTimes(3)
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
