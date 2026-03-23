import { NextResponse } from 'next/server'

export async function parseJsonBody<T = unknown>(
  request: Request,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = await request.json()
    return { data: data as T, error: null }
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
}

const VALID_RECURRENCES = new Set(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])

export function isValidRecurrence(value: string): boolean {
  return VALID_RECURRENCES.has(value)
}

export function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}
