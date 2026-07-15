import axios, { isAxiosError } from 'axios';

const DEFAULT_TIMEOUT_MS = 10_000;

export const httpClient = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
});

export { isAxiosError };
