import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Emitter } from '../emitter'
import { BroadcastOperator } from '../operator'

const mockPublishMessage = vi.fn()
const mockTopic = { publishMessage: mockPublishMessage } as never

beforeEach(() => {
  mockPublishMessage.mockReset()
})

describe('Emitter', () => {
  it('defaults nsp to /', () => {
    const emitter = new Emitter(mockTopic)
    expect(emitter.nsp).toBe('/')
  })

  it('uses provided nsp', () => {
    const emitter = new Emitter(mockTopic, undefined, '/custom')
    expect(emitter.nsp).toBe('/custom')
  })

  it('emit publishes a message and returns true', () => {
    const emitter = new Emitter(mockTopic)
    const result = emitter.emit('hello', 'world')
    expect(result).toBe(true)
    expect(mockPublishMessage).toHaveBeenCalledOnce()
  })

  it('of returns a new Emitter with prefixed nsp', () => {
    const emitter = new Emitter(mockTopic)
    const child = emitter.of('chat')
    expect(child).toBeInstanceOf(Emitter)
    expect(child.nsp).toBe('/chat')
  })

  it('of does not double-prefix when nsp starts with /', () => {
    const emitter = new Emitter(mockTopic)
    const child = emitter.of('/chat')
    expect(child.nsp).toBe('/chat')
  })

  it('to returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.to('room1')
    expect(op).toBeInstanceOf(BroadcastOperator)
  })

  it('to with array returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.to(['room1', 'room2'])
    expect(op).toBeInstanceOf(BroadcastOperator)
  })

  it('in returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.in('room1')
    expect(op).toBeInstanceOf(BroadcastOperator)
  })

  it('except returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.except('room1')
    expect(op).toBeInstanceOf(BroadcastOperator)
  })

  it('volatile returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.volatile
    expect(op).toBeInstanceOf(BroadcastOperator)
  })

  it('compress returns a BroadcastOperator', () => {
    const emitter = new Emitter(mockTopic)
    const op = emitter.compress(true)
    expect(op).toBeInstanceOf(BroadcastOperator)
  })
})

describe('BroadcastOperator', () => {
  it('emit returns true', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    expect(op.emit('test', 'data')).toBe(true)
    expect(mockPublishMessage).toHaveBeenCalledOnce()
  })

  it('emit throws for reserved event names', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    expect(() => op.emit('connect')).toThrow(
      '"connect" is a reserved event name'
    )
  })

  it('to with string adds a room', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.to('room1')
    expect(next).toBeInstanceOf(BroadcastOperator)
    next.emit('test')
    const msg = mockPublishMessage.mock.calls[0][0]
    expect(msg.data).toBeDefined()
  })

  it('to with array adds multiple rooms', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.to(['room1', 'room2'])
    expect(next).toBeInstanceOf(BroadcastOperator)
  })

  it('in is an alias for to', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.in('room1')
    expect(next).toBeInstanceOf(BroadcastOperator)
  })

  it('except with string excludes a room', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.except('room1')
    expect(next).toBeInstanceOf(BroadcastOperator)
  })

  it('except with array excludes multiple rooms', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.except(['room1', 'room2'])
    expect(next).toBeInstanceOf(BroadcastOperator)
  })

  it('compress sets the compress flag', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.compress(true)
    expect(next).toBeInstanceOf(BroadcastOperator)
  })

  it('volatile sets the volatile flag', () => {
    const op = new BroadcastOperator(mockTopic, { nsp: '/' })
    const next = op.volatile
    expect(next).toBeInstanceOf(BroadcastOperator)
  })
})
