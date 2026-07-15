import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';

describe('FixedClock', () => {
  const initial = new Date('2026-01-01T00:00:00.000Z');

  it('returns the initial date until advanced', () => {
    const clock = new FixedClock(initial);

    expect(clock.now().toISOString()).toBe(initial.toISOString());
  });

  it('returns a new Date instance each call (no mutable shared reference)', () => {
    const clock = new FixedClock(initial);
    const first = clock.now();
    const second = clock.now();

    expect(first).not.toBe(second);
    expect(first.getTime()).toBe(second.getTime());
  });

  it('advances by the given milliseconds', () => {
    const clock = new FixedClock(initial);

    clock.advance(60_000);

    expect(clock.now().toISOString()).toBe('2026-01-01T00:01:00.000Z');
  });

  it('accumulates advances', () => {
    const clock = new FixedClock(initial);

    clock.advance(1_000);
    clock.advance(2_000);

    expect(clock.now().getTime() - initial.getTime()).toBe(3_000);
  });

  it('rejects negative advance (must move forward)', () => {
    const clock = new FixedClock(initial);

    expect(() => clock.advance(-1)).toThrow(/advance/i);
  });
});
