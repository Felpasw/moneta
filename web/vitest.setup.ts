import "@testing-library/jest-dom/vitest";

/* Node ≤24 ainda não expõe Uint8Array.prototype.toBase64 sem flag; jsdom
 * também não. Browsers modernos têm nativamente (Baseline 2024). */
if (typeof Uint8Array.prototype.toBase64 !== "function") {
  Object.defineProperty(Uint8Array.prototype, "toBase64", {
    value(this: Uint8Array): string {
      return Buffer.from(this).toString("base64");
    },
  });
}
