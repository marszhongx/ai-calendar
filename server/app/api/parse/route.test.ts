import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  parseMessage: vi.fn(),
}));

import { POST } from './route';
import { parseMessage } from '@/lib/ai';

const mockParseMessage = vi.mocked(parseMessage);

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/parse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if message is missing', async () => {
    const res = await POST(mockRequest({ deviceId: 'xxx' }));
    expect(res.status).toBe(400);
  });

  it('returns parsed schedule on success', async () => {
    mockParseMessage.mockResolvedValue({
      title: '开会',
      start_time: '2026-03-20T10:00:00+08:00',
    });

    const res = await POST(mockRequest({ message: '明天十点开会', deviceId: 'dev-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('开会');
  });

  it('returns 500 on AI failure', async () => {
    mockParseMessage.mockRejectedValue(new Error('AI error'));

    const res = await POST(mockRequest({ message: 'test', deviceId: 'dev-1' }));
    expect(res.status).toBe(500);
  });
});
