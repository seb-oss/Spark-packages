import { Router } from 'express'
import { liveness, ping } from './static-checks'

export class HealthMonitor {
  private readonly _router: Router

  constructor() {
    this._router = this.createRouter()
  }

  public addCriticalDependency() {
    return this
  }

  public addDependency() {
    return this
  }

  private createRouter() {
    const router = Router()

    // Ping
    router.get('/health/ping', (_req, res) => {
      res.status(200).json(ping())
    })

    // Liveness
    router.get('/health/live', (_req, res) => {
      res.status(200).json(liveness())
    })

    return router
  }
  public get router() {
    return this._router
  }
}
