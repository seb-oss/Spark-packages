/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIResponse,
  APIServerDefinition,
  BaseClient,
  ExpressRequest,
  GenericRouteHandler,
  LowerCaseHeaders,
  PartiallySerialized,
  QueryParams,
  RequestOptions,
  Serialized,
} from '@sebspark/openapi-core'

type Req = Pick<ExpressRequest, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type NullableDate = {}

/**
 * Trading instrument details.
 */
export type Instrument = {
  id?: string
  isin: string
  mic: string
  currency: string
}

export const ORDER_SIDE_VALUES = ['B', 'S'] as const
export type OrderSide = (typeof ORDER_SIDE_VALUES)[number]

export type CurrencyRestriction = {
  /**
   * Currency
   */
  currency?: string
  /**
   * Reason to restrictions
   */
  reason?: string
}

export type CurrencyRestrictions = {
  currencies?: CurrencyRestriction[]
}

export type StockMarkets = {
  /**
   * Describes which stock market
   */
  market?: string
  /**
   * Reason to restrictions, either "VPN" or country code
   */
  reason?: string
  restrictions?: string[]
}

export type TradingRestrictions = {
  stockMarkets?: StockMarkets[]
}

/**
 * Fields allowed when replacing an existing order (id provided in path).
 */
export type OrderUpdate = {
  price: number
  quantity: number
  validUntil: string
}

/**
 * Order input parameters.
 */
export type OrderInput = {
  accountId: string
  side: OrderSide
  instrument: Instrument
  orderType: OrderType
  timeInForce: TimeInForce
  /**
   * Limit/stop/indicative price per unit in 'currency' where applicable.
   */
  price: number
  quantity: number
  validUntil?: string
}

/**
 * Ex-ante cost and charges estimate.
 */
export type Estimate = {
  clOrdId?: string
  settledCurrency?: string
  settledFxRate?: number
  commission?: number
  settledPrice?: number
  finalPrice?: number
  custodyAccountTypeCode?: string
  validity?: string
  totalVolumeTraded?: number
}

export const EXECUTION_TYPE_VALUES = [
  'NEW',
  'PARTIAL_FILL',
  'FILL',
  'DONE_FOR_DAY',
  'CANCELED',
  'REPLACED',
  'PENDING_CANCEL',
  'STOPPED',
  'REJECTED',
  'SUSPENDED',
  'PENDING_NEW',
  'CALCULATED',
  'EXPIRED',
  'ACCEPTED_FOR_BIDDING',
  'PENDING_REPLACE',
] as const
export type ExecutionType = (typeof EXECUTION_TYPE_VALUES)[number]

export const ORDER_REPORT_STATUS_VALUES = [
  'NEW',
  'PARTIALLY_FILLED',
  'FILLED',
  'DONE_FOR_DAY',
  'CANCELED',
  'REPLACED',
  'PENDING_CANCEL',
  'STOPPED',
  'REJECTED',
  'SUSPENDED',
  'PENDING_NEW',
  'CALCULATED',
  'EXPIRED',
  'ACCEPTED_FOR_BIDDING',
  'PENDING_REPLACE',
] as const
export type OrderReportStatus = (typeof ORDER_REPORT_STATUS_VALUES)[number]

export const ORDER_STATUS_VALUES = [
  'EX_ANTE_REPLACE_CREATED',
  'EX_ANTE_CREATED',
  'UNSPECIFIED',
  'CANCELED',
  'DONE_FOR_DAY',
  'FILLED',
  'ON_MARKET',
  'PARTIALLY_FILLED',
  'SENDING_CANCEL',
  'SENT_CANCEL',
  'REJECTED',
  'STOPPED',
  'SENDING_TO_MARKET',
  'SENT_TO_MARKET',
  'SUSPENDED',
  'CALCULATED',
  'EXPIRED',
  'ACCEPTED_FOR_BIDDING',
  'SENDING_REPLACE',
  'SENT_REPLACE',
  'REPLACED',
] as const
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number]

export const TIME_IN_FORCE_VALUES = ['DAY', 'GTD'] as const
export type TimeInForce = (typeof TIME_IN_FORCE_VALUES)[number]

export const ORDER_TYPE_VALUES = ['LIMIT'] as const
export type OrderType = (typeof ORDER_TYPE_VALUES)[number]

export type Order = OrderInput & {
  /**
   * Stable identifier for the order chain (rootClOrdId).
   */
  id: string
  status: OrderStatus
  estimate?: Estimate
  executionReport?: OrderExecutionReport
  error?: OrderError
  sentToMarketAt?: string
  estimateCreatedAt?: string
  /**
   * The settled currency of the order, not the instrument currency.
   */
  currency?: string
  /**
   * When the order reached a terminal state (FILLED/CANCELED/REJECTED/EXPIRED).
   */
  completedAt?: string
  updatedAt: string
  createdAt: string
}

export type OrderEntityLinks = {
  self: string
  history?: string
}

export type OrderEntity = {
  data: Order
  links: OrderEntityLinks
}

/**
 * Response payload for user trading capabilities and restrictions.
 */
export type SessionRestrictionResponse = {
  currencyRestrictions?: CurrencyRestrictions
  /**
   * Inferred country code for the session based on IP address.
   */
  sessionLocation?: string
  tradingRestrictions?: TradingRestrictions
}

/**
 * List envelope for order chains with paging, sorting, and filter echo (including defaults).
 */
export type OrderListEnvelope = {
  data: OrderEntity[]
}

export const ORDER_SORT_FIELD_VALUES = [
  'UPDATED_AT',
  'SUBMITTED_AT',
  'STATUS',
  'SIDE',
  'MIC',
  'ISIN',
] as const
export type OrderSortField = (typeof ORDER_SORT_FIELD_VALUES)[number]

/**
 * Echo of applied filters (with defaults) for an order list request.
 */
export type OrderFilters = {
  /**
   * If omitted or empty => no account filter.
   */
  accountIds?: string[]
  /**
   * If omitted => both sides (no filter).
   */
  side?: 'BUY' | 'SELL'
  /**
   * If omitted or empty => no MIC filter.
   */
  mics?: string[]
  /**
   * If omitted or empty => no status filter.
   */
  statuses?: string[]
  /**
   * If omitted or empty => no ISIN filter.
   */
  isins?: string[]
  /**
   * Server default: now-7d when not provided by client. ALWAYS present in response.
   */
  fromDate: string
  /**
   * Optional upper bound. If omitted, server may treat as 'now' at request time; may be omitted in response as well.
   */
  toDate?: string
}

export const ORDER_HISTORY_KIND_VALUES = [
  'COMMAND',
  'REPORT',
  'EX_ANTE_ESTIMATE',
  'ERROR',
] as const
export type OrderHistoryKind = (typeof ORDER_HISTORY_KIND_VALUES)[number]

export const ORDER_ERROR_TYPE_VALUES = [
  'EX_ANTE_ESTIMATE_ERROR',
  'ORDER_CANCEL_REJECT',
] as const
export type OrderErrorType = (typeof ORDER_ERROR_TYPE_VALUES)[number]

export const EX_ANTE_ESTIMATE_FAILURE_REASON_VALUES = [
  'GENERIC',
  'INSTRUMENT_NOT_TRADABLE',
  'ACCOUNT_NOT_ELIGIBLE',
  'INSUFFICIENT_BALANCE',
  'INVALID_QUANTITY',
  'INVALID_PRICE',
  'SERVICE_UNAVAILABLE',
] as const
export type ExAnteEstimateFailureReason =
  (typeof EX_ANTE_ESTIMATE_FAILURE_REASON_VALUES)[number]

export const CANCEL_REJECT_REASON_VALUES = [
  'TOO_LATE_TO_CANCEL',
  'UNKNOWN_ORDER',
  'BROKER_CREDIT',
  'ORDER_ALREADY_IN_PENDING_STATUS',
  'DUPLICATE_CL_ORD_ID',
  'ORIG_ORD_MOD_TIME',
  'UNABLE_TO_PROCESS_ORDER_MASS_CANCEL_REQUEST',
  'OTHER',
  'INVALID_PRICE_INCREMENT',
  'PRICE_EXCEEDS_CURRENT_PRICE',
  'PRICE_EXCEEDS_CURRENT_PRICE_BAND',
] as const
export type CancelRejectReason = (typeof CANCEL_REJECT_REASON_VALUES)[number]

export const CANCEL_REJECT_RESPONSE_TO_VALUES = [
  'ORDER_CANCEL',
  'ORDER_CANCEL_REPLACE',
] as const
export type CancelRejectResponseTo =
  (typeof CANCEL_REJECT_RESPONSE_TO_VALUES)[number]

/**
 * Base error type for order history items. Discriminated by 'type'.
 */
export type OrderError = {
  type: OrderErrorType
  /**
   * Human-readable description of the error.
   */
  message: string
  occurredAt: string
  /**
   * Related client order id, when applicable.
   */
  clOrdId?: string
}

export type OrderErrorDiscriminator = {
  EX_ANTE_ESTIMATE_ERROR: ExAnteEstimateError
  ORDER_CANCEL_REJECT: OrderCancelRejectError
}

export type ExAnteEstimateError = OrderError & {
  reason?: ExAnteEstimateFailureReason
  /**
   * Optional structured context for the failure.
   */
  details?: Record<string, unknown>
}

export type OrderCancelRejectError = OrderError & {
  /**
   * Venue/broker order id if available.
   */
  orderId?: string
  orderStatus?: OrderReportStatus
  origClOrdId?: string
  cancelRejectReason?: CancelRejectReason
  responseTo?: CancelRejectResponseTo
  note?: string
}

/**
 * Chronological item in the lifecycle of an order (command, report, ex-ante estimate, or error). Includes chain identifiers per item.
 */
export type OrderHistoryItem = {
  id: string
  kind: OrderHistoryKind
  /**
   * Present when kind=COMMAND.
   */
  commandInput?: OrderInput
  /**
   * Present when kind=REPORT.
   */
  report?: OrderExecutionReport
  /**
   * Present when kind=EX_ANTE_ESTIMATE.
   */
  estimate?: Estimate
  /**
   * Present when kind=ERROR.
   */
  error?: OrderError
  transactTime: string
  /**
   * OrderId reference carried when applicable (previous accepted OrderId in the chain).
   */
  orderId?: string
}

export const OPERATION_ERROR_CODE_VALUES = [
  'EX_ANTE_EXPIRED',
  'INVALID_ORDER_STATE',
  'UNKNOWN_ORDER',
  'UNKNOWN_CL_ORD_ID',
  'DUPLICATE_CONFIRMATION',
  'VALIDATION_FAILED',
  'BAD_REQUEST',
  'INVALID_COMMAND',
] as const
export type OperationErrorCode = (typeof OPERATION_ERROR_CODE_VALUES)[number]

export type OperationError = {
  code: OperationErrorCode
  /**
   * Human-readable message.
   */
  error: string
  details?: Record<string, unknown>
}

export type ServerError = {
  /**
   * Machine-readable error code.
   */
  code: string
  /**
   * Human-readable error message.
   */
  message: string
  /**
   * UTC timestamp of when the error occurred.
   */
  timestamp: string
}

export const SORT_DIRECTION_VALUES = ['ASC', 'DESC'] as const
export type SortDirection = (typeof SORT_DIRECTION_VALUES)[number]

/**
 * RFC 5988-style navigation links. URIs include query parameters for next/prev traversal.
 */
export type PageLinks = {
  first?: string
  prev?: string
  next?: string
  last?: string
}

/**
 * Offset-based paging metadata for list endpoints.
 */
export type OffsetPagingMeta = {
  /**
   * 1-based page index.
   */
  page: number
  pageSize: number
  total: number
  /**
   * Computed as ceil(total / pageSize).
   */
  totalPages: number
}

export const HEALTH_CHECK_STATUS_VALUE_VALUES = [
  'ok',
  'degraded',
  'error',
] as const
export type HealthCheck_StatusValue =
  (typeof HEALTH_CHECK_STATUS_VALUE_VALUES)[number]

export const HEALTH_CHECK_IMPACT_VALUES = ['critical', 'non_critical'] as const
export type HealthCheck_Impact = (typeof HEALTH_CHECK_IMPACT_VALUES)[number]

export const HEALTH_CHECK_MODE_VALUES = ['inline', 'polled', 'async'] as const
export type HealthCheck_Mode = (typeof HEALTH_CHECK_MODE_VALUES)[number]

export type HealthCheck_Status = {
  status: HealthCheck_StatusValue
}

export type HealthCheck_System = {
  hostname: string
  /**
   * NodeJS.Platform
   */
  platform: string
  release: string
  /**
   * e.g., x64, arm64
   */
  arch: string
  /**
   * Seconds.
   */
  uptime: number
  /**
   * Load averages for 1, 5, 15 minutes.
   */
  loadavg: number[]
  totalmem: number
  freemem: number
  memUsedRatio: number
  cpus: {
    count: number
    model?: string
    speedMHz?: number
  }
}

/**
 * Process memory usage (NodeJS.MemoryUsage).
 */
export type HealthCheck_MemoryUsage = Record<string, number> & {
  rss?: number
  heapTotal?: number
  heapUsed?: number
  external?: number
  arrayBuffers?: number
}

export type HealthCheck_Process = {
  pid: number
  /**
   * Node.js version string.
   */
  node: string
  /**
   * Seconds.
   */
  uptime: number
  memory: HealthCheck_MemoryUsage
}

export type HealthCheck_Liveness = HealthCheck_Status & {
  timestamp: string
  system: HealthCheck_System
  process: HealthCheck_Process
}

export type HealthCheck_Freshness = {
  lastChecked: string
  lastSuccess: string | null
}

export type HealthCheck_Observed = Record<string, unknown> & {
  latencyMs?: number | null
}

export type HealthCheck_CheckError = {
  code: string
  message: string
}

export type HealthCheck_DependencyCheck = HealthCheck_Status & {
  impact: HealthCheck_Impact
  mode: HealthCheck_Mode
  freshness: HealthCheck_Freshness
  observed?: HealthCheck_Observed
  details?: Record<string, unknown>
  error?: unknown
  since?: string | null
}

export type HealthCheck_ReadinessSummary = {
  critical: {
    ok: number
    failing: number
  }
  nonCritical: {
    ok: number
    degraded: number
    failing: number
  }
  degradedReasons: string[]
}

export type HealthCheck_ReadinessPayload = HealthCheck_Status & {
  timestamp: string
  service?: {
    name?: string
    version?: string
    instanceId?: string
  }
  summary: HealthCheck_ReadinessSummary
  /**
   * Keyed by dependency name.
   */
  checks: Record<string, HealthCheck_DependencyCheck>
}

export type HealthCheck_HealthSummary = HealthCheck_Status & {
  timestamp: string
  summary: HealthCheck_ReadinessSummary
  checks: Record<string, HealthCheck_DependencyCheck>
  system: HealthCheck_System
  process: HealthCheck_Process
}

export const LAST_CAPACITY_ENUM_VALUES = [
  'ORD_REJ_REASON_UNSPECIFIED',
  'ORD_REJ_REASON_BROKER_CREDIT',
  'ORD_REJ_REASON_EXCHANGE_CLOSED',
  'ORD_REJ_REASON_ORDER_EXCEEDS_LIMIT',
  'ORD_REJ_REASON_UNKNOWN_SYMBOL',
  'ORD_REJ_REASON_TOO_LATE_TO_ENTER',
  'ORD_REJ_REASON_DUPLICATE_ORDER',
  'ORD_REJ_REASON_UNKNOWN_ORDER',
  'ORD_REJ_REASON_DUPLICATE_OF_AVERBALLY_COMMUNICATED_ORDER',
  'ORD_REJ_REASON_STALE_ORDER',
  'ORD_REJ_REASON_INVALID_INVESTOR_ID',
  'ORD_REJ_REASON_SURVEILLENCE_OPTION',
  'ORD_REJ_REASON_TRADE_ALONG_REQUIRED',
  'ORD_REJ_REASON_UNSUPPORTED_ORDER_CHARACTERISTIC',
  'ORD_REJ_REASON_INCORRECT_ALLOCATED_QUANTITY',
  'ORD_REJ_REASON_INCORRECT_QUANTITY',
  'ORD_REJ_REASON_OTHER',
  'ORD_REJ_REASON_UNKNOWN_ACCOUNT',
  'ORD_REJ_REASON_INVALID_PRICE_INCREMENT',
  'ORD_REJ_REASON_PRICE_EXCEEDS_CURRENT_PRICE_BAND',
  'UNRECOGNIZED',
] as const
export type LastCapacityEnum = (typeof LAST_CAPACITY_ENUM_VALUES)[number]

/**
 * Protobuf timestamp with seconds and nanoseconds.
 */
export type LastLiquidityIndEnum = {
  /**
   * Seconds since Unix epoch.
   */
  seconds: number
  /**
   * Nanoseconds component.
   */
  nanos: number
}

/**
 * Protobuf timestamp with seconds and nanoseconds.
 */
export type Timestamp = {
  /**
   * Seconds since Unix epoch.
   */
  seconds: number
  /**
   * Nanoseconds component.
   */
  nanos: number
}

/**
 * Simplified execution report with essential trading details.
 */
export type OrderExecutionReport = {
  /**
   * Average price of fills.
   */
  averagePrice?: number
  /**
   * Cumulative quantity filled.
   */
  cumulativeQuantityFilled?: number
  /**
   * Last price.
   */
  lastPrice?: number
  /**
   * Last quantity.
   */
  lastQuantity?: number
  /**
   * Transaction time.
   */
  transactTime?: Timestamp
  /**
   * Stop price.
   */
  stopPrice?: number
  /**
   * Expiration time.
   */
  expireTime?: Timestamp
  /**
   * Quantity remaining.
   */
  quantityRemaining?: number
}

export type AuthorizationHeader = {
  Authorization: string
}

export type JwtAssertionHeader = {
  'jwt-assertion': string
}

export type OrderId = {
  id: string
}

export type ClOrdIdPath = {
  clOrdId: string
}

export type ConfirmCommandReplace = {
  command: 'REQ_REPLACE'
}

export type Page = {
  page?: number
}

export type PageSize = {
  pageSize?: number
}

export type FromDate = {
  fromDate?: string
}

export type ToDate = {
  toDate?: string
}

export type SortByOrder = {
  sortBy?: OrderSortField
}

export type SortDir = {
  sortDir?: SortDirection
}

export type FilterAccountIds = {
  accountIds?: string[]
}

export type FilterSide = {
  side?: 'BUY' | 'SELL'
}

export type FilterMics = {
  mics?: string[]
}

export type FilterStatuses = {
  statuses?: string[]
}

export type FilterIsins = {
  isins?: string[]
}

export type NewOrderSingleEstimateBody = OrderInput

export type OrderUpdateEstimateBody = OrderUpdate

/**
 * Bad request.
 */
export type BadRequest = APIResponse<PartiallySerialized<OperationError>>

/**
 * Validation failed.
 */
export type UnprocessableEntity = APIResponse<
  PartiallySerialized<OperationError>
>

/**
 * Resource not found (e.g., preview clOrdId expired, or id missing).
 */
export type NotFound = APIResponse<PartiallySerialized<OperationError>>

/**
 * Conflict (e.g., ex-ante expired, incompatible state, duplicate confirmation).
 */
export type Conflict = APIResponse<PartiallySerialized<OperationError>>

/**
 * Missing/invalid bearer token.
 */
export type Unauthorized = APIResponse<PartiallySerialized<OperationError>>

/**
 * Internal server error.
 */
export type InternalServerError = APIResponse<PartiallySerialized<ServerError>>

/**
 * Authenticated but not authorized.
 */
export type Forbidden = APIResponse<PartiallySerialized<OperationError>>

export type BearerAuth = {
  Authorization: string
}

export type JwtAssertion = {
  'jwt-assertion': string
}

export type TradeFlowServerPaths = {
  '/health/ping': {
    get: {
      /**
       * Basic health status.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Status>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Status>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health/live': {
    get: {
      /**
       * Liveness signal with system and process metrics.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Liveness>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_Liveness>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health/ready': {
    get: {
      /**
       * Readiness including dependency checks and summary.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_ReadinessPayload>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_ReadinessPayload>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health': {
    get: {
      /**
       * Combined view of status, system/process metrics, and readiness summary.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_HealthSummary>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_HealthSummary>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/capabilities': {
    get: {
      /**
       * Returns the user's Product Group Certificates (PGCs) and any active trading restrictions. Authorization is based on both Bearer token and jwt-assertion header.
       *
       * @param {Object} args - The arguments for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<SessionRestrictionResponse>>] | [401, Unauthorized] | [403, Forbidden]>}
       */
      handler: (
        args: Req & { headers: LowerCaseHeaders<JwtAssertionHeader> },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<SessionRestrictionResponse>>]
        | [401, Unauthorized]
        | [403, Forbidden]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/orders': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderListEnvelope>>] | [401, Unauthorized] | [403, Forbidden]>}
       */
      handler: (
        args: Req & { headers: LowerCaseHeaders<JwtAssertionHeader> },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderListEnvelope>>]
        | [401, Unauthorized]
        | [403, Forbidden]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      /**
       * Creates or refreshes a provisional Order and returns the aggregated Order snapshot. On success, the Order will include the latest ex-ante estimate under estimate and status EX_ANTE_RES.
       *
       * @param {Object} args - The arguments for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @param {NewOrderSingleEstimateBody} args.body - Request body for the request.
       * @returns {Promise<[201, APIResponse<PartiallySerialized<OrderEntity>, {Location?: string}>] | [400, BadRequest] | [401, Unauthorized] | [403, Forbidden] | [422, UnprocessableEntity]>}
       */
      handler: (
        args: Req & {
          body: NewOrderSingleEstimateBody
          headers: LowerCaseHeaders<JwtAssertionHeader>
        },
      ) => Promise<
        | [
            201,
            APIResponse<
              PartiallySerialized<OrderEntity>,
              { Location?: string }
            >,
          ]
        | [400, BadRequest]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [422, UnprocessableEntity]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/orders/:id': {
    delete: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {OrderId} args.params - Path parameters for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderEntity>>] | [401, Unauthorized] | [403, Forbidden] | [404, NotFound] | [409, Conflict]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<JwtAssertionHeader>
          params: OrderId
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderEntity>>]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [404, NotFound]
        | [409, Conflict]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {OrderId} args.params - Path parameters for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderEntity>>] | [401, Unauthorized] | [403, Forbidden] | [404, NotFound]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<JwtAssertionHeader>
          params: OrderId
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderEntity>>]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [404, NotFound]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/orders/:id/send-to-market': {
    post: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {OrderId} args.params - Path parameters for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderEntity>>] | [400, BadRequest] | [401, Unauthorized] | [403, Forbidden] | [404, NotFound] | [409, Conflict]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<JwtAssertionHeader>
          params: OrderId
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderEntity>>]
        | [400, BadRequest]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [404, NotFound]
        | [409, Conflict]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/orders/:id/replace': {
    post: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {OrderId} args.params - Path parameters for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @param {OrderUpdateEstimateBody} args.body - Request body for the request.
       * @returns {Promise<[201, APIResponse<PartiallySerialized<OrderEntity>>] | [400, BadRequest] | [401, Unauthorized] | [403, Forbidden] | [404, NotFound] | [422, UnprocessableEntity]>}
       */
      handler: (
        args: Req & {
          body: OrderUpdateEstimateBody
          headers: LowerCaseHeaders<JwtAssertionHeader>
          params: OrderId
        },
      ) => Promise<
        | [201, APIResponse<PartiallySerialized<OrderEntity>>]
        | [400, BadRequest]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [404, NotFound]
        | [422, UnprocessableEntity]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/private/orders/:id/history': {
    get: {
      /**
       * Returns the chronological sequence of commands, reports, ex-ante estimates, and errors for a specific order.
       *
       * @param {Object} args - The arguments for the request.
       * @param {OrderId} args.params - Path parameters for the request.
       * @param {JwtAssertionHeader} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderHistoryItem>[]>] | [401, Unauthorized] | [403, Forbidden] | [404, NotFound]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<JwtAssertionHeader>
          params: OrderId
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderHistoryItem>[]>]
        | [401, Unauthorized]
        | [403, Forbidden]
        | [404, NotFound]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type TradeFlowServer = APIServerDefinition & TradeFlowServerPaths

export type TradeFlowClient = Pick<BaseClient, 'get' | 'post' | 'delete'> & {
  get: {
    /**
     * Basic health status.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_Status>>>}
     */
    (
      url: '/health/ping',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_Status>>>
    /**
     * Liveness signal with system and process metrics.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_Liveness>>>}
     */
    (
      url: '/health/live',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_Liveness>>>
    /**
     * Readiness including dependency checks and summary.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_ReadinessPayload>>>}
     */
    (
      url: '/health/ready',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_ReadinessPayload>>>
    /**
     * Combined view of status, system/process metrics, and readiness summary.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_HealthSummary>>>}
     */
    (
      url: '/health',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_HealthSummary>>>
    /**
     * Returns the user's Product Group Certificates (PGCs) and any active trading restrictions. Authorization is based on both Bearer token and jwt-assertion header.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<SessionRestrictionResponse>>>}
     */
    (
      url: '/private/capabilities',
      args: { headers: JwtAssertionHeader },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<SessionRestrictionResponse>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderListEnvelope>>>}
     */
    (
      url: '/private/orders',
      args: { headers: JwtAssertionHeader },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderListEnvelope>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {OrderId} args.params - Path parameters for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderEntity>>>}
     */
    (
      url: '/private/orders/:id',
      args: { headers: JwtAssertionHeader; params: OrderId },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderEntity>>>
    /**
     * Returns the chronological sequence of commands, reports, ex-ante estimates, and errors for a specific order.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {OrderId} args.params - Path parameters for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderHistoryItem>[]>>}
     */
    (
      url: '/private/orders/:id/history',
      args: { headers: JwtAssertionHeader; params: OrderId },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderHistoryItem>[]>>
  }
  post: {
    /**
     * Creates or refreshes a provisional Order and returns the aggregated Order snapshot. On success, the Order will include the latest ex-ante estimate under estimate and status EX_ANTE_RES.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {NewOrderSingleEstimateBody} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderEntity>, {Location?: string}>>}
     */
    (
      url: '/private/orders',
      args: { body: NewOrderSingleEstimateBody; headers: JwtAssertionHeader },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderEntity>, { Location?: string }>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {OrderId} args.params - Path parameters for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderEntity>>>}
     */
    (
      url: '/private/orders/:id/send-to-market',
      args: { headers: JwtAssertionHeader; params: OrderId },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {OrderId} args.params - Path parameters for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {OrderUpdateEstimateBody} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderEntity>>>}
     */
    (
      url: '/private/orders/:id/replace',
      args: {
        body: OrderUpdateEstimateBody
        headers: JwtAssertionHeader
        params: OrderId
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderEntity>>>
  }
  delete: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {OrderId} args.params - Path parameters for the request.
     * @param {JwtAssertionHeader} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderEntity>>>}
     */
    (
      url: '/private/orders/:id',
      args: { headers: JwtAssertionHeader; params: OrderId },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderEntity>>>
  }
}
