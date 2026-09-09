const BYTES_PER_INT16 = 2;
const INT16_POSITIVE_MAX = 0x7fff;
const INT16_NEGATIVE_MAX = 0x8000;
const LITTLE_ENDIAN = true;
const BTOA_CHUNK = 0x8000;

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BTOA_CHUNK) {
    const chunk = bytes.subarray(i, i + BTOA_CHUNK);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

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
  return uint8ToBase64(new Uint8Array(buffer));
}
