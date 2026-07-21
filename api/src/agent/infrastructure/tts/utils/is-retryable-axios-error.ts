import { isAxiosError } from '~/config/http';

const RETRYABLE_MIN_STATUS = 500;

export const isRetryableAxiosError = (err: unknown): boolean => {
  if (!isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === undefined) return false;
  return status >= RETRYABLE_MIN_STATUS;
};
