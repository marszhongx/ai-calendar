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
    }
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(payload) })
    const result = await parseMessage('明天开会')
    expect(result).toEqual(payload)
  })

  it('requests plain text JSON without structured response format', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      modelName: 'deepseek-v4-pro',
    })
    const payload = {
      title: '开会',
      start_time: '2026-03-20T10:00:00Z',
      end_time: null,
      reminder_minutes_before: 10,
      recurrence: 'NONE',
      notes: null,
    }
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(payload) })

    const result = await parseMessage('明天开会')

    expect(result).toEqual(payload)
    expect(mockGenerateText.mock.calls[0][0]).not.toHaveProperty('output')
  })

  it('separates stable JSON instructions from the user schedule request', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-test',
      modelName: 'deepseek-v4-pro',
    })
    const payload = {
      title: '开会',
      start_time: '2026-03-20T10:00:00Z',
      end_time: null,
      reminder_minutes_before: 10,
      recurrence: 'NONE',
      notes: null,
    }
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(payload) })

    await parseMessage('明天开会')

    const request = mockGenerateText.mock.calls[0][0]
    expect(request.system).toContain('return only JSON')
    expect(request.system).toContain('reminder_minutes_before')
    expect(request.prompt).toContain('Current time:')
    expect(request.prompt).toContain('"明天开会"')
    expect(request.prompt).not.toContain('return only JSON')
  })

  it('rejects text JSON that does not match the schedule schema', async () => {
    mockGetAiConfig.mockResolvedValue({
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-test',
      modelName: 'gpt-4o',
    })
    const payload = {
      title: '开会',
      start_time: '2026-03-20T10:00:00Z',
      reminder_minutes_before: 10,
      recurrence: 'NONE',
      notes: null,
    }
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(payload) })

    await expect(parseMessage('明天开会')).rejects.toThrow()
  })
})
