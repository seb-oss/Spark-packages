import { initialize } from './otel'

export * from './logger'
export * from './metrics'
export * from './tracer'

// Auto initialize
initialize()
