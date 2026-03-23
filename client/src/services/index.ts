import type { Schedule, SchedulePayload } from '../types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4399'
const TIMEOUT_MS = 30_000
const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

let _deviceId: string | null = null

export function setDeviceId(id: string) {
  _deviceId = id
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (_deviceId) {
    headers['X-Device-Id'] = _deviceId
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(
        body.error || `Request failed: ${res.status}`,
        res.status,
      )
    }

    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export function registerDevice(pushToken: string | null, platform: string) {
  return request('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ pushToken, platform }),
  })
}

export function parseMessage(message: string) {
  return request('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ message, timezone: DEVICE_TIMEZONE }),
  })
}

export function listSchedules() {
  return request<Schedule[]>('/api/schedules', { method: 'GET' })
}

export function createSchedule(data: SchedulePayload) {
  return request<Schedule>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSchedule(
  id: string,
  data: Omit<SchedulePayload, 'originalMessage'>,
) {
  return request<Schedule>(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteSchedule(id: string) {
  return request(`/api/schedules/${id}`, { method: 'DELETE' })
}
