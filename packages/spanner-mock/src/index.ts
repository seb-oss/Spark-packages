import { jest } from '@jest/globals'
import { date, float, float32, int, timestamp } from './datatypes'
import { createSpanner } from './spanner'

// biome-ignore lint/suspicious/noExplicitAny:
const MockSpanner = jest.fn(createSpanner) as any

MockSpanner.float = float
MockSpanner.float32 = float32
MockSpanner.date = date
MockSpanner.int = int
MockSpanner.timestamp = timestamp

export const Spanner = MockSpanner
