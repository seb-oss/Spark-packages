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
