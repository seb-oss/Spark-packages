import { jest } from '@jest/globals'

export const float = jest.fn((value: number): number | null => {
  if (value === null || value === undefined) return null
  const floatValue = Number(value)
  if (Number.isNaN(floatValue)) {
    throw new Error(`Invalid FLOAT64 value: ${value}`)
  }
  return floatValue
})

export const float32 = jest.fn((value: number): number | null => {
  if (value === null || value === undefined) return null
  const float32Value = Number(value)
  if (Number.isNaN(float32Value)) {
    throw new Error(`Invalid FLOAT32 value: ${value}`)
  }
  return float32Value
})

export const date = jest.fn((value: string | Date): string | null => {
  if (value === null || value === undefined) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid DATE value: ${value}`)
  }
  return date.toISOString().split('T')[0]
})

export const int = jest.fn((value: number | string): bigint | null => {
  if (value === null || value === undefined) return null
  try {
    return BigInt(value)
  } catch {
    throw new Error(`Invalid INT64 value: ${value}`)
  }
})

export const timestamp = jest.fn((value: string | Date): string | null => {
  if (value === null || value === undefined) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid TIMESTAMP value: ${value}`)
  }
  return date.toISOString()
})
