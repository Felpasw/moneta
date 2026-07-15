import { SystemClock } from '~/@common/infrastructure/clock/system-clock';

describe('SystemClock', () => {
  it('returns a Date reflecting current wall-clock time', () => {
    const clock = new SystemClock();

    const before = Date.now();
    const now = clock.now();
    const after = Date.now();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });
});
