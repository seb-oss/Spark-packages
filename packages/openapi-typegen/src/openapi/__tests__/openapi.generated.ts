/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIServerDefinition,
  BaseClient,
  GenericRouteHandler,
} from '@sebspark/openapi-core'
import type { Request } from 'express'

type Req = Pick<Request, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

export type Card = {
  id: string
  ownerId: string
  'name-on-card': string
  'settings/foo'?: CardSettings
}

export type CardSettings = {
  cardId: string
  frozen: { value: boolean; editableByChild: boolean }
}

export type CardList = { cards: Card[] }

/**
 * A documented type
 */
export type Documented = {
  /**
   * The id of the documented type
   */
  id: string
  /**
   * Settings
   */
  settings?: CardSettings
}

export type HttpError = { message: string; stack?: string }

export type CardsAPIServer = APIServerDefinition & {
  '/': {
    get: {
      handler: (
        args?: Req & { query?: { page?: number; limit?: number } },
      ) => Promise<[200, CardList]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/:cardId': {
    get: {
      handler: (
        args: Req & {
          params: { cardId: string }
          query: { cardNickname: boolean }
          headers: { 'X-User-Id': string; 'X-Distributor-Id'?: string }
        }
      ) => Promise<[200, Card]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    delete: {
      handler: (
        args: Req & {
          params: { cardId: string }
          query: { cardNickname: boolean }
        }
      ) => Promise<[200, Card]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/:cardId/settings': {
    put: {
      handler: (
        args: Req & {
          params: { cardId: string }
          headers: { 'x-forwarded-authorization': string }
          body: CardSettings
        }
      ) => Promise<[204, void]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

type CardsAPIClientGet = {
  (
    url: '/',
    args?: { query?: { page?: number; limit?: number } },
  ): Promise<CardList>

  (
    url: '/:cardId',
    args: {
      params: { cardId: string }
      query: { cardNickname: boolean }
      headers: { 'X-User-Id': string; 'X-Distributor-Id'?: string }
    }
  ): Promise<Card>
}

type CardsAPIClientDelete = {
  (
    url: '/:cardId',
    args: { params: { cardId: string }; query: { cardNickname: boolean } },
  ): Promise<Card>
}

type CardsAPIClientPut = {
  (
    url: '/:cardId/settings',
    args: {
      params: { cardId: string }
      headers: { 'x-forwarded-authorization': string }
      body: CardSettings
    },
  ): Promise<void>
}

export type CardsAPIClient = Pick<BaseClient, 'get' | 'delete' | 'put'> & {
  get: CardsAPIClientGet
  delete: CardsAPIClientDelete
  put: CardsAPIClientPut
}
