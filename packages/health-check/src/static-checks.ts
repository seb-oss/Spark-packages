import os from 'node:os'
import type { Liveness, Status } from './types'

export const ping = (): Status => ({ status: 'ok' })
export const liveness = (): Liveness => {
  const cpus = os.cpus()
  const total = os.totalmem()
  const free = os.freemem()
  let memUsedRatio: number
  /* istanbul ignore else */
  if (total > 0) {
    memUsedRatio = (total - free) / total
  } else {
    memUsedRatio = 0
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    system: {
      uptime: os.uptime(),
      loadavg: os.loadavg() as [number, number, number],
      totalmem: total,
      freemem: free,
      memUsedRatio,
      cpus: {
        count: cpus.length,
      },
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  }
}
