import { ReactNode, createContext, useContext, useMemo } from 'react'
import { createTracker, NetworkConfiguration, ReactNativeTracker, TrackerControllerConfiguration } from '@snowplow/react-native-tracker'

export interface SnowplowTracker extends ReactNativeTracker {
  //
}
const defaultValue: Partial<SnowplowTracker> = {}
const SnowplowContext = createContext<SnowplowTracker>(defaultValue as SnowplowTracker)

export interface SnowplowProviderProps {
  children?: ReactNode
  namespace: string
  networkConfig: NetworkConfiguration
  controllerConfig?: TrackerControllerConfiguration
}
export const SnowplowProvider = ({ namespace, networkConfig, controllerConfig, children }: SnowplowProviderProps) => {
  const tracker = useMemo(() => createTracker(namespace, networkConfig, controllerConfig), [namespace, networkConfig, controllerConfig])

  return (
    <SnowplowContext.Provider value={tracker}>
      { children }
    </SnowplowContext.Provider>
  )
}

export const useSnowplow = () => useContext(SnowplowContext)
