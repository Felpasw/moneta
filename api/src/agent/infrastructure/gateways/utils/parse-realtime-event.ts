export interface RealtimeEvent {
  readonly type: string;
  readonly [key: string]: unknown;
}

export const parseRealtimeEvent = (
  raw: Buffer | string,
): RealtimeEvent | null => {
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const type = (payload as Record<string, unknown>).type;
  if (typeof type !== 'string') return null;
  return payload as RealtimeEvent;
};
