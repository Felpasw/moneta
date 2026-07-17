export const normalizeAudioChunk = (chunk: unknown): Buffer => {
  if (Buffer.isBuffer(chunk)) return chunk;
  return Buffer.from(chunk as ArrayBuffer);
};
