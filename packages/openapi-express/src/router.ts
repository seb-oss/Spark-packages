import {
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

  const preUsings = Array.isArray(options.pre)
    ? options.pre
    : options.pre
    ? [options.pre]
    : []

  for (const pre of preUsings) {
    router.use(pre)
  }

  for (const [url, methods] of Object.entries(api)) {
    for (const [method, route] of Object.entries(methods)) {
      const handler = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const [code, body] = await route.handler(req)
          res.status(code).send(body)
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
