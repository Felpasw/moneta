import type { Clock } from '../../domain/ports/clock';

export class FixedClock implements Clock {
  private currentMs: number;

  constructor(initial: Date) {
    this.currentMs = initial.getTime();
  }

  now(): Date {
    return new Date(this.currentMs);
  }

  advance(ms: number): void {
    if (ms < 0) {
      throw new Error(
        'FixedClock.advance: ms must be >= 0 (clock only moves forward)',
      );
    }
    this.currentMs += ms;
  }
}
