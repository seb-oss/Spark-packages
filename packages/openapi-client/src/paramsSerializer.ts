import type { ArrayFormat } from '@sebspark/openapi-core'

type Param = boolean | string | number | Date | undefined | Array<Param>
type Params = Record<string, Param>

const encodeParam = (param: string) => encodeURIComponent(param)
const encodeValue = (param: Param, encodeCommas = false) => {
  if (param instanceof Date) {
    return encodeURIComponent(param.toISOString())
  }
  if (
    typeof param === 'number' ||
    typeof param === 'string' ||
    typeof param === 'boolean'
  ) {
    if (encodeCommas) {
      return encodeURIComponent(param)
    }

    return param
      .toString()
      .split(',')
      .map((p) => encodeURIComponent(p))
      .join(',')
  }

  return ''
}

export const paramsSerializer = (format?: ArrayFormat) => (params?: Params) => {
  if (!params) {
    return ''
  }

  const s = []

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      const title = encodeParam(key)

      if (format === 'comma') {
        s.push(`${title}=${value.map((v) => encodeValue(v, true)).join(',')}`)
        continue
      }

      value.forEach((v, ix) => {
        const value = encodeValue(v)

        switch (format) {
          case 'indices': {
            s.push(`${title}[${ix}]=${value}`)
            break
          }
          case 'repeat': {
            s.push(`${title}=${value}`)
            break
          }
          default: {
            s.push(`${title}[]=${value}`)
            break
          }
        }
      })
    } else {
      s.push(`${encodeParam(key)}=${encodeValue(value)}`)
    }
  }

  return s.join('&')
}
