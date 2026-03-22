import { useEffect } from 'react'
import { Platform } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocaleProvider } from '@/context/LocaleContext'
import { registerDevice } from '@/services'
import { ACCENT_COLOR, PAGE_BACKGROUND } from '@/constants'
import config from '@/theme/tamagui.config'

const DEVICE_ID_KEY = 'deviceId'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getHardwareDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync()
    }
    if (Platform.OS === 'android') {
      return Application.getAndroidId()
    }
  } catch {}
  return null
}

async function ensureDeviceRegistered() {
  try {
    const hardwareId = await getHardwareDeviceId()
    let deviceId = hardwareId || await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
    }
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);

    if (Platform.OS === 'web' || !Constants.isDevice) {
      await registerDevice(deviceId, null, Platform.OS);
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      await registerDevice(deviceId, null, Platform.OS);
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerDevice(deviceId, token.data, Platform.OS);
  } catch (error) {
    console.error('Device registration failed:', error);
  }
}

export default function RootLayout() {
  const theme = 'light'

  useEffect(() => {
    ensureDeviceRegistered();
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>
        <LocaleProvider>
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
  )
}
