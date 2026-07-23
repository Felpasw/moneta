import { describe, expect, it } from "vitest";

import { float32ToPcm16Base64 } from "@/utils/pcm";

describe("float32ToPcm16Base64()", () => {
  it("retorna string vazia pra Float32Array vazia", () => {
    expect(float32ToPcm16Base64(new Float32Array(0))).toBe("");
  });

  it("codifica zeros como Int16 zero (little-endian)", () => {
    const samples = new Float32Array([0, 0]);
    const decoded = atob(float32ToPcm16Base64(samples));
    expect(decoded).toBe("\x00\x00\x00\x00");
  });

  it("mapeia +1.0 pra 0x7fff (little-endian)", () => {
    const samples = new Float32Array([1.0]);
    const decoded = atob(float32ToPcm16Base64(samples));
    expect(decoded).toBe("\xff\x7f");
  });

  it("mapeia -1.0 pra 0x8000 (little-endian)", () => {
    const samples = new Float32Array([-1.0]);
    const decoded = atob(float32ToPcm16Base64(samples));
    expect(decoded).toBe("\x00\x80");
  });

  it("faz clamp de valores acima de +1", () => {
    const samples = new Float32Array([2.5]);
    const decoded = atob(float32ToPcm16Base64(samples));
    expect(decoded).toBe("\xff\x7f");
  });

  it("faz clamp de valores abaixo de -1", () => {
    const samples = new Float32Array([-3.0]);
    const decoded = atob(float32ToPcm16Base64(samples));
    expect(decoded).toBe("\x00\x80");
  });
});
