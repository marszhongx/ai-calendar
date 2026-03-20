import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReturning, mockDeleteWhere } = vi.hoisted(() => {
  const mockReturning = vi.fn().mockResolvedValue([]);
  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
  return { mockReturning, mockDeleteWhere };
});

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: mockReturning,
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: mockDeleteWhere,
    }),
  },
  schema: { schedules: 'schedules' },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return { ...actual };
});

import { PUT, DELETE } from './route';

const params = Promise.resolve({ id: 'sched-1' });

function mockPutRequest(body: unknown) {
  return new Request('http://localhost/api/schedules/sched-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if title is missing', async () => {
    const res = await PUT(mockPutRequest({ startAt: '2026-03-20T10:00:00+08:00' }), { params });
    expect(res.status).toBe(400);
  });

  it('updates and returns schedule', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'sched-1', title: '更新' }]);
    const res = await PUT(mockPutRequest({
      title: '更新',
      startAt: '2026-03-20T10:00:00+08:00',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 15,
      recurrence: 'NONE',
      notes: '',
    }), { params });
    expect(res.status).toBe(200);
  });

  it('returns 404 if schedule not found', async () => {
    mockReturning.mockResolvedValueOnce([]);
    const res = await PUT(mockPutRequest({
      title: 'test',
      startAt: '2026-03-20T10:00:00+08:00',
    }), { params });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/schedules/[id]', () => {
  it('returns 200 on delete', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/schedules/sched-1', { method: 'DELETE' }),
      { params }
    );
    expect(res.status).toBe(200);
  });
});
