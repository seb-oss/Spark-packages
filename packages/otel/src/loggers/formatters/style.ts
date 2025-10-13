import kleur from 'kleur'

export const colors = {
  gray: kleur.gray,
  dim: kleur.dim,
  cyan: kleur.cyan,
  white: kleur.white,
  green: kleur.green,
  yellow: kleur.yellow,
  red: kleur.red,
  magenta: kleur.magenta,
}

export const levelColorMap: Record<string, (s: string) => string> = {
  DEBUG: kleur.magenta,
  INFO: kleur.green,
  WARN: kleur.yellow,
  ERROR: kleur.red,
  FATAL: kleur.red,
}

export const levelIconMap: Record<string, string> = {
  DEBUG: '🐛',
  INFO: 'ℹ️ ',
  WARN: '⚠️ ',
  ERROR: '❌',
  FATAL: '💀',
}

// --- Span status codes (per OpenTelemetry spec) ---
export const statusLabelMap: Record<number, string> = {
  0: 'UNSET',
  1: 'OK',
  2: 'ERROR',
}

export const statusColorMap: Record<number, (s: string) => string> = {
  0: colors.gray, // UNSET
  1: colors.green, // OK
  2: colors.red, // ERROR
}

// --- Span kinds (for visual context: client/server etc.) ---
export const kindLabelMap: Record<number, string> = {
  0: 'INTERNAL',
  1: 'SERVER',
  2: 'CLIENT',
  3: 'PRODUCER',
  4: 'CONSUMER',
}

export const kindColorMap: Record<number, (s: string) => string> = {
  0: colors.white, // INTERNAL
  1: colors.cyan, // SERVER
  2: colors.yellow, // CLIENT
  3: colors.magenta, // PRODUCER
  4: colors.green, // CONSUMER
}
