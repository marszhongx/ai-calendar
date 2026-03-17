import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v3'

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: '#ffffff',
      color: '#1a1a1a',
      borderColor: '#e0e0e0',
      placeholderColor: '#999999',
    },
    dark: {
      ...config.themes.dark,
      background: '#1a1a1a',
      color: '#f5f5f5',
      borderColor: '#333333',
      placeholderColor: '#666666',
    },
  },
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig
