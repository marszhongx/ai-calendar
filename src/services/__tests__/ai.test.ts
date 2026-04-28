import { parseMessage } from '../ai'
import { getAiConfig } from '../ai-config'

jest.mock('../ai-config', () => ({
  getAiConfig: jest.fn(),
}))

const mockGetAiConfig = jest.mocked(getAiConfig)

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => ({
    chat: jest.fn(() => 'mock-model'),
  })),
}))

const mockGenerateText = jest.fn()
jest.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  Output: { object: jest.fn((opts: unknown) => opts) },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('parseMessage', () => {
  it('throws service_unavailable when apiKey is empty', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: '',
      apiKey: '',
      modelName: 'gpt-4o',
    })
    await expect(parseMessage('明天开会')).rejects.toThrow(
      'service_unavailable',
    )
  })

  it('throws empty_response when output is null', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      modelName: 'gpt-4o',
    })
    mockGenerateText.mockResolvedValue({ output: null })
    await expect(parseMessage('明天开会')).rejects.toThrow('empty_response')
  })

  it('returns parsed schedule on success', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      modelName: 'gpt-4o',
    })
    const payload = {
      title: '开会',
      start_time: '2026-03-20T10:00:00Z',
      end_time: null,
      reminder_minutes_before: 10,
      recurrence: 'NONE',
      notes: null,
      confidence: 0.9,
    }
    mockGenerateText.mockResolvedValue({ output: payload })
    const result = await parseMessage('明天开会')
    expect(result).toEqual(payload)
  })

  it('keeps strict OpenAI JSON schema compatible by allowing null values', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      modelName: 'gpt-4o',
    })
    const payload = {
      title: '开会',
      start_time: '2026-03-20T10:00:00Z',
      end_time: null,
      reminder_minutes_before: 10,
      recurrence: 'NONE',
      notes: null,
      confidence: 0.9,
    }
    mockGenerateText.mockResolvedValue({ output: payload })

    const result = await parseMessage('明天开会')

    expect(result).toEqual(payload)
    const output = mockGenerateText.mock.calls[0][0].output
    expect(output.schema.safeParse(payload).success).toBe(true)
    expect(
      output.schema.safeParse({ ...payload, end_time: undefined }).success,
    ).toBe(false)
    expect(mockGenerateText.mock.calls[0][0]).not.toHaveProperty(
      'providerOptions',
    )
  })
})
