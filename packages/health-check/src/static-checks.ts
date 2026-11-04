import os from 'node:os'
import { readCgroupCpu, readCgroupMemory } from './cgroup'
import type { Liveness, Status, System } from './types'

export const ping = (): Status => ({ status: 'ok' })

const hostSystem = (): System => {
  const cpus = os.cpus()
  const total = os.totalmem()
  const free = os.freemem()
  const [load1 = 0, load5 = 0, load15 = 0] = os.loadavg()
  let memUsedRatio: number
  /* istanbul ignore else */
  if (total > 0) {
    memUsedRatio = (total - free) / total
  } else {
    memUsedRatio = 0
  }

  return {
    resourceSource: 'host',
    uptime: os.uptime(),
    loadavg: [load1, load5, load15],
    totalmem: total,
    freemem: free,
    memUsedRatio,
    cpus: {
      count: cpus.length,
    },
  }
}

const cgroupSystem = (
  memory: ReturnType<typeof readCgroupMemory>,
  cpu: ReturnType<typeof readCgroupCpu>
): System => {
  const limit = memory?.limit ?? os.totalmem()
  const usage = memory?.usage ?? os.totalmem() - os.freemem()
  const memUsedRatio = limit > 0 ? usage / limit : 0

  return {
    resourceSource: 'cgroup',
    totalmem: limit,
    freemem: limit - usage,
    memUsedRatio,
    cpus: {
      count: cpu?.quota ?? os.cpus().length,
    },
  }
}

const getSystem = (): System => {
  const memory = readCgroupMemory()
  const cpu = readCgroupCpu()
  const isCgroupBound = memory?.limit != null || cpu?.quota != null

  return isCgroupBound ? cgroupSystem(memory, cpu) : hostSystem()
}

export const liveness = (): Liveness => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  system: getSystem(),
  process: {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  },
})
