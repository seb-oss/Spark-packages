import { ForwardedRef, forwardRef, useImperativeHandle, useRef } from 'react'
import {
  CompositeNavigationProp,
  NavigationContainer,
  NavigatorScreenParams,
  Route,
  useNavigation,
  useNavigationContainerRef,
} from '@react-navigation/native'
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Button, Text, View } from 'react-native'
import { SnowplowTracker, useSnowplow } from '../../src'

/**
 * Simple tracking component which exposes the tracker via ref
 */
export const TrackingComponent = forwardRef((_, ref: ForwardedRef<SnowplowTracker>) => {
  const tracker = useSnowplow()
  useImperativeHandle(ref, () => tracker, [])
  return (<></>)
})

type Root = {
  'Unauthenticated': undefined,
  'Authenticated'?: NavigatorScreenParams<Tabs>,
}
const RootNavigator = createNativeStackNavigator<Root>()

type Tabs = {
  'Home': undefined,
  'Settings': { id: string }
}
const TabsNavigator = createBottomTabNavigator<Tabs>()

type NavigationProps = CompositeNavigationProp<
  NativeStackNavigationProp<Root>,
  BottomTabNavigationProp<Tabs>
>

const LoginButton = () => {
  const { navigate } = useNavigation<NavigationProps>()
  return (
    <Button title="Log in" onPress={() => navigate('Authenticated')} />
  )
}
const LogoutButton = () => {
  const { navigate } = useNavigation<NavigationProps>()
  return (
    <Button title="Log out" onPress={() => navigate('Authenticated')} />
  )
}

const HomeScreen = () => (
  <View>
    <Text>Home screen</Text>
    <LogoutButton />
  </View>
)
const SettingsScreen = () => (
  <View>
    <Text>Settings screen</Text>
    <LogoutButton />
  </View>
)
const MainScreen = () => (
  <TabsNavigator.Navigator>
    <TabsNavigator.Screen name="Home" component={HomeScreen} />
    <TabsNavigator.Screen name="Settings" component={SettingsScreen} />
  </TabsNavigator.Navigator>
)

const LoginScreen = () => (
  <View>
    <Text>Login screen</Text>
    <LoginButton />
  </View>
)
const RootScreen = () => (
  <RootNavigator.Navigator >
    <RootNavigator.Screen name="Unauthenticated" component={LoginScreen} />
    <RootNavigator.Screen name="Authenticated" component={MainScreen} />
  </RootNavigator.Navigator>
)

interface NavigatingComponentProps {
  onNavigate?: (newRoute: Route<string>, oldRoute?: Route<string>) => void
}
export const NavigatingComponent = forwardRef(({ onNavigate }: NavigatingComponentProps, ref: ForwardedRef<SnowplowTracker>) => {
  const navigationContainerRef = useNavigationContainerRef<NavigationProps>()
  const previousRoute = useRef<Route<string>>()

  const handleNavigation = (newRoute?: Route<string>) => {
    if (onNavigate && newRoute && (!previousRoute.current || previousRoute.current.key !== newRoute.key)) {
      onNavigate(newRoute, previousRoute.current)
    }
    previousRoute.current = newRoute
  }

  const tracker = useSnowplow()
  useImperativeHandle(ref, () => tracker, [])

  return (
    <NavigationContainer
      ref={navigationContainerRef}
      onReady={() => handleNavigation(navigationContainerRef.getCurrentRoute())}
      onStateChange={() => handleNavigation(navigationContainerRef.getCurrentRoute())}
    >
      <RootScreen />
    </NavigationContainer>
  )
})
