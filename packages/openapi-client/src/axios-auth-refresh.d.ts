declare module 'axios-auth-refresh' {
  import type { AxiosInstance, AxiosResponse } from 'axios'
  import type { AxiosAuthRefreshOptions } from 'axios-auth-refresh/dist/model'

  export default function createAuthRefreshInterceptor(
    instance: AxiosInstance,
    // biome-ignore lint/suspicious/noExplicitAny: Defined by dependency
    refreshAuthCall: (error: any) => Promise<AxiosResponse>,
    options?: AxiosAuthRefreshOptions
  ): number
}
