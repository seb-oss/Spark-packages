import { Verb } from '@sebspark/openapi-core'

export type Response = {
  code: number
  type: string
}

export interface Route {
  url: string
  method: Verb
  requestParams: string
  requestQuery: string
  requestHeaders: string
  requestBody: string
  response: Response
  errorResponses: Response[]
}

export type RoutesDefinition = Partial<Record<Verb, Record<string, string>>>
