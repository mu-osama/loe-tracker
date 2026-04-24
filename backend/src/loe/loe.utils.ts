export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function isWeekendDate(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getWorkingDates(year: number, month: number) {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => new Date(year, month - 1, index + 1)).filter(
    (date) => !isWeekendDate(date),
  );
}

export function getMonthDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

export function calculateUtilizationPercent(totalHours: number, workingDays: number) {
  if (!workingDays) {
    return 0;
  }
  return Number(((totalHours / (workingDays * 8)) * 100).toFixed(2));
}

