import { LoggingWinston, type Options } from '@google-cloud/logging-winston'
import type {
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
} from 'express'
import type { Server, Socket } from 'socket.io'
import wildcard from 'socketio-wildcard'
import {
  type Logger,
  transports as WinstonTransports,
  createLogger,
  format,
} from 'winston'
import type * as Transport from 'winston-transport'

import type { TransformableInfo } from 'logform'

let loggers: Record<string, Logger> = {}

// Clear out loggers (for test purposes)
export const reset = () => {
  loggers = {}
}

// hide logs on test environments or when HIDE_LOGS is set
const isSilent =
  process.env.NODE_ENV === 'test' || process.env.HIDE_LOGS === 'true'

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type LogFunc = (logger: Logger, req: Request, res: Response) => void

export type LogErrorFunc = (
  logger: Logger,
  req: Request,
  res: Response,
  error: Error
) => void

type SensitivityRules = { key: string; pattern: RegExp; replacement: string }[]

export type LogOptions = {
  service: string
  version?: string
  level?: LogLevel
  showLogs?: boolean
  shouldSendToGcp?: boolean
  enableConsole?: boolean
  gcpProjectId?: string
  formattingOptions?: {
    colorize?: boolean
    timestamp?: boolean
    align?: boolean
    stack?: boolean
  }
  defaultMeta?: Record<string, unknown>
  logHttpFunc?: LogFunc
  logHttpErrorFunc?: LogErrorFunc
  maskingSensitivityRules?: SensitivityRules
}
export type LoggerResult = {
  logger: Logger
  requestMiddleware: () => RequestHandler
  errorRequestMiddleware: () => ErrorRequestHandler
  instrumentSocket: (server: Server) => Server
}

// biome-ignore lint/suspicious/noExplicitAny: Because object | strng | unknown is a can of worms
type ExtendedError = Error & { [key: string]: any }

// Implement masking function
export const maskSensitiveData = (
  // biome-ignore lint/suspicious/noExplicitAny: Because object | strng | unknown is a can of worms
  info: any,
  sensitivityRules: SensitivityRules
): object | string | Error | unknown => {
  const tryParseJSON = (str: string): object | null => {
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  if (typeof info === 'string') {
    const parsed = tryParseJSON(info)
    if (parsed) {
      return JSON.stringify(maskSensitiveData(parsed, sensitivityRules))
    }

    // Apply all matching rules
    let result = info
    for (const rule of sensitivityRules) {
      result = result.replace(rule.pattern, rule.replacement)
    }
    return result
  }

  if (Array.isArray(info)) {
    return info.map((item) => maskSensitiveData(item, sensitivityRules))
  }

  if (info instanceof Error) {
    const errorCopy: ExtendedError = new Error()

    // Mask the message
    errorCopy.message = sensitivityRules.reduce((msg, rule) => {
      return rule.pattern.test(msg)
        ? msg.replace(rule.pattern, rule.replacement)
        : msg
    }, info.message)

    // Mask the stack (if it exists)
    if (info.stack) {
      errorCopy.stack = sensitivityRules.reduce((stack, rule) => {
        return rule.pattern.test(stack)
          ? stack.replace(rule.pattern, rule.replacement)
          : stack
      }, info.stack)
    }

    // Copy any other enumerable properties (if any)
    for (const key in info) {
      if (Object.hasOwn(info, key)) {
        const value = (info as ExtendedError)[key]
        if (typeof value === 'string') {
          errorCopy[key] = sensitivityRules.reduce((val, rule) => {
            return rule.pattern.test(val)
              ? val.replace(rule.pattern, rule.replacement)
              : val
          }, value)
        } else {
          errorCopy[key] = maskSensitiveData(value, sensitivityRules)
        }
      }
    }

    return errorCopy
  }

  if (typeof info === 'object' && info !== null) {
    // Recursively mask sensitive data in objects
    for (const key in info) {
      if (Object.hasOwn(info, key)) {
        if (typeof info[key] === 'string') {
          for (const rule of sensitivityRules) {
            if (key === rule.key || rule.pattern.test(info[key])) {
              info[key] = info[key].replace(rule.pattern, rule.replacement)
            }
          }
        } else if (typeof info[key] === 'object') {
          info[key] = maskSensitiveData(info[key], sensitivityRules)
        }
      }
    }
  }

  return info
}

const maskedMessageFormat = (sensitivityRules: SensitivityRules) =>
  format((info) => {
    const { level, message, timestamp } = info

    console.log('\n ====> WHAT IS INFO', info)
    // if (info.stack) {
    // }
    let maskedMessage: object | string | unknown
    try {
      // if (info.stack) {
      //   maskSensitiveData(info.stack, sensitivityRules)
      // }
      maskedMessage = maskSensitiveData(message, sensitivityRules)
    } catch (e) {
      maskedMessage = message
    }

    if (info.stack) {
    }

    return {
      message: 'foo bar',
      timestamp,
      level: 'warn',
    }
    // return JSON.stringify(info)

    // return JSON.stringify({
    //   message: maskSensitiveData(message, sensitivityRules),
    //   level: 'info',
    //   stack: info.stack
    //     ? maskSensitiveData(info.stack, sensitivityRules)
    //     : undefined,
    //   error: info.error
    //     ? maskSensitiveData(info.error, sensitivityRules)
    //     : undefined,
    //   timestamp,
    // })
    // return `[${timestamp}] ${level}: ${JSON.stringify(maskedMessage)}`

    // return 'HERP DERP'
  })

const unmaskedMessageFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${JSON.stringify(message)}`
})

export const getLogger = ({
  service,
  version,
  level = 'info',
  showLogs = false, // force show logs on test environments
  shouldSendToGcp = false,
  enableConsole = true,
  gcpProjectId,
  formattingOptions = {},
  defaultMeta = {},
  logHttpFunc = logHttp,
  logHttpErrorFunc = logHttpError,
  maskingSensitivityRules = [],
}: LogOptions): LoggerResult => {
  try {
    if (process.env.LOG_LEVEL) {
      level = process.env.LOG_LEVEL as LogLevel
    }
  } catch (error) {
    console.error(
      `Logger[${service}]: Unable to set level (LOG_LEVEL=${process.env.LOG_LEVEL})`,
      error
    )
  }

  const defaultFormattingOptions = {
    colorize: true,
    timestamp: true,
    align: true,
    stack: true,
  }

  const consoleFormattingOptions = {
    ...defaultFormattingOptions,
    ...formattingOptions,
  }

  const GoogleCloudLoggingFormatter = (sensitivityRules: SensitivityRules) =>
    format((info, opts = {}) => {
      return maskSensitiveData(info, sensitivityRules) as TransformableInfo
    })

  if (!loggers[service]) {
    const winstonFormat = format.combine(
      consoleFormattingOptions.timestamp ? format.timestamp() : format.simple(),
      GoogleCloudLoggingFormatter(maskingSensitivityRules)(),
      // maskedMessageFormat(maskingSensitivityRules)(),
      format.json()

      // format.errors({ stack: consoleFormattingOptions.stack }),
      // maskingSensitivityRules.length // Enable masking if rules are passsed
      //   ? maskedMessageFormat(maskingSensitivityRules)
      //   : unmaskedMessageFormat,
    )

    const loggingWinstonSettings: Options = {
      level,
      serviceContext: { service, version },
      resource: {
        labels: {
          container_name: 'herpderp',
        },
        type: 'k8s_container',
      },
      format: winstonFormat,
      redirectToStdout: false,
    }

    if (gcpProjectId) {
      loggingWinstonSettings.projectId = gcpProjectId
    }

    const transports: Transport[] = []

    if (enableConsole) {
      transports.push(new WinstonTransports.Console({ level }))
    }
    if (shouldSendToGcp) {
      const loggerTransport = new LoggingWinston(loggingWinstonSettings)

      transports.push(loggerTransport)
    }

    const silent = showLogs ? false : isSilent
    loggers[service] = createLogger({
      level,
      transports,
      silent,
      defaultMeta,
      // format: winstonFormat,
    })
  }
  return {
    logger: loggers[service],
    requestMiddleware: () =>
      makeRequestMiddleware(loggers[service], logHttpFunc),
    errorRequestMiddleware: () =>
      makeRequestErrorMiddleware(loggers[service], logHttpErrorFunc),
    instrumentSocket: makeSocketInstrumentation(loggers[service]),
  }
}

const makeRequestMiddleware =
  (logger: Logger, logFunc: LogFunc): RequestHandler =>
  async (req, res, next) => {
    logFunc(logger, req, res)
    next()
  }

const makeRequestErrorMiddleware =
  (logger: Logger, logFunc: LogErrorFunc): ErrorRequestHandler =>
  (error, req, res, next) => {
    logFunc(logger, req, res, error)
    next(error)
  }

const logHttp = (
  logger: Logger,
  { method, url, query }: Request,
  _res: Response
) => {
  if (!url.includes('health')) {
    logger.info(`${method} ${url}`, { url, method, query })
  }
}

const logHttpError = (
  logger: Logger,
  { method, url, query }: Request,
  _res: Response,
  error: Error
) => {
  logger.error(error.message, { url, method, query, stack: error })
}

const makeSocketInstrumentation = (logger: Logger) => (server: Server) => {
  server.use(wildcard())
  server.on('connection', (socket: Socket) => {
    logger.info('Socket connected', { id: socket.id })

    const emit = socket.emit
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ;(socket as any).emit = (eventName: string, ...eventData: unknown[]) => {
      socket.emit = emit
      socket.emit(eventName, ...eventData)

      logger.info('Socket emit', { id: socket.id, eventName, eventData })
    }

    socket.on('*', (packet) => {
      const [eventName, ...eventData] = packet.data
      logger.info('Socket event', { id: socket.id, eventName, eventData })
    })

    socket.on('reconnect', () => {
      logger.error('Socket reconnect', { id: socket.id })
    })

    socket.on('connect_error', (error) => {
      logger.error(`Socket connect error '${error.message}'`, {
        id: socket.id,
        ...error,
      })
    })

    socket.on('connect_timeout', (error) => {
      logger.warn(`Socket connect timeout '${error.message}'`, {
        id: socket.id,
        ...error,
      })
    })

    socket.on('reconnect_error', (error) => {
      logger.error(`Socket reconnect error '${error.message}'`, {
        id: socket.id,
        ...error,
      })
    })

    socket.on('error', (error) => {
      logger.error(`Socket error '${error.message}'`, {
        id: socket.id,
        ...error,
      })
    })

    socket.on('disconnect', (reason, description) => {
      logger.info('Socket disconnected', { id: socket.id, reason, description })
    })
  })

  return server
}
