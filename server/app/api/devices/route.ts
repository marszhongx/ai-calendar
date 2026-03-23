import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireDeviceId } from '@/lib/device-id'
import { parseJsonBody } from '@/lib/validate'

export async function POST(request: Request) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { pushToken, platform } = body as {
    pushToken?: string
    platform?: string
  }

  if (!platform) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  await db
    .insert(schema.devices)
    .values({ id: deviceId, pushToken: pushToken ?? null, platform })
    .onConflictDoUpdate({
      target: schema.devices.id,
      set: { pushToken: pushToken ?? null, platform, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
