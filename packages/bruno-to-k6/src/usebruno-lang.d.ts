declare module '@usebruno/lang' {
  /**
   * Base interface for metadata.
   */
  export interface BrunoMetaBase {
    name: string
    tags?: string[]
    [key: string]: string | string[] | number | undefined
  }

  /**
   * Metadata for an HTTP request.
   */
  export interface BrunoHttpRequestMeta extends BrunoMetaBase {
    type: 'http'
    seq: number
  }

  /**
   * Metadata for a collection.
   */
  export interface BrunoCollectionMeta extends BrunoMetaBase {
    type: 'collection'
  }

  /**
   * Metadata for a folder.
   */
  export interface BrunoFolderMeta extends BrunoMetaBase {
    type: 'folder'
    seq: number
  }

  export type BrunoBodyType =
    | 'none'
    | 'json'
    | 'text'
    | 'xml'
    | 'graphql'
    | 'formUrlEncoded'
    | 'multipartForm'
    | 'file'
    | 'sparql'

  export type BrunoMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

  /**
   * Represents the core HTTP details of a Bruno request.
   */
  export interface BrunoHttp {
    method: BrunoMethod
    url: string
    body?: BrunoBodyType
    auth: string
  }

  /**
   * Represents the core gRPC details of a Bruno request.
   */
  export interface BrunoGrpc {
    [key: string]: string | undefined
  }

  /**
   * Represents a single parameter (query or path) for a request.
   */
  export interface BrunoParam {
    name: string
    value: string
    type: 'query' | 'path'
    enabled: boolean
  }

  /**
   * Represents a single header for a request.
   */
  export interface BrunoHeader {
    name: string
    value: string
    enabled: boolean
  }

  /**
   * AWS v4 authentication details.
   */
  export interface BrunoAuthAwsV4 {
    accessKeyId?: string
    secretAccessKey?: string

    sessionToken?: string
    service?: string
    region?: string
    profileName?: string
  }

  /**
   * Basic authentication details.
   */
  export interface BrunoAuthBasic {
    username?: string
    password?: string
  }

  /**
   * Bearer token authentication details.
   */
  export interface BrunoAuthBearer {
    token: string
  }

  /**
   * Digest authentication details.
   */
  export interface BrunoAuthDigest {
    username: string
    password: string
  }

  /**
   * NTLM authentication details.
   */
  export interface BrunoAuthNtlm {
    username: string
    password: string
    domain?: string
  }

  /**
   * API Key authentication details.
   */
  export interface BrunoAuthApiKey {
    key: string
    value: string
    placement: 'header' | 'query'
  }

  /**
   * WSSE authentication details.
   */
  export interface BrunoAuthWsse {
    username: string
    password: string
  }

  /** Name/value entry used by Bruno for headers, query params and body values */
  export interface BrunoKV {
    name: string
    value: string
    enabled?: boolean
  }

  // ── Auth Request extras: headers OR queryparams ────────────────────────────────
  type OAuth2AuthReqHeaders = {
    oauth2_additional_parameters_auth_req_headers: BrunoKV[]
    oauth2_additional_parameters_auth_req_queryparams?: never
  }
  type OAuth2AuthReqQuery = {
    oauth2_additional_parameters_auth_req_queryparams: BrunoKV[]
    oauth2_additional_parameters_auth_req_headers?: never
  }
  type OAuth2AuthReqNone = {
    oauth2_additional_parameters_auth_req_headers?: never
    oauth2_additional_parameters_auth_req_queryparams?: never
  }
  type OAuth2AuthReqExtras =
    | OAuth2AuthReqHeaders
    | OAuth2AuthReqQuery
    | OAuth2AuthReqNone

  // ── Access Token Request extras: headers OR queryparams OR body ───────────────
  type OAuth2AccessTokenReqHeaders = {
    oauth2_additional_parameters_access_token_req_headers: BrunoKV[]
    oauth2_additional_parameters_access_token_req_queryparams?: never
    oauth2_additional_parameters_access_token_req_bodyvalues?: never
  }
  type OAuth2AccessTokenReqQuery = {
    oauth2_additional_parameters_access_token_req_queryparams: BrunoKV[]
    oauth2_additional_parameters_access_token_req_headers?: never
    oauth2_additional_parameters_access_token_req_bodyvalues?: never
  }
  type OAuth2AccessTokenReqBody = {
    oauth2_additional_parameters_access_token_req_bodyvalues: BrunoKV[]
    oauth2_additional_parameters_access_token_req_headers?: never
    oauth2_additional_parameters_access_token_req_queryparams?: never
  }
  type OAuth2AccessTokenReqNone = {
    oauth2_additional_parameters_access_token_req_headers?: never
    oauth2_additional_parameters_access_token_req_queryparams?: never
    oauth2_additional_parameters_access_token_req_bodyvalues?: never
  }
  type OAuth2AccessTokenReqExtras =
    | OAuth2AccessTokenReqHeaders
    | OAuth2AccessTokenReqQuery
    | OAuth2AccessTokenReqBody
    | OAuth2AccessTokenReqNone

  // ── Refresh Token Request extras: headers OR queryparams OR body ──────────────
  type OAuth2RefreshTokenReqHeaders = {
    oauth2_additional_parameters_refresh_token_req_headers: BrunoKV[]
    oauth2_additional_parameters_refresh_token_req_queryparams?: never
    oauth2_additional_parameters_refresh_token_req_bodyvalues?: never
  }
  type OAuth2RefreshTokenReqQuery = {
    oauth2_additional_parameters_refresh_token_req_queryparams: BrunoKV[]
    oauth2_additional_parameters_refresh_token_req_headers?: never
    oauth2_additional_parameters_refresh_token_req_bodyvalues?: never
  }
  type OAuth2RefreshTokenReqBody = {
    oauth2_additional_parameters_refresh_token_req_bodyvalues: BrunoKV[]
    oauth2_additional_parameters_refresh_token_req_headers?: never
    oauth2_additional_parameters_refresh_token_req_queryparams?: never
  }
  type OAuth2RefreshTokenReqNone = {
    oauth2_additional_parameters_refresh_token_req_headers?: never
    oauth2_additional_parameters_refresh_token_req_queryparams?: never
    oauth2_additional_parameters_refresh_token_req_bodyvalues?: never
  }
  type OAuth2RefreshTokenReqExtras =
    | OAuth2RefreshTokenReqHeaders
    | OAuth2RefreshTokenReqQuery
    | OAuth2RefreshTokenReqBody
    | OAuth2RefreshTokenReqNone

  // ── Top-level shape you can intersect into your BrunoRequest ───────────────────
  export type BrunoOAuth2AdditionalParamsTopLevel = OAuth2AuthReqExtras &
    OAuth2AccessTokenReqExtras &
    OAuth2RefreshTokenReqExtras

  /**
   * Container for all supported authentication methods.
   */
  export interface BrunoAuth {
    mode?: string
    awsv4?: BrunoAuthAwsV4
    basic?: BrunoAuthBasic
    bearer?: BrunoAuthBearer
    digest?: BrunoAuthDigest
    oauth2?: BrunoAuthOAuth2
    wsse?: BrunoAuthWsse
    ntlm?: BrunoAuthNtlm
    apikey?: BrunoAuthApiKey
  }

  /**
   * Represents a GraphQL body with query and variables.
   */
  export interface BrunoBodyGraphQL {
    query: string
    variables?: string
  }

  /**
   * Represents a single entry in a form-urlencoded body.
   */
  export interface BrunoBodyFormUrlEncodedEntry {
    name?: string
    value?: string
    enabled?: boolean
  }

  /**
   * Represents a single entry in a multipart form body.
   */
  export interface BrunoBodyMultipartFormEntry {
    name?: string
    value?: string
    contentType?: string
    enabled?: boolean
    type?: 'text' | 'file'
  }

  /**
   * Represents a file entry in a file body.
   */
  export interface BrunoBodyFileEntry {
    filePath?: string
    contentType?: string
    selected?: boolean
  }

  /**
   * Represents a gRPC message body.
   */
  export interface BrunoBodyGrpcEntry {
    name?: string
    content?: string
  }

  /**
   * Container for all supported request body types.
   */
  export interface BrunoBody {
    json?: string // raw JSON string from body:json { }
    text?: string
    xml?: string
    sparql?: string
    graphql?: BrunoBodyGraphQL
    formUrlEncoded?: BrunoBodyFormUrlEncodedEntry[]
    multipartForm?: BrunoBodyMultipartFormEntry[]
    file?: BrunoBodyFileEntry[]
    grpc?: BrunoBodyGrpcEntry[]
  }

  /**
   * Represents a single variable entry (for pre-request or post-response).
   */
  export interface BrunoVarEntry {
    name?: string
    value?: string
    local?: boolean
    enabled?: boolean
  }

  /**
   * Container for pre-request (req) and post-response (res) variables.
   */
  export interface BrunoVars {
    req?: BrunoVarEntry[]
    res?: BrunoVarEntry[]
  }

  /**
   * Represents a single assertion.
   */
  export interface BrunoAssertion {
    name?: string
    value?: string
    enabled?: boolean
  }

  /**
   * Represents pre-request and post-response script containers.
   */
  export interface BrunoScript {
    req?: string
    res?: string
  }

  /**
   * Represents Bruno request settings.
   */
  export interface BrunoSettings {
    encodeUrl?: boolean
  }

  /**
   * The root object representing a parsed Bruno request from a .bru file.
   */
  export interface BrunoRequest {
    meta: BrunoHttpRequestMeta
    http: BrunoHttp
    grpc?: BrunoGrpc
    params?: BrunoParam[]
    headers?: BrunoHeader[]
    metadata?: BrunoHeader[]
    auth: BrunoAuth
    body?: BrunoBody
    vars?: BrunoVars
    assertions?: BrunoAssertion[]
    script?: BrunoScript
    tests?: string
    docs?: string
    settings: BrunoSettings
    oauth2_additional_parameters_auth_req_headers?: BrunoHeader[]
    oauth2_additional_parameters_auth_req_queryparams?: BrunoHeader[]
    oauth2_additional_parameters_access_token_req_headers?: BrunoHeader[]
    oauth2_additional_parameters_access_token_req_queryparams?: BrunoHeader[]
    oauth2_additional_parameters_access_token_req_bodyvalues?: BrunoHeader[]
    oauth2_additional_parameters_refresh_token_req_headers?: BrunoHeader[]
    oauth2_additional_parameters_refresh_token_req_queryparams?: BrunoHeader[]
    oauth2_additional_parameters_refresh_token_req_bodyvalues?: BrunoHeader[]
  }

  /**
   * The root object representing a parsed Bruno collection from a .bru file.
   */
  export interface BrunoCollection {
    meta: BrunoCollectionMeta
    query?: BrunoHeader[]
    headers?: BrunoHeader[]
    auth?: BrunoAuth
    vars?: BrunoVars
    script?: BrunoScript
    docs?: string
  }

  /**
   * The root object representing a parsed Bruno folder.
   */
  export interface BrunoFolder {
    meta: BrunoFolderMeta
    auth: BrunoAuth
    docs?: string
  }

  /**
   * Represents a single variable in a Bruno environment.
   */
  export interface BrunoEnvironmentVariable {
    name: string
    value?: string
    enabled?: boolean
    secret?: boolean
  }

  /**
   * The root object representing a parsed Bruno environment.
   */
  export interface BrunoEnvironment {
    variables?: BrunoEnvironmentVariable[]
  }

  export function bruToJsonV2(src: string): BrunoRequest
  export function jsonToBruV2(json: BrunoRequest): string
  export function bruToEnvJsonV2(src: string): BrunoEnvironment
  export function envJsonToBruV2(env: BrunoEnvironment): string
  export function collectionBruToJson(src: string): BrunoCollection
  export function jsonToCollectionBru(json: BrunoCollection): string
  export function dotenvToJson(src: string): Record<string, string>
}
