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
}
export type LoggerResult = {
  logger: Logger
  requestMiddleware: () => RequestHandler
  errorRequestMiddleware: () => ErrorRequestHandler
  instrumentSocket: (server: Server) => Server
}

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

  if (!loggers[service]) {
    const winstonConsoleFormat = format.combine(
      consoleFormattingOptions.colorize
        ? format.colorize({ all: true })
        : format.uncolorize(),
      consoleFormattingOptions.timestamp ? format.timestamp() : format.simple(),
      consoleFormattingOptions.align ? format.align() : format.simple(),
      format.printf((info) => {
        return `[${info.timestamp}] ${info.level}: ${info.message}`
      }),
      format.errors({ stack: consoleFormattingOptions.stack })
    )

    const loggingWinstonSettings: Options = {
      level,
      serviceContext: {
        service,
        version,
      },
    }

    if (gcpProjectId) {
      loggingWinstonSettings.projectId = gcpProjectId
    }

    const transports: Transport[] = []

    if (enableConsole) {
      transports.push(
        new WinstonTransports.Console({
          format: winstonConsoleFormat,
          level,
        })
      )
    }
    if (shouldSendToGcp) {
      transports.push(new LoggingWinston(loggingWinstonSettings))
    }

    const silent = showLogs ? false : isSilent
    loggers[service] = createLogger({
      level,
      transports,
      silent,
      defaultMeta,
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
    logger.info(`${method} ${url}`, {
      url,
      method,
      query,
    })
  }
}

const logHttpError = (
  logger: Logger,
  { method, url, query }: Request,
  _res: Response,
  error: Error
) => {
  logger.error(error.message, {
    url,
    method,
    query,
    stack: error,
  })
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
      logger.info('Socket event', {
        id: socket.id,
        eventName,
        eventData,
      })
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
