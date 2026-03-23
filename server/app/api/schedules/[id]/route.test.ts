import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockReturning, mockDeleteReturning } = vi.hoisted(() => {
  const mockReturning = vi.fn().mockResolvedValue([])
  const mockDeleteReturning = vi.fn().mockResolvedValue([])
  return { mockReturning, mockDeleteReturning }
})

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
      where: vi.fn().mockReturnValue({
        returning: mockDeleteReturning,
      }),
    }),
  },
  schema: { schedules: 'schedules' },
}))

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return { ...actual }
})

import { DELETE, PUT } from './route'

const deviceId = 'dev-1'
const params = Promise.resolve({ id: 'sched-1' })

function mockPutRequest(body: unknown) {
  return new Request('http://localhost/api/schedules/sched-1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(body),
  })
}

function mockDeleteRequest() {
  return new Request('http://localhost/api/schedules/sched-1', {
    method: 'DELETE',
    headers: { 'X-Device-Id': deviceId },
  })
}

describe('PUT /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const req = new Request('http://localhost/api/schedules/sched-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'test',
        startAt: '2026-03-20T10:00:00+08:00',
      }),
    })
    const res = await PUT(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 400 if title is missing', async () => {
    const res = await PUT(
      mockPutRequest({ startAt: '2026-03-20T10:00:00+08:00' }),
      { params },
    )
    expect(res.status).toBe(400)
  })

  it('updates and returns schedule', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'sched-1', title: '更新' }])
    const res = await PUT(
      mockPutRequest({
        title: '更新',
        startAt: '2026-03-20T10:00:00+08:00',
        reminderMinutesBefore: 15,
        recurrence: 'NONE',
        notes: '',
      }),
      { params },
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 if schedule not found', async () => {
    mockReturning.mockResolvedValueOnce([])
    const res = await PUT(
      mockPutRequest({
        title: 'test',
        startAt: '2026-03-20T10:00:00+08:00',
      }),
      { params },
    )
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const req = new Request('http://localhost/api/schedules/sched-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 200 on delete', async () => {
    mockDeleteReturning.mockResolvedValueOnce([{ id: 'sched-1' }])
    const res = await DELETE(mockDeleteRequest(), { params })
    expect(res.status).toBe(200)
  })

  it('returns 404 if schedule not found', async () => {
    mockDeleteReturning.mockResolvedValueOnce([])
    const res = await DELETE(mockDeleteRequest(), { params })
    expect(res.status).toBe(404)
  })
})
