import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockOrderBy, mockReturning } = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockReturning = vi.fn().mockResolvedValue([]);
  return { mockOrderBy, mockReturning };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    }),
  },
  schema: { schedules: 'schedules' },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return { ...actual };
});

import { GET, POST } from './route';

function mockGetRequest(deviceId: string) {
  return new Request(`http://localhost/api/schedules?deviceId=${deviceId}`);
}

function mockPostRequest(body: unknown) {
  return new Request('http://localhost/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if deviceId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/schedules'));
    expect(res.status).toBe(400);
  });

  it('returns schedules list', async () => {
    mockOrderBy.mockResolvedValueOnce([{ id: '1', title: 'test' }]);
    const res = await GET(mockGetRequest('dev-1'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});

describe('POST /api/schedules', () => {
  it('returns 400 if required fields missing', async () => {
    const res = await POST(mockPostRequest({ deviceId: 'dev-1' }));
    expect(res.status).toBe(400);
  });

  it('creates schedule and returns it', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'new-1', title: '开会', deviceId: 'dev-1' }]);
    const res = await POST(mockPostRequest({
      deviceId: 'dev-1',
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 30,
      recurrence: 'NONE',
      notes: '',
    }));
    expect(res.status).toBe(201);
  });
});
