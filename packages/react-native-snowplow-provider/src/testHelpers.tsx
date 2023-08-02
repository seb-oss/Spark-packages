import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { ForwardedRef, forwardRef, useImperativeHandle } from 'react'
import { vi } from 'vitest'
import { SnowplowTracker, useSnowplow } from './SnowplowProvider'

export const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

export const createSnowplowServer = (host: string) => {
  const tracker = vi.fn()
  const server = setupServer(
    rest.post(`${host}/com.snowplowanalytics.snowplow/tp2`, async (req, res, ctx) => {
      const payload = await req.json()
      //console.log(payload)
      tracker(payload)
      return res(ctx.json({}))
    })
  )
  return {
    tracker,
    start: () => server.listen({ onUnhandledRequest: 'error' }),
    stop: () => server.close(),
  }
}

export const TrackingComponent = forwardRef((_, ref: ForwardedRef<SnowplowTracker>) => {
  const tracker = useSnowplow()
  useImperativeHandle(ref, () => tracker, [])
  return (<></>)
})
