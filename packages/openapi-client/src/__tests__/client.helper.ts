import { json, Router } from 'express'
import type { NextFunction, RequestHandler } from 'express-serve-static-core'
import type { HttpError, User, UserList } from './openapi.js'

export const accessToken = 'Bearer access token'

const authorize: RequestHandler = (req, res, next) => {
  const { authorization } = req.headers
  if (!authorization) {
    res.status(401).send({ message: 'Unauthorized' } as HttpError)
    return
  }
  if (authorization !== accessToken) {
    res.status(403).send({ message: 'Forbidden' } as HttpError)
    return
  }
  next?.()
}

const users = new Map<string, User>()

const router = Router()
router.use(json() as NextFunction)
router.get('/users', authorize, (req, res) => {
  res.status(200).send(Array.from(users.values()) as UserList)
})
router.get('/users/:userId', authorize, (req, res) => {
  const user = users.get(req.params.userId)

  if (user) {
    res.status(200).send(user as User)
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.post('/users', authorize, (req, res) => {
  const user = req.body as User
  users.set(user.id, user)
  res.status(201).send(user as User)
})
router.put('/users/:userId', authorize, (req, res) => {
  const oldUser = users.get(req.params.userId)
  const newUser = req.body

  if (oldUser) {
    users.set(req.params.userId, newUser)
    res.status(200).send(newUser as User)
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.delete('/users/:userId', authorize, (req, res) => {
  const user = users.get(req.params.userId)

  if (user) {
    users.delete(req.params.userId)
    res.status(204).end()
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.get('/undocumented-security', authorize, (_req, res) => {
  res.status(204).end()
})
router.get('/undocumented-security/:id', authorize, (_req, res) => {
  res.status(204).end()
})

router.get('/search', (req, res) => {
  const received = req.query.type
  res.json({ received })
})

export { router }
