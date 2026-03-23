import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  parseMessage,
  registerDevice,
  updateSchedule,
} from '../index'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:4399'
})

describe('registerDevice', () => {
  it('calls POST /api/devices with correct body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    await registerDevice('dev-1', 'ExponentPushToken[xxx]', 'ios')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/devices',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          deviceId: 'dev-1',
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
        }),
      }),
    )
  })
})

describe('parseMessage', () => {
  it('calls POST /api/parse and returns parsed data', async () => {
    const parsed = { title: '开会', start_time: '2026-03-20T10:00:00+08:00' }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => parsed })
    const result = await parseMessage('明天十点开会', 'dev-1')
    expect(result).toEqual(parsed)
  })

  it('throws on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'fail' }),
    })
    await expect(parseMessage('test', 'dev-1')).rejects.toThrow()
  })
})

describe('listSchedules', () => {
  it('calls GET /api/schedules with deviceId query param', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    await listSchedules('dev-1')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/schedules?deviceId=dev-1',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})

describe('createSchedule', () => {
  it('calls POST /api/schedules', async () => {
    const schedule = {
      deviceId: 'dev-1',
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', ...schedule }),
    })
    const result = (await createSchedule(schedule)) as { id: string }
    expect(result.id).toBe('1')
  })
})

describe('updateSchedule', () => {
  it('calls PUT /api/schedules/:id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', title: '更新' }),
    })
    await updateSchedule('1', {
      title: '更新',
      startAt: '2026-03-20T10:00:00+08:00',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/schedules/1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })
})

describe('deleteSchedule', () => {
  it('calls DELETE /api/schedules/:id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    await deleteSchedule('1')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/schedules/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
