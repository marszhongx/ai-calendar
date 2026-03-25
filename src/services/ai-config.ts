import AsyncStorage from '@react-native-async-storage/async-storage'
import { StorageKey } from '../constants'
import type { AiConfig } from '../types/ai-config'

export async function getAiConfig(): Promise<AiConfig> {
  const stored = await AsyncStorage.getItem(StorageKey.AI_CONFIG)
  if (!stored) return { baseUrl: '', apiKey: '', modelName: '' }
  let parsed: Partial<AiConfig>
  try {
    parsed = JSON.parse(stored) as Partial<AiConfig>
  } catch {
    return { baseUrl: '', apiKey: '', modelName: '' }
  }
  return {
    baseUrl: parsed.baseUrl || '',
    apiKey: parsed.apiKey || '',
    modelName: parsed.modelName || '',
  }
}

export async function setAiConfig(config: Partial<AiConfig>): Promise<void> {
  const current = await getAiConfig()
  const merged = { ...current, ...config }
  await AsyncStorage.setItem(StorageKey.AI_CONFIG, JSON.stringify(merged))
}
