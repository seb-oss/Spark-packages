import type { Liveness, Status } from './types'

export const ping = (): Status => ({ status: 'ok' })
export const liveness = (): Liveness => ({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
})
