import {
  ATTR_CLIENT_ADDRESS,
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_HTTP_ROUTE,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
  ATTR_USER_AGENT_ORIGINAL,
  METRIC_HTTP_SERVER_REQUEST_DURATION,
} from '@opentelemetry/semantic-conventions'
import {
  type APIResponse,
  type APIServerDefinition,
  type APIServerOptions,
  createHttpError,
  type HttpError,
  type Verb,
} from '@sebspark/openapi-core'
import { getLogger, getTracer, SpanStatusCode } from '@sebspark/otel'
import {
  type ErrorRequestHandler,
  json,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  Router,
} from 'express'
import pkg from '../package.json' with { type: 'json' }

export const TypedRouter = (
  api: APIServerDefinition,
  options: APIServerOptions = {}
): Router => {
  const logger = getLogger(pkg.name)
  const tracer = getTracer(pkg.name)
  const router = Router()

  router.use(json() as unknown as RequestHandler)

  // Add global pre to router
  const preUsings = Array.isArray(options.pre)
    ? options.pre
    : options.pre
      ? [options.pre]
      : []
  for (const pre of preUsings) {
    router.use(pre)
  }

  // loop through urls on server definition
  for (const [url, methods] of Object.entries(api)) {
    // loop through methods on url
    for (const [method, route] of Object.entries(methods)) {
      // Build handler for url/method
      const handler = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        const startTime = performance.now()
        const span = tracer.startSpan(`${method.toUpperCase()} ${url}`)
        const query = req.url.split('?')[1]
        const port = req.socket.localPort
        const ip = req.ip
        const userAgent = req.get('user-agent')
        const requestAttributes = {
          [ATTR_HTTP_REQUEST_METHOD]: req.method,
          [ATTR_HTTP_ROUTE]: url,
          [ATTR_URL_PATH]: req.path,
          ...(query && { [ATTR_URL_QUERY]: query }),
          [ATTR_URL_SCHEME]: req.protocol,
          [ATTR_SERVER_ADDRESS]: req.hostname,
          ...(port && { [ATTR_SERVER_PORT]: port }),
          [ATTR_NETWORK_PROTOCOL_VERSION]: req.httpVersion,
          ...(ip && { [ATTR_CLIENT_ADDRESS]: ip }),
          ...(userAgent && { [ATTR_USER_AGENT_ORIGINAL]: userAgent }),
        }
        span.setAttributes(requestAttributes)

        try {
          const [status, response] = await route.handler(req)
          res.status(status)

          span.setAttributes({ [ATTR_HTTP_RESPONSE_STATUS_CODE]: status })
          span.setStatus({ code: SpanStatusCode.OK })

          if (!response) {
            res.end()
            return
          }

          const { headers, data } = response as APIResponse<
            unknown,
            Record<string, string>
          >

          if (headers) {
            for (const [name, value] of Object.entries(headers)) {
              res.setHeader(name, value)
            }
          }

          if (data) {
            res.send(data)
          } else {
            res.end()
          }

          logger.info(`${method.toUpperCase()} ${url} ${status}`, {
            ...requestAttributes,
            [METRIC_HTTP_SERVER_REQUEST_DURATION]:
              (performance.now() - startTime) / 1000,
          })
        } catch (error) {
          const err = (
            error instanceof Error ? error : new Error(String(error))
          ) as HttpError
          span.recordException(err)
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
          span.setAttribute(ATTR_ERROR_TYPE, err.constructor.name)

          if (err.statusCode) {
            span.setAttributes({
              [ATTR_HTTP_RESPONSE_STATUS_CODE]: err.statusCode,
            })
          }

          logger.error(`${method.toUpperCase()} ${url}`, err, {
            ...requestAttributes,
            [METRIC_HTTP_SERVER_REQUEST_DURATION]:
              (performance.now() - startTime) / 1000,
          })

          next(error)
        } finally {
          span.setAttribute(
            METRIC_HTTP_SERVER_REQUEST_DURATION,
            (performance.now() - startTime) / 1000
          )
          span.end()
        }
      }

      const pre = Array.isArray(route.pre)
        ? route.pre
        : route.pre
          ? [route.pre]
          : []
      const handlers = pre.concat(handler as RequestHandler)

      router[method as Verb](url, ...handlers)
    }
  }

  router.use(errorHandler)

  return router
}

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  let error: HttpError = err

  if (!error.message || !error.statusCode) {
    let internal: Error
    if (err instanceof Error) {
      internal = err
    } else {
      /* istanbul ignore else */
      if (typeof err === 'string') {
        internal = new Error(err)
      } else {
        internal = new Error(JSON.stringify(err || ''))
      }
    }
    error = createHttpError(500, undefined, internal)
  }

  const showStack = process.env.NODE_ENV !== 'production'
  res.status(error.statusCode).send(error.toJSON(showStack))
  next(error)
}
