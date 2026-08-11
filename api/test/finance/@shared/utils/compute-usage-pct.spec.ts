import { computeUsagePct } from '~/finance/@shared/utils/compute-usage-pct';

describe('computeUsagePct', () => {
  it('returns 0 when the cap is null', () => {
    expect(computeUsagePct(50, null)).toBe(0);
  });

  it('returns 0 when the cap is zero or negative', () => {
    expect(computeUsagePct(50, 0)).toBe(0);
    expect(computeUsagePct(50, -100)).toBe(0);
  });

  it('returns a percentage rounded to the nearest integer', () => {
    // 100 / 300 = 0.3333... -> 33
    expect(computeUsagePct(100, 300)).toBe(33);
    // 200 / 300 = 0.6666... -> 67
    expect(computeUsagePct(200, 300)).toBe(67);
  });

  it('caps at 100 when used exceeds cap', () => {
    expect(computeUsagePct(150, 100)).toBe(100);
    expect(computeUsagePct(999999, 100)).toBe(100);
  });

  it('returns 100 exactly when used equals cap', () => {
    expect(computeUsagePct(500, 500)).toBe(100);
  });

  it('returns 0 when used is zero', () => {
    expect(computeUsagePct(0, 500)).toBe(0);
  });
});
