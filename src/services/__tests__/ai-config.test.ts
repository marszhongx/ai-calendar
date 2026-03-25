import AsyncStorage from '@react-native-async-storage/async-storage'
import { StorageKey } from '@/constants'
import { getAiConfig, setAiConfig } from '../ai-config'

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('getAiConfig', () => {
  it('returns empty defaults when nothing is stored', async () => {
    const config = await getAiConfig()
    expect(config).toEqual({ baseUrl: '', apiKey: '', modelName: '' })
  })

  it('returns stored config', async () => {
    await AsyncStorage.setItem(
      StorageKey.AI_CONFIG,
      JSON.stringify({
        baseUrl: 'https://api.example.com',
        apiKey: 'sk-test',
        modelName: 'gpt-4o',
      }),
    )
    const config = await getAiConfig()
    expect(config).toEqual({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      modelName: 'gpt-4o',
    })
  })

  it('fills missing fields with empty strings', async () => {
    await AsyncStorage.setItem(
      StorageKey.AI_CONFIG,
      JSON.stringify({ apiKey: 'sk-test' }),
    )
    const config = await getAiConfig()
    expect(config).toEqual({ baseUrl: '', apiKey: 'sk-test', modelName: '' })
  })

  it('returns defaults for invalid JSON', async () => {
    await AsyncStorage.setItem(StorageKey.AI_CONFIG, 'not-json')
    const config = await getAiConfig()
    expect(config).toEqual({ baseUrl: '', apiKey: '', modelName: '' })
  })
})

describe('setAiConfig', () => {
  it('saves config to AsyncStorage', async () => {
    await setAiConfig({ apiKey: 'sk-new', modelName: 'gpt-4o-mini' })
    const config = await getAiConfig()
    expect(config.apiKey).toBe('sk-new')
    expect(config.modelName).toBe('gpt-4o-mini')
  })

  it('merges with existing config', async () => {
    await setAiConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-old',
      modelName: 'gpt-4o',
    })
    await setAiConfig({ apiKey: 'sk-updated' })
    const config = await getAiConfig()
    expect(config).toEqual({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-updated',
      modelName: 'gpt-4o',
    })
  })
})
