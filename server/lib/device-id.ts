import { NextResponse } from 'next/server'

export function getDeviceId(request: Request): string | null {
  return request.headers.get('x-device-id')
}

export function requireDeviceId(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return {
      deviceId: null as never,
      error: NextResponse.json(
        { error: 'Missing X-Device-Id header' },
        { status: 401 },
      ),
    }
  }
  return { deviceId, error: null }
}
