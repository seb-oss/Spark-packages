import {
  Request,
  Response,
  Router,
  NextFunction,
  ErrorRequestHandler,
  json,
} from 'express'
import {
  APIServerDefinition,
  APIServerOptions,
  HttpError,
  Verb,
  createHttpError,
} from '@sebspark/openapi-core'

export const TypedRouter = (
  api: APIServerDefinition,
  options: APIServerOptions = {},
) => {
  const router = Router()
  router.use(json())
  const preUsings =
    options.pre instanceof Array
      ? options.pre
      : options.pre
        ? [options.pre]
        : []
  preUsings.forEach((pre) => router.use(pre))
  Object.entries(api).forEach(([url, methods]) => {
    Object.entries(methods).forEach(([method, route]) => {
      const handler = async (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        try {
          const [code, body] = await route.handler(req)
          res.status(code).send(body)
        } catch (error) {
          next(error)
        }
      }
      const pre =
        route.pre instanceof Array ? route.pre : route.pre ? [route.pre] : []
      const handlers = pre.concat(handler)
      router[method as Verb](url, ...handlers)
    })
  })
  router.use(errorHandler)
  return router
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let error: HttpError
  if (err.message && err.statusCode && err.toJSON) error = err
  else {
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
