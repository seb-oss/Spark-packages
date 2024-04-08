import { LoggingWinston } from '@google-cloud/logging-winston'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { Server, Socket } from 'socket.io'
import wildcard from 'socketio-wildcard'
import {
  type Logger,
  transports as WinstonTransports,
  createLogger,
} from 'winston'
import type * as Transport from 'winston-transport'

const loggers: Record<string, Logger> = {}

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
}: LogOptions): LoggerResult => {
  if (!loggers[service]) {
    const transports: Transport[] =
      process.env.ENVIRONMENT === 'gcp'
        ? [
            new WinstonTransports.Console(),
            new LoggingWinston({
              level,
              serviceContext: {
                service,
                version,
              },
            }),
          ]
        : [new WinstonTransports.Console()]
    loggers[service] = createLogger({
      level,
      transports,
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
  (req, res, next) => {
    const end = res.end
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ;(res as any).end = (...args: any[]) => {
      res.end = end
      res.end(...args)

      const { url, method, query } = req
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const { responseTime } = res as any

      logger.info(`${method} ${url}`, {
        url,
        method,
        query,
        responseTime,
      })
    }
    next()
  }

const makeRequestErrorMiddleware =
  (logger: Logger): ErrorRequestHandler =>
  (error, req, res, next) => {
    const end = res.end
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ;(res as any).end = (...args: any[]) => {
      res.end = end
      res.end(...args)

      const { url, method, query } = req
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const { responseTime } = res as any

      logger.error(error.message, {
        url,
        method,
        query,
        responseTime,
        stack: error,
      })
    }
    next(error)
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
