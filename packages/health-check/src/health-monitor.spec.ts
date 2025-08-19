import { beforeEach, describe, expect, it } from 'vitest'
import { HealthMonitor } from './health-monitor'
import express, { type Express, Router } from 'express'
import { agent } from 'supertest'

describe('HealthMonitor', () => {
  it('can be instantiated', () => {
    const monitor = new HealthMonitor()
    expect(monitor).toBeInstanceOf(HealthMonitor)
  })

  describe('.router', () => {
    let app: Express
    let monitor: HealthMonitor
    beforeEach(() => {
      monitor = new HealthMonitor()
      app = express().use(monitor.router)
    })
    it('returns a router', () => {
      expect(monitor.router).toBeInstanceOf(Router)
    })
    it('responds to /health/ping', async () => {
      const res = await agent(app).get('/health/ping')
      expect(res.status).toEqual(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
    it('responds to /health/live', async () => {
      const res = await agent(app).get('/health/live')
      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      })
      expect(Date.now() - Date.parse(res.body.timestamp)).toBeLessThan(10)
    })
  })
})
