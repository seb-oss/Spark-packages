import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'

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
