import { isPlainObject } from './utils/is-plain-object';
import { REDACTED, maskTail } from './utils/mask-tail';

const alwaysRedact = (): string => REDACTED;

const KEY_MASKERS: Record<string, (value: unknown) => unknown> = {
  password: alwaysRedact,
  hash: alwaysRedact,
  accessToken: alwaysRedact,
  access_token: alwaysRedact,
  refresh_token_hash: alwaysRedact,
  authorization: alwaysRedact,
  cookie: alwaysRedact,
  refreshToken: maskTail,
  refresh_token: maskTail,
};

const maskEntry = (key: string, value: unknown): unknown => {
  const masker = KEY_MASKERS[key];
  if (masker) return masker(value);
  return redactSecrets(value);
};

export const redactSecrets = (input: unknown): unknown => {
  if (Array.isArray(input)) return input.map(redactSecrets);
  if (!isPlainObject(input)) return input;
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, maskEntry(key, value)]),
  );
};
