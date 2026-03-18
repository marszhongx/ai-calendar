import { parseMessageWithAI } from '../parse-message';

jest.mock('../../../services', () => {
  const mockParseMessage = jest.fn();
  return {
    createAIService: jest.fn(() => ({ parseMessage: mockParseMessage })),
    __mockParseMessage: mockParseMessage,
  };
});

jest.mock('../../../config/ai-config', () => {
  const mockGetAIConfig = jest.fn();
  return {
    ConfigManager: {
      getInstance: () => ({
        getAIConfig: mockGetAIConfig,
      }),
    },
    __mockGetAIConfig: mockGetAIConfig,
  };
});

const { __mockParseMessage: mockParseMessage } = jest.requireMock('../../../services') as { __mockParseMessage: jest.Mock };
const { __mockGetAIConfig: mockGetAIConfig } = jest.requireMock('../../../config/ai-config') as { __mockGetAIConfig: jest.Mock };

describe('parseMessageWithAI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed result on success with explicit config', async () => {
    const expected = {
      ok: true as const,
      data: {
        title: '需求评审会',
        start_time: '2026-03-17T15:00:00.000Z',
      },
    };
    mockParseMessage.mockResolvedValue(expected);

    const result = await parseMessageWithAI('明天下午三点开需求评审会', {
      apiKey: 'test-key',
      provider: 'google',
      model: 'gemini-2.5-pro',
    });

    expect(result).toEqual(expected);
  });

  it('returns service_unavailable when no API key configured', async () => {
    mockGetAIConfig.mockReturnValue({ apiKey: '' });

    const result = await parseMessageWithAI('test');

    expect(result).toEqual({
      ok: false,
      error: 'service_unavailable',
    });
  });

  it('returns error on AI service failure', async () => {
    const expected = {
      ok: false as const,
      error: 'service_unavailable' as const,
    };
    mockParseMessage.mockResolvedValue(expected);

    const result = await parseMessageWithAI('test', {
      apiKey: 'test-key',
      provider: 'google',
    });

    expect(result).toEqual(expected);
  });
});
