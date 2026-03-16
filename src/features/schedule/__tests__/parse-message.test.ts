import { parseMessage } from '../parse-message';

describe('parseMessage', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('returns parsed structured JSON on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        draft: {
          title: '需求评审会',
          start_time: '2026-03-17T15:00:00.000Z',
        },
      }),
    } as Response);

    await expect(parseMessage('明天下午三点开需求评审会', 'https://example.com/parse')).resolves.toEqual({
      ok: true,
      data: {
        title: '需求评审会',
        start_time: '2026-03-17T15:00:00.000Z',
      },
    });
  });

  it('maps service failures into domain errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(parseMessage('明天下午三点开需求评审会', 'https://example.com/parse')).resolves.toEqual({
      ok: false,
      error: 'service_unavailable',
    });
  });

  it('returns empty_response when draft is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(parseMessage('你好', 'https://example.com/parse')).resolves.toEqual({
      ok: false,
      error: 'empty_response',
    });
  });

  it('returns invalid_format when response body is not valid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token <');
      },
    } as unknown as Response);

    await expect(parseMessage('你好', 'https://example.com/parse')).resolves.toEqual({
      ok: false,
      error: 'invalid_format',
    });
  });
});
