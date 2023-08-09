import { createRef } from 'react'
import { Text } from 'react-native'
import { Route } from '@react-navigation/native'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { randomUUID } from 'crypto'

import { createSnowplowServer, wait, TrackingComponent, NavigatingComponent } from './helpers'
import { SnowplowProvider, SnowplowProviderProps, SnowplowTracker } from '../src'

const HOST = 'http://testserver.com'
const snowplowServer = createSnowplowServer(HOST)

describe('SnowplowProvider', () => {
  let props: SnowplowProviderProps

  beforeAll(() => snowplowServer.start())
  afterAll(() => snowplowServer.stop())
  beforeEach(() => snowplowServer.tracker.mockClear())

  beforeEach(() => {
    props = {
      namespace: 'test',
      networkConfig: { endpoint: HOST },
      controllerConfig: {
        trackerConfig: {
          appId: 'TestApp',
          diagnosticAutotracking: true,
        },
      },
    }
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
  
    expect(snowplowServer.tracker).toHaveBeenCalledWith({
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
  test('tracks screen view events', async () => {
    const ref = createRef<SnowplowTracker>()
    const handleNavigation = async (newRoute: Route<string>, oldRoute?: Route<string>) => {
      await ref.current?.trackScreenViewEvent({
        name: newRoute.name,
        id: newRoute.key,
        previousId: oldRoute?.key,
        previousName: oldRoute?.name,
      })
    }
    render(
      <SnowplowProvider {...props}>
        <NavigatingComponent ref={ref} onNavigate={handleNavigation} />
      </SnowplowProvider>
    )

    // Start page
    await screen.getByText('Login screen')

    // Logged in
    const loginButton = await screen.getByRole('button', { name: 'Log in' })
    fireEvent.press(loginButton)
    await screen.getByText('Home screen')

    // Settings
    const settingsTab = await screen.getByRole('button', { name: 'Settings' })
    fireEvent.press(settingsTab)
    await screen.getByText('Settings screen')

    // Back to home
    const homeTab = await screen.getByRole('button', { name: 'Home' })
    fireEvent.press(homeTab)
    await screen.getByText('Home screen')

    await wait(50)

    const calls = snowplowServer.tracker.mock.calls
    expect(calls).toHaveLength(4)

    const payloads = calls.map(([{ data }]) => (JSON.parse(atob(data[0].ue_px))))
  
    // Start page
    expect(payloads[0]).toMatchObject({
      schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
      data: {
        schema: 'iglu:com.snowplowanalytics.mobile/screen_view/jsonschema/1-0-0',
        data: {
          name: 'Unauthenticated',
        },
      },
    })

    // Logged in
    expect(payloads[1]).toMatchObject({
      schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
      data: {
        schema: 'iglu:com.snowplowanalytics.mobile/screen_view/jsonschema/1-0-0',
        data: {
          name: 'Home',
          previousName: 'Unauthenticated',
        },
      },
    })

    // Settings
    expect(payloads[2]).toMatchObject({
      schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
      data: {
        schema: 'iglu:com.snowplowanalytics.mobile/screen_view/jsonschema/1-0-0',
        data: {
          name: 'Settings',
          previousName: 'Home',
        },
      },
    })

    // Back to home
    expect(payloads[3]).toMatchObject({
      schema: 'iglu:com.snowplowanalytics.snowplow/unstruct_event/jsonschema/1-0-0',
      data: {
        schema: 'iglu:com.snowplowanalytics.mobile/screen_view/jsonschema/1-0-0',
        data: {
          name: 'Home',
          previousName: 'Settings',
        },
      },
    })
  })
  test('tracks navigation events', async () => {
    render(
      <SnowplowProvider {...props}>
        <NavigatingComponent />
      </SnowplowProvider>
    )

    await screen.getByText('Login screen')

    const loginButton = await screen.getByRole('button', { name: 'Log in' })
    fireEvent.press(loginButton)
    await screen.getByText('Home screen')

    const settingsTab = await screen.getByRole('button', { name: 'Settings' })
    fireEvent.press(settingsTab)
    await screen.getByText('Settings screen')

    // TODO
    // Figure out if there is a way to measure tracking in test mode
  })
})
