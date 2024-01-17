import {
  APIResponse,
  APIServerDefinition,
  APIServerOptions,
  HttpError,
  Verb,
  createHttpError,
} from '@sebspark/openapi-core'
import {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
  Router,
  json,
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
          const { headers, data } = response as APIResponse<
            unknown,
            Record<string, string>
          >

          res.status(status)
          if (headers) {
            for (const [name, value] of Object.entries(headers)) {
              res.setHeader(name, value)
            }
          }
          if (data) res.send(data)
          else res.end()
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

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let error: HttpError

  if (err.message && err.statusCode && err.toJSON) {
    error = err
  } else {
    const internal =
      err instanceof Error
        ? err
        : typeof err === 'string'
          ? new Error(err)
          : undefined
    error = createHttpError(500, undefined, internal)
  }

  res.status(error.statusCode).send(error.toJSON())
}
