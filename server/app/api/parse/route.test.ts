import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai', () => ({
  parseMessage: vi.fn(),
}))

import { parseMessage } from '@/lib/ai'
import { POST } from './route'

const mockParseMessage = vi.mocked(parseMessage)

const deviceId = 'dev-1'

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/parse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if X-Device-Id header is missing', async () => {
    const req = new Request('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if message is missing', async () => {
    const res = await POST(mockRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns parsed schedule on success', async () => {
    mockParseMessage.mockResolvedValue({
      title: '开会',
      start_time: '2026-03-20T10:00:00+08:00',

      reminder_minutes_before: 10,
      recurrence: 'NONE',
      confidence: 0.95,
    })

    const res = await POST(mockRequest({ message: '明天十点开会' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.title).toBe('开会')
  })

  it('returns 500 on AI failure', async () => {
    mockParseMessage.mockRejectedValue(new Error('AI error'))

    const res = await POST(mockRequest({ message: 'test' }))
    expect(res.status).toBe(500)
  })
})
