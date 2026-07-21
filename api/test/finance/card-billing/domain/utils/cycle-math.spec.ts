import { computeCycleForDate } from '~/finance/card-billing/domain/utils/cycle-math';

const ymd = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

describe('computeCycleForDate', () => {
  describe('typical Brazilian card (closeDay=10, dueDay=20)', () => {
    it('date on close day belongs to the invoice closing that day', () => {
      const result = computeCycleForDate(ymd(2026, 7, 10), 10, 20);
      expect(result.cycleStart).toEqual(ymd(2026, 6, 11));
      expect(result.cycleEnd).toEqual(ymd(2026, 7, 10));
      expect(result.dueDate).toEqual(ymd(2026, 7, 20));
    });

    it('date one day after close moves to the next cycle', () => {
      const result = computeCycleForDate(ymd(2026, 7, 11), 10, 20);
      expect(result.cycleStart).toEqual(ymd(2026, 7, 11));
      expect(result.cycleEnd).toEqual(ymd(2026, 8, 10));
      expect(result.dueDate).toEqual(ymd(2026, 8, 20));
    });

    it('date in the middle of a cycle', () => {
      const result = computeCycleForDate(ymd(2026, 7, 25), 10, 20);
      expect(result.cycleStart).toEqual(ymd(2026, 7, 11));
      expect(result.cycleEnd).toEqual(ymd(2026, 8, 10));
      expect(result.dueDate).toEqual(ymd(2026, 8, 20));
    });
  });

  describe('dueDay before or equal to closeDay (rolls to next month)', () => {
    it('closeDay=25, dueDay=5 → due is 5 of the month AFTER close', () => {
      const result = computeCycleForDate(ymd(2026, 7, 26), 25, 5);
      expect(result.cycleStart).toEqual(ymd(2026, 7, 26));
      expect(result.cycleEnd).toEqual(ymd(2026, 8, 25));
      expect(result.dueDate).toEqual(ymd(2026, 9, 5));
    });

    it('closeDay=10, dueDay=10 → due is 10 of the month AFTER close', () => {
      const result = computeCycleForDate(ymd(2026, 7, 11), 10, 10);
      expect(result.cycleEnd).toEqual(ymd(2026, 8, 10));
      expect(result.dueDate).toEqual(ymd(2026, 9, 10));
    });
  });

  describe('closeDay > last day of month uses last day as fallback', () => {
    it('closeDay=31, February 2026 (28 days) → close on Feb 28', () => {
      // date Feb 15, in a cycle that closes on Feb 28 (fallback from 31)
      const result = computeCycleForDate(ymd(2026, 2, 15), 31, 10);
      expect(result.cycleEnd).toEqual(ymd(2026, 2, 28));
      // due is 10 of next month after close (dueDay < closeDay so next month)
      expect(result.dueDate).toEqual(ymd(2026, 3, 10));
    });

    it('closeDay=31, April (30 days) → close on Apr 30, next cycle starts May 1', () => {
      // date May 5, right after the fallback close
      const result = computeCycleForDate(ymd(2026, 5, 5), 31, 10);
      expect(result.cycleStart).toEqual(ymd(2026, 5, 1));
      expect(result.cycleEnd).toEqual(ymd(2026, 5, 31));
      expect(result.dueDate).toEqual(ymd(2026, 6, 10));
    });

    it('closeDay=31 in leap year February (29 days) → close on Feb 29', () => {
      const result = computeCycleForDate(ymd(2028, 2, 15), 31, 10);
      expect(result.cycleEnd).toEqual(ymd(2028, 2, 29));
    });
  });

  describe('year rollover', () => {
    it('date in early January rolls back to previous December close', () => {
      const result = computeCycleForDate(ymd(2027, 1, 5), 10, 20);
      // Jan 5 is before Jan 10 (close), so belongs to cycle closing Jan 10
      expect(result.cycleStart).toEqual(ymd(2026, 12, 11));
      expect(result.cycleEnd).toEqual(ymd(2027, 1, 10));
      expect(result.dueDate).toEqual(ymd(2027, 1, 20));
    });

    it('date late December rolls forward to January close', () => {
      const result = computeCycleForDate(ymd(2026, 12, 15), 10, 20);
      expect(result.cycleStart).toEqual(ymd(2026, 12, 11));
      expect(result.cycleEnd).toEqual(ymd(2027, 1, 10));
      expect(result.dueDate).toEqual(ymd(2027, 1, 20));
    });
  });

  describe('due date fallback when dueDay > last day of due month', () => {
    it('closeDay=25, dueDay=31, closing in Feb → due Mar 31 (next month has 31)', () => {
      const result = computeCycleForDate(ymd(2026, 2, 27), 25, 31);
      expect(result.cycleEnd).toEqual(ymd(2026, 3, 25));
      // dueDay (31) > closeDay (25), so same month as close: Mar 31
      expect(result.dueDate).toEqual(ymd(2026, 3, 31));
    });

    it('closeDay=25, dueDay=31, closing in April (30 days) → due Apr 30 (fallback)', () => {
      const result = computeCycleForDate(ymd(2026, 3, 26), 25, 31);
      expect(result.cycleEnd).toEqual(ymd(2026, 4, 25));
      // dueDay 31 in April → fallback to 30
      expect(result.dueDate).toEqual(ymd(2026, 4, 30));
    });
  });
});
