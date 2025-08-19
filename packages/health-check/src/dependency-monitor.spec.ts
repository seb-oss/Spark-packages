import { describe, expect, it, vi } from 'vitest'
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
      it('reports correct mode', async () => {
        const monitor = new DependencyMonitor({
          impact: 'critical',
          syncCall: async () => 'ok',
          pollRate: 10_000,
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('polled')
      })
    })
    describe('mode: async', () => {
      it('reports correct mode', async () => {
        const monitor = new DependencyMonitor({
          impact: 'critical',
          asyncCall: (reportResponse) => {
            reportResponse('ok')
          },
          pollRate: 10_000,
        })
        const status = await monitor.check()
        expect(status.mode).toEqual('async')
      })
    })
  })
})
