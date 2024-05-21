import { LoggingWinston } from '@google-cloud/logging-winston'
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
import { getCorrId } from './correlationid'

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

export type LogOptions = {
  service: string
  version?: string
  level?: LogLevel
  showLogs?: boolean
  shouldSendToGcp?: boolean
  gcpProjectId?: string
  formattingOptions?: {
    colorize?: boolean
    timestamp?: boolean
    align?: boolean
    corrId?: boolean
    stack?: boolean
    logStatusCodes?: boolean
  }
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
  gcpProjectId,
  formattingOptions = {},
}: LogOptions): LoggerResult => {
  const defaultFormattingOptions = {
    colorize: true,
    timestamp: true,
    corrId: false,
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
        let output = `[${info.timestamp}]`
        if (consoleFormattingOptions.corrId) {
          const corrId = getCorrId()
          if (corrId) {
            output += ` [${corrId}]`
          }          
        }
        output += ` ${info.level}: ${info.message}`
        return output
      }),
      consoleFormattingOptions.stack
        ? format.errors({ stack: true })
        : format.simple()
    )

    const loggingWinstonSettings: any = {
      level,
      serviceContext: {
        service,
        version,
      },
    }

    if (gcpProjectId) {
      loggingWinstonSettings.projectId = gcpProjectId
    }

    const transports: Transport[] = shouldSendToGcp
      ? [
          new WinstonTransports.Console({
            format: winstonConsoleFormat,
          }),
          new LoggingWinston(loggingWinstonSettings),
        ]
      : [
          new WinstonTransports.Console({
            format: winstonConsoleFormat,
          }),
        ]

    const silent = showLogs ? false : isSilent
    loggers[service] = createLogger({
      level,
      transports,
      silent,
    })
  }
  return {
    logger: loggers[service],
    requestMiddleware: () => makeRequestMiddleware(loggers[service]),
    errorRequestMiddleware: () => makeRequestErrorMiddleware(loggers[service]),
    instrumentSocket: makeSocketInstrumentation(loggers[service]),
  }
}

const makeRequestMiddleware =
  (logger: Logger): RequestHandler =>
  async (req, res, next) => {
    logHttp(logger, req, res)
    next()
  }

const makeRequestErrorMiddleware =
  (logger: Logger): ErrorRequestHandler =>
  (error, req, res, next) => {
    logHttpError(logger, req, res, error)
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
