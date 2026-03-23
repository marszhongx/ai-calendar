import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLimit, mockUpdateWhere } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([])
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
  return { mockLimit, mockUpdateWhere }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: mockUpdateWhere,
      }),
    }),
  },
  schema: { schedules: 'schedules', devices: 'devices' },
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return { ...actual }
})

const mockSend = vi.hoisted(() => vi.fn())
vi.mock('@/lib/expo-push', () => ({
  sendPushNotifications: mockSend,
}))

import { POST } from './route'

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with count 0 when no reminders due', async () => {
    mockLimit.mockResolvedValueOnce([])
    const res = await POST()
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.sent).toBe(0)
  })

  it('sends push and updates reminder_sent_at', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 's1',
        title: '开会',
        notes: '准备资料',
        deviceId: 'd1',
        pushToken: 'ExponentPushToken[xxx]',
      },
    ])

    const res = await POST()
    const data = await res.json()

    expect(mockSend).toHaveBeenCalledOnce()
    expect(data.sent).toBe(1)
  })
})
