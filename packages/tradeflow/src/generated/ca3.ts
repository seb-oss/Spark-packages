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

export type Account = {
  account_identifier?: AccountIdentifier
  account_is_deactivated?: boolean
  account_owners?: AccountOwner[]
  account_type?: AccountType
  advisory_account?: boolean
  amount_and_currency?: AmountAndCurrency
  arrangement_type_id?: string
  currency_accounts?: CurrencyAccount[]
  custom_account_name?: string
  functions?: FunctionsType[]
  id?: string
  portfolio_bond?: boolean
  primary_account_owner?: string
  related_accounts?: RelatedAccount[]
  user_to_account_relation_type?: UserToAccountRelationType
}

export const ACCOUNT_ID_TYPE_VALUES = ['AccountNumber', 'Bban', 'Iban'] as const
export type AccountIdType = (typeof ACCOUNT_ID_TYPE_VALUES)[number]

export type AccountIdentifier = {
  account_identifier_type?: AccountIdType
  identifier?: string
}

export type AccountOwner = {
  customer_id?: string
  customer_number?: string
}

export const ACCOUNT_RELATION_TYPE_VALUES = [
  'PreferedCashAccount',
  'ConnectedAccount',
  'CashAccount',
] as const
export type AccountRelationType = (typeof ACCOUNT_RELATION_TYPE_VALUES)[number]

export const ACCOUNT_TYPE_VALUES = [
  'Custody',
  'Investment',
  'IPS',
  'Insurance',
  'ISK',
  'Cash',
] as const
export type AccountType = (typeof ACCOUNT_TYPE_VALUES)[number]

export type AccountsOutputModel = {
  accounts?: Account[]
}

export type AmountAndCurrency = {
  amount_type?: AmountType
  currency_code?: string
  error_message?: string
  value?: number
}

export const AMOUNT_TYPE_VALUES = [
  'AvailablePurchaseAmount',
  'Balance',
] as const
export type AmountType = (typeof AMOUNT_TYPE_VALUES)[number]

export type CompanyAccount = {
  account_deactivated?: boolean
  account_functions?: FunctionsType[]
  account_id?: string
  account_name?: string
  account_type?: AccountType
  account_type_id?: string
  advisory_account?: boolean
  amount_and_currency?: AmountAndCurrency
  connected_cashaccount?: string
  currency_accounts?: CurrencyAccount[]
  encrypted_account_id?: string
}

export type CompanyDetails = {
  address_country_code?: string
  ibf_customer?: boolean
  kyc_ok?: boolean
  legal_form?: string
  lei_npid?: boolean
  pb_kr_code?: string
  tax_country_code?: string
}

export type CompanyFunction = {
  company_function?: CompanyFunctionsType
  level?: string
  profile?: string
}

export const COMPANY_FUNCTIONS_TYPE_VALUES = [
  'OpenCustodyAccount',
  'ViewCustodyAccountInformation',
  'ViewCustodyAccountSecurities',
  'ViewSecuritiesSettlement',
  'ViewSecuritiesTradeDetails',
  'RegisterSecuritiesTrade',
  'CancelSecuritiesTrade',
  'SignSecuritiesTrade',
  'RegisterAgreement',
  'SignAgreement',
  'CancelAgreement',
  'ViewAgreementDetails',
  'KycReviewPermission',
  'NotImplemented',
] as const
export type CompanyFunctionsType =
  (typeof COMPANY_FUNCTIONS_TYPE_VALUES)[number]

export type CompanyOutputmodel = {
  accounts?: CompanyAccount[]
  company_details?: CompanyDetails
  company_functions?: CompanyFunction[]
  company_id?: string
  company_name?: string
  customer_details?: CustomerDetails
  customer_id?: string
  encrypted_company_id?: string
  encrypted_customer_id?: string
}

export type CurrencyAccount = {
  account_id?: string
  amount_type?: AmountType
  ar_id?: string
  currency_code?: string
  relation_type?: AccountRelationType
  value?: number
}

export type CustomerDetails = {
  address_country_code?: string
  npid?: boolean
  tax_country_code?: string
}

export const FUNCTIONS_TYPE_VALUES = [
  'BuyFundOrder',
  'SellFundOrder',
  'BuySecurityOrder',
  'SellSecurityOrder',
  'ViewArrangement',
  'ViewHoldings',
  'InitialPublicOfferingOnSecurity',
  'IssueSecurity',
  'ManageFundOrder',
  'ManageSecurityOrder',
  'ViewFundOrder',
  'ViewSecurityOrder',
  'ManageSecurityBuyOrder',
  'ManageSecuritySellOrder',
  'ViewFundTransaction',
  'ViewSecurityTransaction',
] as const
export type FunctionsType = (typeof FUNCTIONS_TYPE_VALUES)[number]

export type RelatedAccount = {
  account_id?: string
  ar_id?: string
  relation_type?: AccountRelationType
}

export type SebBaseErrorModel = {
  detail?: string
  instance?: string
  request_id?: string
  stack_trace?: string
  status?: number
  title?: string
  type?: string
}

export const USER_TO_ACCOUNT_RELATION_TYPE_VALUES = [
  'Owner',
  'ParentalGuardian',
  'PowerOfAttorney',
] as const
export type UserToAccountRelationType =
  (typeof USER_TO_ACCOUNT_RELATION_TYPE_VALUES)[number]

export type CaServerPaths = {
  '/Company/CleanCache': {
    delete: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers.company_number
       * @param {string} args.headers["jwt-assertion"]
       * @returns {Promise<[200, undefined] | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            company_number: string
            'jwt-assertion': string
          }>
        },
      ) => Promise<
        | [200, undefined]
        | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/Company/Get': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {array} [args.query.filter_account_id] - Optional.
       * @param {array} [args.query.filter_account_type] - Optional.
       * @param {array} [args.query.filter_function_type] - Optional.
       * @param {boolean} [args.query.exclude_all_accounts] - Optional.
       * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
       * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
       * @param {string} [args.query.mic_code] - Optional.
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers.company_number
       * @param {string} args.headers["jwt-assertion"]
       * @returns {Promise<[200, APIResponse<PartiallySerialized<CompanyOutputmodel>>] | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>] | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            company_number: string
            'jwt-assertion': string
          }>
          query?: QueryParams<{
            filter_account_id?: string[]
            filter_account_type?: AccountType[]
            filter_function_type?: FunctionsType[]
            exclude_all_accounts?: boolean
            exclude_investment_amount_currency?: boolean
            exclude_cash_accounts?: boolean
            mic_code?: string
          }>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<CompanyOutputmodel>>]
        | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
        | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/Private/CleanCache': {
    delete: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers["jwt-assertion"]
       * @returns {Promise<[200, undefined] | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            'jwt-assertion': string
          }>
        },
      ) => Promise<
        | [200, undefined]
        | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/Private/Get': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {array} [args.query.filter_account_id] - Optional.
       * @param {array} [args.query.filter_account_type] - Optional.
       * @param {array} [args.query.filter_function_type] - Optional.
       * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
       * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
       * @param {string} [args.query.mic_code] - Optional.
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers["jwt-assertion"]
       * @returns {Promise<[200, APIResponse<PartiallySerialized<AccountsOutputModel>>] | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>] | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            'jwt-assertion': string
          }>
          query?: QueryParams<{
            filter_account_id?: string[]
            filter_account_type?: AccountType[]
            filter_function_type?: FunctionsType[]
            exclude_investment_amount_currency?: boolean
            exclude_cash_accounts?: boolean
            mic_code?: string
          }>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<AccountsOutputModel>>]
        | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
        | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/Private/GetEx': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {array} [args.query.filter_account_id] - Optional.
       * @param {array} [args.query.filter_account_type] - Optional.
       * @param {array} [args.query.filter_function_type] - Optional.
       * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
       * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
       * @param {string} [args.query.mic_code] - Optional.
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers["jwt-assertion"]
       * @returns {Promise<[200, APIResponse<PartiallySerialized<AccountsOutputModel>>] | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>] | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            'jwt-assertion': string
          }>
          query?: QueryParams<{
            filter_account_id?: string[]
            filter_account_type?: AccountType[]
            filter_function_type?: FunctionsType[]
            exclude_investment_amount_currency?: boolean
            exclude_cash_accounts?: boolean
            mic_code?: string
          }>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<AccountsOutputModel>>]
        | [400, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
        | [401, APIResponse<PartiallySerialized<SebBaseErrorModel>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/ping': {
    get: {
      /**
       *
       * @returns {Promise<[204, undefined]>}
       */
      handler: (args: Req) => Promise<[204, undefined]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type CaServer = APIServerDefinition & CaServerPaths

export type CaClient = Pick<BaseClient, 'delete' | 'get'> & {
  delete: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers.company_number
     * @param {string} args.headers["jwt-assertion"]
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (
      url: '/Company/CleanCache',
      args: {
        headers: {
          company_number: string
          'jwt-assertion': string
        }
      },
      opts?: RequestOptions,
    ): Promise<undefined>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers["jwt-assertion"]
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (
      url: '/Private/CleanCache',
      args: {
        headers: {
          'jwt-assertion': string
        }
      },
      opts?: RequestOptions,
    ): Promise<undefined>
  }
  get: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {array} [args.query.filter_account_id] - Optional.
     * @param {array} [args.query.filter_account_type] - Optional.
     * @param {array} [args.query.filter_function_type] - Optional.
     * @param {boolean} [args.query.exclude_all_accounts] - Optional.
     * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
     * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
     * @param {string} [args.query.mic_code] - Optional.
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers.company_number
     * @param {string} args.headers["jwt-assertion"]
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<CompanyOutputmodel>>>}
     */
    (
      url: '/Company/Get',
      args: {
        headers: {
          company_number: string
          'jwt-assertion': string
        }
        query?: {
          filter_account_id?: string[]
          filter_account_type?: AccountType[]
          filter_function_type?: FunctionsType[]
          exclude_all_accounts?: boolean
          exclude_investment_amount_currency?: boolean
          exclude_cash_accounts?: boolean
          mic_code?: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<CompanyOutputmodel>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {array} [args.query.filter_account_id] - Optional.
     * @param {array} [args.query.filter_account_type] - Optional.
     * @param {array} [args.query.filter_function_type] - Optional.
     * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
     * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
     * @param {string} [args.query.mic_code] - Optional.
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers["jwt-assertion"]
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<AccountsOutputModel>>>}
     */
    (
      url: '/Private/Get',
      args: {
        headers: {
          'jwt-assertion': string
        }
        query?: {
          filter_account_id?: string[]
          filter_account_type?: AccountType[]
          filter_function_type?: FunctionsType[]
          exclude_investment_amount_currency?: boolean
          exclude_cash_accounts?: boolean
          mic_code?: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<AccountsOutputModel>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {array} [args.query.filter_account_id] - Optional.
     * @param {array} [args.query.filter_account_type] - Optional.
     * @param {array} [args.query.filter_function_type] - Optional.
     * @param {boolean} [args.query.exclude_investment_amount_currency] - Optional.
     * @param {boolean} [args.query.exclude_cash_accounts] - Optional.
     * @param {string} [args.query.mic_code] - Optional.
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers["jwt-assertion"]
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<AccountsOutputModel>>>}
     */
    (
      url: '/Private/GetEx',
      args: {
        headers: {
          'jwt-assertion': string
        }
        query?: {
          filter_account_id?: string[]
          filter_account_type?: AccountType[]
          filter_function_type?: FunctionsType[]
          exclude_investment_amount_currency?: boolean
          exclude_cash_accounts?: boolean
          mic_code?: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<AccountsOutputModel>>>
    /**
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (url: '/ping', opts?: RequestOptions): Promise<undefined>
  }
}
