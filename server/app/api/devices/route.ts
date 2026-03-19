import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { deviceId, pushToken, platform } = body;

  if (!deviceId || !pushToken || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await sql`
    INSERT INTO devices (id, push_token, platform)
    VALUES (${deviceId}, ${pushToken}, ${platform})
    ON CONFLICT (id) DO UPDATE SET
      push_token = ${pushToken},
      platform = ${platform},
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
