import { Recurrence } from '../../constants'
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  parseMessage,
  registerDevice,
  setDeviceId,
  updateSchedule,
} from '../index'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:4399'
  setDeviceId('dev-1')
})

describe('registerDevice', () => {
  it('calls POST /api/devices with X-Device-Id header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    await registerDevice('ExponentPushToken[xxx]', 'ios')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/devices',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Device-Id': 'dev-1' }),
        body: JSON.stringify({
          pushToken: 'ExponentPushToken[xxx]',
          platform: 'ios',
        }),
      }),
    )
  })
})

describe('parseMessage', () => {
  it('calls POST /api/parse with X-Device-Id header', async () => {
    const parsed = { title: '开会', start_time: '2026-03-20T10:00:00+08:00' }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => parsed })
    const result = await parseMessage('明天十点开会')
    expect(result).toEqual(parsed)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/parse',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Device-Id': 'dev-1' }),
      }),
    )
  })

  it('throws on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'fail' }),
    })
    await expect(parseMessage('test')).rejects.toThrow()
  })
})

describe('listSchedules', () => {
  it('calls GET /api/schedules with X-Device-Id header', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    await listSchedules()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4399/api/schedules',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-Device-Id': 'dev-1' }),
      }),
    )
  })
})

describe('createSchedule', () => {
  it('calls POST /api/schedules', async () => {
    const payload = {
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', ...payload }),
    })
    const result = await createSchedule(payload)
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
      reminderMinutesBefore: 30,
      recurrence: Recurrence.NONE,
      notes: '',
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
