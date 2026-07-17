import { isAxiosError } from '~/config/http';

export const wrapTtsError = (err: unknown): Error => {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === undefined) {
      return new Error('TTS request failed: network_error');
    }
    return new Error(`TTS request failed: HTTP ${status}`);
  }
  if (err instanceof Error) return err;
  return new Error('TTS request failed');
};
