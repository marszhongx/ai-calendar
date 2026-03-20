import { db, schema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { deviceId, pushToken, platform } = body;

  if (!deviceId || !pushToken || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await db
    .insert(schema.devices)
    .values({ id: deviceId, pushToken, platform })
    .onConflictDoUpdate({
      target: schema.devices.id,
      set: { pushToken, platform, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
