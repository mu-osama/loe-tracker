import { BadRequestException } from '@nestjs/common';
import { getMonthDate, getWorkingDates } from './loe.utils';

export function validateNoWeekendEntry(year: number, month: number, day: number) {
  const date = getMonthDate(year, month, day);
  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) {
    throw new BadRequestException('Cannot log hours on a weekend');
  }
}

export function validateSubmissionCoverage(
  year: number,
  month: number,
  totalsByDate: Map<string, number>,
) {
  const missing = getWorkingDates(year, month)
    .filter((date) => (totalsByDate.get(date.toISOString().slice(0, 10)) || 0) <= 0)
    .map((date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

  if (missing.length) {
    throw new BadRequestException(`Missing entries for: ${missing.join(', ')}`);
  }
}

