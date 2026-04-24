export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function isWeekend(year: number, month: number, day: number) {
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 || weekday === 6;
}

export function getWorkingDays(year: number, month: number) {
  const totalDays = getDaysInMonth(year, month);
  let workingDays = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    if (!isWeekend(year, month, day)) {
      workingDays += 1;
    }
  }
  return workingDays;
}

export function utilization(totalHours: number, year: number, month: number) {
  const expected = getWorkingDays(year, month) * 8;
  return expected ? Number(((totalHours / expected) * 100).toFixed(1)) : 0;
}

