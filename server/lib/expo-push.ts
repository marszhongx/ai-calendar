import { Expo, type ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

export async function sendPushNotifications(
  messages: ExpoPushMessage[],
): Promise<void> {
  const chunks = expo.chunkPushNotifications(messages)
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  )
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Push send error:', result.reason)
    }
  }
}
