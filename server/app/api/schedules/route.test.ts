import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockOrderBy, mockReturning } = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([])
  const mockReturning = vi.fn().mockResolvedValue([])
  return { mockOrderBy, mockReturning }
})

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
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return { ...actual }
})

import { GET, POST } from './route'

const deviceId = 'dev-1'

function mockGetRequest(id: string) {
  return new Request('http://localhost/api/schedules', {
    headers: { 'X-Device-Id': id },
  })
}

function mockPostRequest(body: unknown) {
  return new Request('http://localhost/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(body),
  })
}

describe('GET /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const res = await GET(new Request('http://localhost/api/schedules'))
    expect(res.status).toBe(401)
  })

  it('returns schedules list', async () => {
    mockOrderBy.mockResolvedValueOnce([{ id: '1', title: 'test' }])
    const res = await GET(mockGetRequest(deviceId))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const req = new Request('http://localhost/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'test',
        startAt: '2026-03-20T10:00:00+08:00',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if required fields missing', async () => {
    const res = await POST(mockPostRequest({}))
    expect(res.status).toBe(400)
  })

  it('creates schedule and returns it', async () => {
    mockReturning.mockResolvedValueOnce([
      { id: 'new-1', title: '开会', deviceId },
    ])
    const res = await POST(
      mockPostRequest({
        title: '开会',
        startAt: '2026-03-20T10:00:00+08:00',
        reminderMinutesBefore: 30,
        recurrence: 'NONE',
        notes: '',
      }),
    )
    expect(res.status).toBe(201)
  })
})
