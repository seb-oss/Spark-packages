export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export type Headers = Record<string, string | string[] | number | undefined>

export type Mode = 'local' | 'downstream'
export interface ProxyConfig {
  target: string
  mode?: Mode
  downstream?: string
}
