import React, { createRef } from 'react'
import { test, expect, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { TrackingComponent, createSnowplowServer, wait } from './testHelpers'
import { randomUUID } from 'crypto'
import { Text } from 'react-native'
import { SnowplowProvider, SnowplowProviderProps, SnowplowTracker } from './SnowplowProvider'

const host = 'http://testserver.com'
const snowplow = createSnowplowServer(host)
const props: SnowplowProviderProps = {
  namespace: 'test',
  networkConfig: { endpoint: host },
}

beforeAll(() => {
  snowplow.start()
})
afterAll(() => {
  snowplow.stop()
})

test('renders children', async () => {
  render(
    <SnowplowProvider {...props}>
      <Text>Hello Snowplow!</Text>
    </SnowplowProvider>
  )
  const text = await screen.findByText('Hello Snowplow!')
  expect(text).toBeTruthy()
})

test('tracks structured events', async () => {
  const ref = createRef<SnowplowTracker>()
  render(
    <SnowplowProvider {...props}>
      <TrackingComponent ref={ref} />
    </SnowplowProvider>
  )

  const trackingId = randomUUID()    
  await ref.current!.trackStructuredEvent({
    category: 'my-category',
    action: 'my-action',
    label: trackingId,
  })
  await wait(10)

  expect(snowplow.tracker).toHaveBeenCalledWith({
    schema: 'iglu:com.snowplowanalytics.snowplow/payload_data/jsonschema/1-0-4',
    data: [
      expect.objectContaining({
        se_la: trackingId,
        se_ca: 'my-category',
        se_ac: 'my-action',
      })
    ]
  })
})
