import { useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import { LocaleProvider } from '../src/context/LocaleContext'
import config from '../src/theme/tamagui.config'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>
        <LocaleProvider>
          <Stack screenOptions={{ headerShown: true }} />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  )
}
