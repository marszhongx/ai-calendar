import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<void> {
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Push send error:', error);
    }
  }
}
