export const LOG_SEVERITY_MAP = {
  TRACE: 1,
  DEBUG: 5,
  INFO: 9,
  NOTICE: 10,
  WARNING: 13,
  WARN: 13,
  ERROR: 17,
  FATAL: 21,
  CRITICAL: 21,
  ALERT: 22,
  EMERGENCY: 23,
} as const

export type LOG_SEVERITY_NAME = keyof typeof LOG_SEVERITY_MAP

const isLogSeverityName = (level: string): level is LOG_SEVERITY_NAME =>
  Object.hasOwn(LOG_SEVERITY_MAP, level)

/** Severity threshold from `LOG_LEVEL`, falling back to INFO. */
export const logThresholdFromEnv = (): number => {
  const level = process.env.LOG_LEVEL?.toUpperCase() ?? 'INFO'
  return LOG_SEVERITY_MAP[isLogSeverityName(level) ? level : 'INFO']
}
