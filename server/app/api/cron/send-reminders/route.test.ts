import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLimit, mockUpdateReturning, mockUpdateWhere2 } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([])
  const mockUpdateReturning = vi.fn().mockResolvedValue([])
  const mockUpdateWhere2 = vi.fn().mockResolvedValue(undefined)
  return { mockLimit, mockUpdateReturning, mockUpdateWhere2 }
})

let updateCallCount = 0

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
    update: vi.fn().mockImplementation(() => {
      updateCallCount++
      if (updateCallCount <= 1) {
        // First update: optimistic lock
        return {
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: mockUpdateReturning,
            }),
          }),
        }
      }
      // Second update: reset failed
      return {
        set: vi.fn().mockReturnValue({
          where: mockUpdateWhere2,
        }),
      }
    }),
  },
  schema: { schedules: 'schedules', devices: 'devices' },
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return { ...actual }
})

const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ succeededTokens: [], failedTokens: [] }),
)
vi.mock('@/lib/expo-push', () => ({
  sendPushNotifications: mockSend,
}))

import { POST } from './route'

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateCallCount = 0
  })

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
        reminderSentAt: null,
      },
    ])
    mockUpdateReturning.mockResolvedValueOnce([{ id: 's1' }])
    mockSend.mockResolvedValueOnce({
      succeededTokens: ['ExponentPushToken[xxx]'],
      failedTokens: [],
    })

    const res = await POST()
    const data = await res.json()

    expect(mockSend).toHaveBeenCalledOnce()
    expect(data.sent).toBe(1)
  })

  it('returns 0 when optimistic lock claims no rows', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 's1',
        title: '开会',
        notes: '',
        deviceId: 'd1',
        pushToken: 'ExponentPushToken[xxx]',
        reminderSentAt: null,
      },
    ])
    mockUpdateReturning.mockResolvedValueOnce([]) // no rows claimed

    const res = await POST()
    const data = await res.json()

    expect(mockSend).not.toHaveBeenCalled()
    expect(data.sent).toBe(0)
  })
})
