import type { ParseMessageResult } from '../../types';

export async function parseMessage(message: string, endpoint: string): Promise<ParseMessageResult> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: 'service_unavailable',
    };
  }

  try {
    const payload = await response.json();

    if (!payload?.draft) {
      return {
        ok: false,
        error: 'empty_response',
      };
    }

    return {
      ok: true,
      data: payload.draft,
    };
  } catch {
    return {
      ok: false,
      error: 'invalid_format',
    };
  }
}
