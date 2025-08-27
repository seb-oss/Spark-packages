import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express, { type Express } from 'express'
import { pingRedis, startRedis } from './redis.helper'
import { pingApi, startApi } from './api.helper'
import { pingPubSub, startPubSub } from './pubsub.helper'
import { HealthMonitor, ReadinessPayload } from '../'
import { DependencyMonitor } from '../dependency-monitor'
import { waitFor } from './wait-for.helper'

describe('health-check', () => {
  let app: Express
  let monitor: HealthMonitor

  beforeEach(() => {
    app = express()
    monitor = new HealthMonitor()
    app.use(monitor.router)
  })
  afterEach(() => {
    monitor.dispose()
  })
  describe('health/ping', () => {
    it('returns ok if the server is alive', async () => {
      const res = await request(app).get('/health/ping')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
  })
  describe('health/live', () => {
    it('returns liveness info with system and process details', async () => {
      const res = await request(app).get('/health/live')

      expect(res.status).toBe(200)

      expect(res.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        system: {
          hostname: expect.any(String),
          platform: expect.any(String),
          release: expect.any(String),
          arch: expect.any(String),
          uptime: expect.any(Number),
          loadavg: expect.any(Array),
          totalmem: expect.any(Number),
          freemem: expect.any(Number),
          memUsedRatio: expect.any(Number),
          cpus: {
            count: expect.any(Number),
          },
        },
        process: {
          pid: expect.any(Number),
          node: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
        },
      })

      // Check that timestamp is recent (within ~10ms of now)
      const diff = Date.now() - Date.parse(res.body.timestamp)
      expect(diff).toBeLessThan(20)
    })
  })
  describe('health/ready', () => {
    let redis: Awaited<ReturnType<typeof startRedis>>
    let api: Awaited<ReturnType<typeof startApi>>
    let pubsub: Awaited<ReturnType<typeof startPubSub>>

    let redisDependency: DependencyMonitor
    let apiDependency: DependencyMonitor
    let pubsubDependency: DependencyMonitor

    beforeEach(async () => {
      redis = await startRedis()
      redisDependency = new DependencyMonitor({
        syncCall: async () => {
          try {
            await pingRedis(redis)
            return 'ok'
          } catch (err) {
            return err as Error
          }
        },
        impact: 'critical',
        healthyLimitMs: 50,
        timeoutLimitMs: 500,
      })
      monitor.addDependency('redis', redisDependency)

      api = await startApi()
      apiDependency =  new DependencyMonitor({
        syncCall: async () => {
          try {
            await pingApi(api)
            return 'ok'
          } catch (err) {
            return err as Error
          }
        },
        impact: 'non_critical',
        healthyLimitMs: 250,
        timeoutLimitMs: 1000,
        pollRate: 1000,
      })
      monitor.addDependency('api', apiDependency)

      pubsub = await startPubSub()
      pubsubDependency = new DependencyMonitor({
        impact: 'critical',
        healthyLimitMs: 100,
        timeoutLimitMs: 1_000,
        pollRate: 500,
        asyncCall: (callback) => {
          pingPubSub(pubsub, (_message) => {
            callback('ok')
          })
        }
      })
      monitor.addDependency('pubsub', pubsubDependency)
    })
    afterEach(async () => {
      await redis.stop()
      await api.stop()
      await pubsub.stop()
    })
    it('returns general readiness payload', async () => {
      const res = await request(app).get('/health/ready')
      expect(res.status).toBe(200)

      // assert general shape (don’t care what checks exist here)
      expect(res.body).toMatchObject({
        status: expect.stringMatching(/^(ok|degraded|error)$/),
        timestamp: expect.any(String),
        summary: expect.any(Object),
        checks: expect.any(Object),
      })
    })
    it('includes the redis inline dependency check', async () => {
      const res = await request(app).get('/health/ready')
      expect(res.status).toBe(200)

      const redisCheck = res.body?.checks?.redis
      expect(redisCheck).toBeDefined()
      expect(redisCheck).toMatchObject({
        impact: 'critical',
        mode: 'inline',
        status: 'ok',
        freshness: {
          lastChecked: expect.any(String),
          lastSuccess: expect.anything(), // string or null depending on status
        },
      })
    })
    it.skip('declares api polled dependency check as unknown from the start', async () => {
      const res = await request(app).get('/health/ready')
      expect(res.status).toBe(200)

      const apiCheck = (res.body as ReadinessPayload).checks.api
      expect(apiCheck).toBeDefined()
      expect(apiCheck.status).toEqual('unknown')
    })
    it('updates with api polled dependency check', async () => {
      await waitFor(async () =>{
        const res = await request(app).get('/health/ready')
        expect(res.status).toBe(200)

        const apiCheck = (res.body as ReadinessPayload).checks.api
        expect(apiCheck).toBeDefined()
        expect(apiCheck).toMatchObject({
          impact: 'non_critical',
          mode: 'polled',
          status: 'ok',
          freshness: {
            lastChecked: expect.any(String),
            lastSuccess: expect.any(String),
          },
        })
      })
    })
    it('declares pubsub polled, async dependency check as unknown from the start', async () => {
      const res = await request(app).get('/health/ready')
      expect(res.status).toBe(200)

      const pubsubCheck = (res.body as ReadinessPayload).checks.pubsub
      expect(pubsubCheck).toBeDefined()
      expect(pubsubCheck.status).toEqual('unknown')
    })
    it('updates with pubsub polled, async dependency check', async () => {
      await waitFor(async () =>{
        const res = await request(app).get('/health/ready')
        expect(res.status).toBe(200)

        const pubsubCheck = (res.body as ReadinessPayload).checks.pubsub
        expect(pubsubCheck).toBeDefined()
        expect(pubsubCheck).toMatchObject({
          impact: 'critical',
          mode: 'async',
          status: 'ok',
          freshness: {
            lastChecked: expect.any(String),
            lastSuccess: expect.any(String),
          },
        })
      })
    })
  })
})
