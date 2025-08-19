import express, { type Express, Router } from 'express'
import { agent } from 'supertest'
// health-monitor.methods.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthMonitor } from './health-monitor'

describe('HealthMonitor methods', () => {
  describe('.ping', () => {
    it('returns ok', () => {
      const monitor = new HealthMonitor()
      expect(monitor.ping()).toEqual({ status: 'ok' })
    })
  })

  describe('.live', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns uptime and a fresh timestamp', () => {
      const monitor = new HealthMonitor()
      const res = monitor.live()
      expect(res.status).toBe('ok')
      expect(res.uptime).toEqual(expect.any(Number))
      expect(Date.now() - Date.parse(res.timestamp)).toBeLessThan(10)
    })
  })

  describe('.ready', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns ok and empty checks when no dependencies', async () => {
      const monitor = new HealthMonitor()
      const res = await monitor.ready()
      expect(res).toEqual({ status: 'ok', checks: {} })
    })

    it('includes inline dependency result and overall ok', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency('db', {
        impact: 'critical',
        syncCall: async () => 'ok',
      })
      const res = await monitor.ready()
      expect(res.status).toBe('ok')
      expect(res.checks.db).toMatchObject({
        status: 'ok',
        impact: 'critical',
        mode: 'inline',
        freshness: {
          lastChecked: expect.any(String),
          lastSuccess: expect.any(String),
        },
      })
    })

    it('includes polled dependency result (initial tick) and overall ok', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency('redis', {
        impact: 'critical',
        pollRate: 10_000,
        syncCall: async () => 'ok',
      })

      await vi.runAllTicks()

      const res = await monitor.ready()
      expect(res.status).toBe('ok')
      expect(res.checks.redis).toMatchObject({
        status: 'ok',
        impact: 'critical',
        mode: 'polled',
        freshness: { lastChecked: expect.any(String) },
      })
    })

    it('overall degraded when a non-critical dependency is degraded', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency('paymentsApi', {
        impact: 'non_critical',
        pollRate: 5_000,
        syncCall: async () => 'degraded',
      })

      await vi.runAllTicks()

      const res = await monitor.ready()
      expect(res.status).toBe('degraded')
      expect(res.checks.paymentsApi.status).toBe('degraded')
    })

    it('overall error when a critical dependency errors', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency('postgres', {
        impact: 'critical',
        syncCall: async () => {
          throw new Error('boom')
        },
      })

      const res = await monitor.ready()
      expect(res.status).toBe('error')
      expect(res.checks.postgres.status).toBe('error')
    })

    it('uses cached async result and can degrade overall', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency('quotesApi', {
        impact: 'non_critical',
        pollRate: 10_000,
        asyncCall: (report) => {
          setTimeout(() => report('degraded'), 1_000)
        },
      })

      await vi.runAllTicks()
      await vi.advanceTimersByTimeAsync(1_000)

      const res = await monitor.ready()
      expect(res.status).toBe('degraded')
      expect(res.checks.quotesApi.status).toBe('degraded')
      expect(res.checks.quotesApi.mode).toBe('async')
    })

    it('synthesizes an error snapshot when a dependency check rejects', async () => {
      const monitor = new HealthMonitor()
      monitor.addDependency('flaky', {
        impact: 'non_critical',
        pollRate: 10_000,
        syncCall: async () => 'ok',
      })

      // Force the underlying DependencyMonitor to reject on check()
      const dep = (monitor as any).dependencies.get('flaky')
      vi.spyOn(dep, 'check').mockRejectedValue(new Error('boom'))

      const res = await monitor.ready()

      // overall becomes degraded (non_critical error)
      expect(res.status).toBe('degraded')

      // synthetic snapshot from the "else" branch
      expect(res.checks.flaky).toMatchObject({
        status: 'error',
        impact: 'non_critical',
        mode: 'polled',
        freshness: {
          lastChecked: expect.any(String),
          lastSuccess: null,
        },
        error: {
          code: 'CHECK_FAILED',
          message: expect.stringContaining('boom'),
        },
      })
    })
  })
  describe('.router', () => {
    let app: Express
    let monitor: HealthMonitor

    beforeEach(() => {
      monitor = new HealthMonitor()
      app = express().use(monitor.router)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      monitor.dispose()
    })

    it('exposes an Express Router', () => {
      expect(monitor.router).toBeInstanceOf(Router)
    })

    it('GET /health/ping calls .ping and returns its value', async () => {
      const stub = vi.spyOn(monitor, 'ping').mockReturnValue({ status: 'ok' })
      const res = await agent(app).get('/health/ping')
      expect(stub).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })

    it('GET /health/live calls .live and returns its value', async () => {
      const payload = {
        status: 'ok',
        uptime: 123,
        timestamp: '2025-08-19T12:00:00Z',
      }
      const stub = vi.spyOn(monitor, 'live').mockReturnValue(payload as any)
      const res = await agent(app).get('/health/live')
      expect(stub).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(200)
      expect(res.body).toEqual(payload)
    })

    it('GET /health/ready calls .ready and returns its value', async () => {
      const payload = { status: 'ok', checks: { db: { status: 'ok' } } }
      const stub = vi.spyOn(monitor, 'ready').mockResolvedValue(payload as any)
      const res = await agent(app).get('/health/ready')
      expect(stub).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(200)
      expect(res.body).toEqual(payload)
    })
  })
})
