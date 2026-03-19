import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSql = vi.hoisted(() => Object.assign(
  vi.fn().mockResolvedValue({ rows: [] }),
  { query: vi.fn() }
));
vi.mock('@/lib/db', () => ({ sql: mockSql }));

const mockSend = vi.hoisted(() => vi.fn());
vi.mock('@/lib/expo-push', () => ({
  sendPushNotifications: mockSend,
}));

import { POST } from './route';

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with count 0 when no reminders due', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });
    const res = await POST();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sent).toBe(0);
  });

  it('sends push and updates reminder_sent_at', async () => {
    mockSql
      .mockResolvedValueOnce({
        rows: [{
          id: 's1',
          title: '开会',
          notes: '准备资料',
          device_id: 'd1',
          push_token: 'ExponentPushToken[xxx]',
        }],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    const res = await POST();
    const data = await res.json();

    expect(mockSend).toHaveBeenCalledOnce();
    expect(data.sent).toBe(1);
  });
});
