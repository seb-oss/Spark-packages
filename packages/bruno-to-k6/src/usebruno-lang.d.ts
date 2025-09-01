// usebruno-lang.d.ts
declare module '@usebruno/lang' {
  export function bruToJsonV2(src: string): any
  export function jsonToBruV2(json: any): string
  export function bruToEnvJsonV2(src: string): any
  export function envJsonToBruV2(env: any): string
  export function collectionBruToJson(src: string): any
  export function jsonToCollectionBru(json: any): string
  export function dotenvToJson(src: string): Record<string, string>
}
