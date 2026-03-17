import { useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import { LocaleProvider } from '../src/context/LocaleContext'
import config from '../src/theme/tamagui.config'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      <Theme name={colorScheme ?? 'light'}>
        <LocaleProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  )
}
