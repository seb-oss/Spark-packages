import express from 'express'
import { type Agent, agent } from 'supertest'
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import * as Winston from 'winston'
import { getLogger, reset } from './logger'

vi.mock('winston', async () => {
  const originalWinston = await vi.importActual<typeof Winston>('winston') // Import the actual module

  // Create a mock function for log
  const mockConsole = new originalWinston.transports.Console()
  mockConsole.log = vi.fn().mockImplementation((info, cb) => cb())

  // Return the mocked module
  return {
    ...originalWinston,
    transports: {
      ...originalWinston.transports,
      Console: () => mockConsole,
    },
  }
})

describe('logging', () => {
  let log: Mock
  beforeEach(() => {
    reset()
    const mockConsole = new Winston.transports.Console()
    log = mockConsole.log as Mock
  })
  afterEach(() => {
    log.mockClear()
  })

  describe('logger', () => {
    it('logs info to console', async () => {
      const { logger } = getLogger({ service: 'test', showLogs: true })
      logger.info('hello')

      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'hello',
      })
    })
    it('logs error to console', async () => {
      const { logger } = getLogger({ service: 'test', showLogs: true })
      logger.error('hello')

      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'error',
        message: 'hello',
      })
    })
  })

  describe('express middlewares', () => {
    let server: Agent
    beforeEach(() => {
      const { requestMiddleware, errorRequestMiddleware } = getLogger({
        service: 'test',
        showLogs: true,
      })
      const app = express()
      app.use(requestMiddleware())
      app.get('/', (_req, res) => {
        res.send({ hello: 'world' })
      })
      app.get('/error', (_req, _res, next) => {
        next(new Error('error'))
      })
      app.get('/gone', (_req, res, next) => {
        res.status(410).send({ message: 'Gone' })
        next(new Error('gone'))
      })
      app.get('/unhandled', (_req, _res, next) => {
        throw new Error('unhandled')
      })
      app.use(errorRequestMiddleware())

      server = agent(app)
    })
    it('logs all requests', async () => {
      await server.get('/')
      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'GET /',
      })
    })
    it('logs all errors', async () => {
      await server.get('/error')
      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'GET /error',
      })
      expect(log.mock.calls[1][0]).toMatchObject({
        level: 'error',
        message: 'error',
      })
    })
    it('logs all handled errors', async () => {
      await server.get('/gone')
      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'GET /gone',
      })
      expect(log.mock.calls[1][0]).toMatchObject({
        level: 'error',
        message: 'gone',
      })
    })
    it('logs all unhandled errors', async () => {
      await server.get('/unhandled')
      expect(log).toHaveBeenCalled()
      expect(log.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'GET /unhandled',
      })
      expect(log.mock.calls[1][0]).toMatchObject({
        level: 'error',
        message: 'unhandled',
      })
    })
  })
})
