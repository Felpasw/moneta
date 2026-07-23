const BYTES_PER_INT16 = 2;
const INT16_POSITIVE_MAX = 0x7fff;
const INT16_NEGATIVE_MAX = 0x8000;
const LITTLE_ENDIAN = true;

export function float32ToPcm16Base64(samples: Float32Array): string {
  if (samples.length === 0) return "";
  const buffer = new ArrayBuffer(samples.length * BYTES_PER_INT16);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 =
      clamped < 0 ? clamped * INT16_NEGATIVE_MAX : clamped * INT16_POSITIVE_MAX;
    view.setInt16(i * BYTES_PER_INT16, int16, LITTLE_ENDIAN);
  }
  return new Uint8Array(buffer).toBase64();
}
