import {
  type APIResponse,
  type APIServerDefinition,
  type APIServerOptions,
  createHttpError,
  type HttpError,
  type Verb,
} from '@sebspark/openapi-core'
import {
  type ErrorRequestHandler,
  json,
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express'

export const TypedRouter = (
  api: APIServerDefinition,
  options: APIServerOptions = {}
) => {
  const router = Router()

  router.use(json())

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
        try {
          const [status, response] = await route.handler(req)
          res.status(status)

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
        } catch (error) {
          next(error)
        }
      }

      const pre = Array.isArray(route.pre)
        ? route.pre
        : route.pre
          ? [route.pre]
          : []
      const handlers = pre.concat(handler)

      router[method as Verb](url, ...handlers)
    }
  }

  router.use(errorHandler)

  return router
}

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  let error: HttpError = err

  if (!error.message || !error.statusCode) {
    const internal =
      err instanceof Error
        ? err
        : typeof err === 'string'
          ? new Error(err)
          : new Error(JSON.stringify(err || ''))
    error = createHttpError(500, undefined, internal)
  }

  const showStack = process.env.NODE_ENV !== 'production'
  res.status(error.statusCode).send(error.toJSON(showStack))
  next(error)
}
