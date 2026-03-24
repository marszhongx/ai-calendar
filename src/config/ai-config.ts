import AsyncStorage from '@react-native-async-storage/async-storage'

const AI_CONFIG_KEY = 'ai-config'

export type AiConfig = {
  baseUrl: string
  apiKey: string
  modelName: string
}

const defaults: AiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL || '',
  apiKey: process.env.EXPO_PUBLIC_AI_API_KEY || '',
  modelName: process.env.EXPO_PUBLIC_AI_MODEL_NAME || 'gpt-4o-mini',
}

export async function getAiConfig(): Promise<AiConfig> {
  const stored = await AsyncStorage.getItem(AI_CONFIG_KEY)
  if (!stored) return defaults
  const parsed = JSON.parse(stored) as Partial<AiConfig>
  return {
    baseUrl: parsed.baseUrl || defaults.baseUrl,
    apiKey: parsed.apiKey || defaults.apiKey,
    modelName: parsed.modelName || defaults.modelName,
  }
}

export async function setAiConfig(config: Partial<AiConfig>): Promise<void> {
  const current = await getAiConfig()
  const merged = { ...current, ...config }
  await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(merged))
}
