import { useEffect } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocaleProvider } from '@/context/LocaleContext'
import { registerDevice } from '@/services'
import config from '@/theme/tamagui.config'

const DEVICE_ID_KEY = 'deviceId'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function ensureDeviceRegistered() {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    if (Platform.OS === 'web') return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync();
    await registerDevice(deviceId, token.data, Platform.OS);
  } catch (error) {
    console.error('Device registration failed:', error);
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    ensureDeviceRegistered();
  }, []);

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
