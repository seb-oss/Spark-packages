import { APIResponse, BaseClient, RequestOptions } from '@sebspark/openapi-core'
import { Router, json } from 'express'

export type User = {
  id: string
  name: string
  age: number
}

type ClientGet = {
  (url: '/users', opts?: RequestOptions): Promise<APIResponse<User[]>>
  (
    url: '/users/:id',
    args: { params: { id: string } },
    opts?: RequestOptions
  ): Promise<APIResponse<User>>
}
type ClientPost = {
  (
    url: '/users',
    args: { body: User },
    opts?: RequestOptions
  ): Promise<APIResponse<User>>
}
type ClientPut = {
  (
    url: '/users/:id',
    args: { params: { id: string }; body: User },
    opts?: RequestOptions
  ): Promise<APIResponse<User>>
}
type ClientPatch = {
  (
    url: '/users/:id',
    args: { params: { id: string }; body: Partial<User> },
    opts?: RequestOptions
  ): Promise<APIResponse<User>>
}
type ClientDelete = {
  (
    url: '/users/:id',
    args: { params: { id: string } },
    opts?: RequestOptions
  ): Promise<APIResponse<undefined>>
}
export type Client = BaseClient & {
  get: ClientGet
  post: ClientPost
  put: ClientPut
  patch: ClientPatch
  delete: ClientDelete
}

const users = new Map<string, User>()

const router = Router()
router.use(json())
router.get('/users', (_req, res) => {
  res.status(200).send(Array.from(users.values()))
})
router.get('/users/:id', (req, res) => {
  const user = users.get(req.params.id)

  if (user) {
    res.status(200).send(user)
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.post('/users', (req, res) => {
  users.set(req.body.id, req.body)
  res.status(201).send(req.body)
})
router.put('/users/:id', (req, res) => {
  const user = users.get(req.params.id)

  if (user) {
    users.set(req.params.id, req.body)
    res.status(200).send(req.body)
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.patch('/users/:id', (req, res) => {
  const user = users.get(req.params.id)

  if (user) {
    const updated = { ...user, ...req.body }
    users.set(req.params.id, updated)
    res.status(200).send(updated)
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
router.delete('/users/:id', (req, res) => {
  const user = users.get(req.params.id)

  if (user) {
    users.delete(req.params.id)
    res.status(204).end()
  } else {
    res.status(404).send({ message: 'Not found' })
  }
})
export { router }
