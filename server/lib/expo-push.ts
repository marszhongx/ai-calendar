import { Expo, type ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

export type PushResult = {
  succeededTokens: string[]
  failedTokens: string[]
}

export async function sendPushNotifications(
  messages: ExpoPushMessage[],
): Promise<PushResult> {
  const succeededTokens: string[] = []
  const failedTokens: string[] = []

  const chunks = expo.chunkPushNotifications(messages)
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  )

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const result = results[i]
    if (result.status === 'rejected') {
      console.error('Push send error:', result.reason)
      for (const msg of chunk) {
        const token = Array.isArray(msg.to) ? msg.to[0] : msg.to
        if (token) failedTokens.push(token)
      }
    } else {
      for (const msg of chunk) {
        const token = Array.isArray(msg.to) ? msg.to[0] : msg.to
        if (token) succeededTokens.push(token)
      }
    }
  }

  return { succeededTokens, failedTokens }
}
