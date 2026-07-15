export const isPlainObject = (
  input: unknown,
): input is Record<string, unknown> =>
  input !== null && typeof input === 'object' && !Array.isArray(input);
