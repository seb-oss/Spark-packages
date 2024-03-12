import { ArrayFormat } from '@sebspark/openapi-core'

const encodeParam = (param: string) => encodeURIComponent(param)
const encodeValue = (param: string, encodeCommas = false) => {
  if (encodeCommas) {
    return encodeURIComponent(param)
  }
  return param
    .split(',')
    .map((p) => encodeURIComponent(p))
    .join(',')
}

export const paramsSerializer =
  (format?: ArrayFormat | undefined) =>
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (params?: Record<string, any>): string => {
    if (!params) {
      return ''
    }
    return Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          if (format === 'comma') {
            return `${encodeParam(key)}=${value
              .map((v) => encodeValue(v, true))
              .join(',')}`
          }

          return value.map((arrayValue, ix) => {
            switch (format) {
              case 'indices': {
                return `${encodeParam(key)}[${ix}]=${encodeValue(arrayValue)}`
              }
              case 'repeat': {
                return `${encodeParam(key)}=${encodeValue(arrayValue)}`
              }
              default: {
                // 'brackets'
                return `${encodeParam(key)}[]=${encodeValue(arrayValue)}`
              }
            }
          })
        }
        return `${encodeParam(key)}=${encodeValue(value)}`
      })
      .join('&')
  }
