import { Test } from '@nestjs/testing';

import { CLOCK, type Clock } from '~/@common/domain/ports/clock';
import { ClockModule } from '~/@common/infrastructure/clock/clock.module';
import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';

class ExpiryChecker {
  constructor(private readonly clock: Clock) {}

  isExpired(expiresAt: Date): boolean {
    return this.clock.now().getTime() >= expiresAt.getTime();
  }
}

describe('ClockModule', () => {
  it('provides SystemClock by default under the CLOCK token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClockModule],
    }).compile();

    const clock = moduleRef.get<Clock>(CLOCK);

    expect(clock.now()).toBeInstanceOf(Date);
  });

  it('is swappable with FixedClock for deterministic expiry checks', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    const clock = new FixedClock(start);
    const checker = new ExpiryChecker(clock);

    const in15Min = new Date(start.getTime() + 15 * 60_000);

    expect(checker.isExpired(in15Min)).toBe(false);

    clock.advance(15 * 60_000);
    expect(checker.isExpired(in15Min)).toBe(true);

    clock.advance(1);
    expect(checker.isExpired(in15Min)).toBe(true);
  });
});
