import os from 'node:os'
import type { Liveness, Status } from './types'

export const ping = (): Status => ({ status: 'ok' })
export const liveness = (): Liveness => {
  const cpus = os.cpus()
  const total = os.totalmem()
  const free = os.freemem()

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadavg: os.loadavg() as [number, number, number],
      totalmem: total,
      freemem: free,
      memUsedRatio: total > 0 ? (total - free) / total : 0,
      cpus: {
        count: cpus.length,
        model: cpus[0]?.model,
        speedMHz: cpus[0]?.speed,
      },
    },
    process: {
      pid: process.pid,
      node: process.versions.node,
      uptime: process.uptime(),
      memory: process.memoryUsage(), // rss, heapTotal, heapUsed, external, arrayBuffers
    },
  }
}
