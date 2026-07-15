const TAIL_CHARS = 6;

export const REDACTED = '***';

export const maskTail = (value: unknown): string => {
  if (typeof value !== 'string' || value.length <= TAIL_CHARS) return REDACTED;
  return `${REDACTED}${value.slice(-TAIL_CHARS)}`;
};
