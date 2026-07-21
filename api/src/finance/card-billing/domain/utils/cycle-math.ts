import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { CycleBoundaries } from '../types/cycle-boundaries';

dayjs.extend(utc);

const clampToMonth = (base: dayjs.Dayjs, day: number): dayjs.Dayjs =>
  base.date(Math.min(day, base.daysInMonth()));

export const computeCycleForDate = (
  date: Date,
  closeDay: number,
  dueDay: number,
): CycleBoundaries => {
  const d = dayjs.utc(date);
  const closeThisMonth = clampToMonth(d.startOf('month'), closeDay);

  let cycleEnd = closeThisMonth;
  if (d.isAfter(closeThisMonth, 'day')) {
    cycleEnd = clampToMonth(d.add(1, 'month').startOf('month'), closeDay);
  }

  const previousClose = clampToMonth(
    cycleEnd.subtract(1, 'month').startOf('month'),
    closeDay,
  );
  const cycleStart = previousClose.add(1, 'day');

  let dueMonthOffset = 0;
  if (dueDay <= closeDay) dueMonthOffset = 1;
  const dueDate = clampToMonth(
    cycleEnd.add(dueMonthOffset, 'month').startOf('month'),
    dueDay,
  );

  return {
    cycleStart: cycleStart.toDate(),
    cycleEnd: cycleEnd.toDate(),
    dueDate: dueDate.toDate(),
  };
};
