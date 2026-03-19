import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vercel/postgres', () => {
  const mockSql = Object.assign(
    vi.fn().mockResolvedValue({ rows: [] }),
    { query: vi.fn() }
  );
  return { sql: mockSql };
});

import { POST } from './route';

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/devices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if deviceId is missing', async () => {
    const res = await POST(mockRequest({ pushToken: 'token', platform: 'ios' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 on valid input', async () => {
    const res = await POST(mockRequest({
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      pushToken: 'ExponentPushToken[xxx]',
      platform: 'ios',
    }));
    expect(res.status).toBe(200);
  });
});
