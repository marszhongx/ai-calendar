import * as Notifications from 'expo-notifications'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { ErrorBoundary } from '@/components/error-boundary'
import { ACCENT_COLOR, PAGE_BACKGROUND } from '@/constants'
import { LocaleProvider } from '@/context/LocaleContext'
import config from '@/theme/tamagui.config'

async function requestNotificationPermissions() {
  try {
    if (Platform.OS === 'web') return
    await Notifications.requestPermissionsAsync()
  } catch (error) {
    console.error('Notification permission request failed:', error)
  }
}

export default function RootLayout() {
  const theme = 'light'

  useEffect(() => {
    requestNotificationPermissions()
  }, [])

  return (
    <ErrorBoundary>
      <TamaguiProvider config={config} defaultTheme={theme}>
        <Theme name={theme}>
          <LocaleProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: PAGE_BACKGROUND },
                headerShadowVisible: false,
                headerTintColor: ACCENT_COLOR,
                contentStyle: { backgroundColor: PAGE_BACKGROUND },
              }}
            />
          </LocaleProvider>
        </Theme>
      </TamaguiProvider>
    </ErrorBoundary>
  )
}
