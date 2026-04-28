import '@testing-library/react-native/build/matchers/extend-expect'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
const mockRouterDismissAll = jest.fn()

let mockSearchParams: Record<string, string> = {}

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => children
  Stack.Screen = () => null

  return {
    useRouter: () => ({
      push: mockRouterPush,
      replace: mockRouterReplace,
      back: mockRouterBack,
      dismissAll: mockRouterDismissAll,
    }),
    useLocalSearchParams: () => mockSearchParams,
    Stack,
  }
})

;(globalThis as Record<string, unknown>).__mockRouterPush = mockRouterPush
;(globalThis as Record<string, unknown>).__mockRouterDismissAll =
  mockRouterDismissAll
;(globalThis as Record<string, unknown>).__mockRouterBack = mockRouterBack

Object.defineProperty(globalThis, '__mockSearchParams', {
  set(value: Record<string, string>) {
    mockSearchParams = value ?? {}
  },
  get() {
    return mockSearchParams
  },
})

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react')
    useEffect(cb, [cb])
  },
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2, 9)}`,
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-status-bar', () => {
  const StatusBar = (props: Record<string, unknown>) => {
    const React = require('react')
    return React.createElement('StatusBar', {
      ...props,
      testID: 'app-status-bar',
    })
  }

  return { StatusBar }
})

jest.mock('./src/theme/tamagui.config', () => {
  const { createTamagui } = require('tamagui')
  const { config } = require('@tamagui/config/v3')
  return { __esModule: true, default: createTamagui(config) }
})
