import express, { type Express, Router } from 'express'
import { agent } from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DependencyMonitor } from './dependency-monitor'
import { HealthMonitor } from './health-monitor'

describe('HealthMonitor', () => {
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

    it('returns ok, a fresh timestamp, and system/process info', () => {
      using monitor = new HealthMonitor()
      const res = monitor.live()

      // status + fresh timestamp
      expect(res.status).toBe('ok')
      expect(typeof res.timestamp).toBe('string')
      expect(Date.now() - Date.parse(res.timestamp)).toBeLessThan(50)

      // system summary
      expect(res.system).toMatchObject({
        hostname: expect.any(String),
        platform: expect.any(String),
        release: expect.any(String),
        arch: expect.any(String),
        uptime: expect.any(Number),
        totalmem: expect.any(Number),
        freemem: expect.any(Number),
        memUsedRatio: expect.any(Number),
        cpus: {
          count: expect.any(Number),
          // model/speedMHz are optional; don’t assert them strictly
        },
      })
      expect(Array.isArray(res.system.loadavg)).toBe(true)
      expect(res.system.loadavg).toHaveLength(3)

      // process summary
      expect(res.process).toMatchObject({
        pid: expect.any(Number),
        node: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
      })
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
      expect(res).toEqual({
        status: 'ok',
        checks: {},
        summary: expect.anything(),
        timestamp: expect.any(String),
      })
    })

    it('includes inline dependency result and overall ok', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency(
        'db',
        new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 50,
          timeoutLimitMs: 1_000,
          syncCall: async () => 'ok',
        })
      )
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
      monitor.addDependency(
        'redis',
        new DependencyMonitor({
          impact: 'critical',
          pollRate: 1_000,
          healthyLimitMs: 50,
          timeoutLimitMs: 500,
          syncCall: async () => 'ok',
        })
      )

      await vi.advanceTimersByTimeAsync(0)

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
      using dependency = new DependencyMonitor({
        impact: 'non_critical',
        pollRate: 5_000,
        healthyLimitMs: 250,
        timeoutLimitMs: 3000,
        syncCall: async () => 'degraded',
      })
      monitor.addDependency('paymentsApi', dependency)

      vi.runAllTicks()
      await vi.advanceTimersByTimeAsync(0)

      const dep = await dependency.check()
      expect(dep.status).toBe('degraded')

      const res = await monitor.ready()
      expect(res.status).toBe('degraded')
      expect(res.checks.paymentsApi.status).toBe('degraded')
    })

    it('overall error when a critical dependency errors', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency(
        'postgres',
        new DependencyMonitor({
          impact: 'critical',
          healthyLimitMs: 50,
          timeoutLimitMs: 1000,
          syncCall: async () => {
            throw new Error('boom')
          },
        })
      )

      const res = await monitor.ready()
      expect(res.status).toBe('error')
      expect(res.checks.postgres.status).toBe('error')
    })

    it('uses cached async result and can degrade overall', async () => {
      using monitor = new HealthMonitor()
      monitor.addDependency(
        'quotesApi',
        new DependencyMonitor({
          impact: 'non_critical',
          pollRate: 10_000,
          healthyLimitMs: 250,
          timeoutLimitMs: 3000,
          asyncCall: (report) => {
            setTimeout(() => report('degraded'), 1_000)
          },
        })
      )

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(1_000)

      const res = await monitor.ready()
      expect(res.status).toBe('degraded')
      expect(res.checks.quotesApi.status).toBe('degraded')
      expect(res.checks.quotesApi.mode).toBe('async')
    })

    it('synthesizes an error snapshot when a dependency check rejects', async () => {
      const monitor = new HealthMonitor()
      monitor.addDependency(
        'flaky',
        new DependencyMonitor({
          impact: 'non_critical',
          pollRate: 10_000,
          healthyLimitMs: 500,
          timeoutLimitMs: 3_000,
          syncCall: async () => 'ok',
        })
      )

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
  describe('.dispose', () => {
    it('dispose() calls dispose on all dependency monitors', () => {
      const monitor = new HealthMonitor()

      const db = new DependencyMonitor({
        impact: 'critical',
        healthyLimitMs: 50,
        timeoutLimitMs: 500,
        syncCall: async () => 'ok',
      })
      const redis = new DependencyMonitor({
        impact: 'critical',
        healthyLimitMs: 500,
        timeoutLimitMs: 2_000,
        pollRate: 5_000,
        syncCall: async () => 'ok',
      })
      const quotesApi = new DependencyMonitor({
        impact: 'non_critical',
        healthyLimitMs: 800,
        timeoutLimitMs: 3_000,
        pollRate: 10_000,
        asyncCall: (report) => report('ok'),
      })

      monitor
        .addDependency('db', db)
        .addDependency('redis', redis)
        .addDependency('quotesApi', quotesApi)

      const dbDispose = vi.spyOn(db, 'dispose')
      const redisDispose = vi.spyOn(redis, 'dispose')
      const quotesDispose = vi.spyOn(quotesApi, 'dispose')

      monitor.dispose()

      expect(dbDispose).toHaveBeenCalledTimes(1)
      expect(redisDispose).toHaveBeenCalledTimes(1)
      expect(quotesDispose).toHaveBeenCalledTimes(1)
    })
  })
})
