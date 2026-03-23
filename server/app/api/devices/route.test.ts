import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockOnConflictDoUpdate } = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  return { mockOnConflictDoUpdate }
})

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      }),
    }),
  },
  schema: { devices: 'devices' },
}))

import { POST } from './route'

const deviceId = '550e8400-e29b-41d4-a716-446655440000'

function mockRequest(body: unknown, headers?: Record<string, string>) {
  return new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/devices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const req = new Request('http://localhost/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: 'token', platform: 'ios' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if invalid JSON body', async () => {
    const req = new Request('http://localhost/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if platform is missing', async () => {
    const res = await POST(mockRequest({ pushToken: 'token' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid input', async () => {
    const res = await POST(
      mockRequest({
        pushToken: 'ExponentPushToken[xxx]',
        platform: 'ios',
      }),
    )
    expect(res.status).toBe(200)
  })
})
