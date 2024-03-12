import { ArrayFormat } from '@sebspark/openapi-core'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const paramsSerializer =
  (format?: ArrayFormat | undefined) =>
  (params?: Record<string, any>): string => {
    if (!params) {
      return ''
    }
    return Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          if (format === 'comma') {
            return `${encodeURIComponent(key)}=${value
              .map((v) => encodeURIComponent(v))
              .join(',')}`
          }

          return value.map((arrayValue, ix) => {
            switch (format) {
              case 'indices': {
                return `${encodeURIComponent(key)}[${ix}]=${encodeURIComponent(
                  arrayValue
                )}`
              }
              case 'repeat': {
                return `${encodeURIComponent(key)}=${encodeURIComponent(
                  arrayValue
                )}`
              }
              default: {
                // 'brackets'
                return `${encodeURIComponent(key)}[]=${encodeURIComponent(
                  arrayValue
                )}`
              }
            }
          })
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      })
      .join('&')
  }
