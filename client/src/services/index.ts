const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4399'
const TIMEOUT_MS = 30_000

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

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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

export function registerDevice(
  deviceId: string,
  pushToken: string | null,
  platform: string,
) {
  return request('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceId, pushToken, platform }),
  })
}

export function parseMessage(message: string, deviceId: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return request('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ message, deviceId, timezone }),
  })
}

export function listSchedules(deviceId: string) {
  return request(`/api/schedules?deviceId=${deviceId}`, { method: 'GET' })
}

export function createSchedule(data: Record<string, unknown>) {
  return request('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSchedule(id: string, data: Record<string, unknown>) {
  return request(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteSchedule(id: string) {
  return request(`/api/schedules/${id}`, { method: 'DELETE' })
}
