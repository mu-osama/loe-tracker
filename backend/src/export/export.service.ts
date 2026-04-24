import { Injectable } from '@nestjs/common';
import Papa from 'papaparse';
import { LoeService } from '../loe/loe.service';
import { getDaysInMonth, isWeekendDate } from '../loe/loe.utils';

@Injectable()
export class ExportService {
  constructor(private loeService: LoeService) {}

  async exportUserMonthCsv(actor: { id: string; role?: string | null }, userId: string, year: number, month: number) {
    const sheet = await this.loeService.getSheetForUser(actor, userId, year, month, true);
    const days = getDaysInMonth(year, month);
    const grouped = new Map<string, typeof sheet.entries>();

    for (const entry of sheet.entries || []) {
      const key = new Date(entry.date).toISOString().slice(0, 10);
      grouped.set(key, [...(grouped.get(key) || []), entry]);
    }

    const rows: Record<string, string | number>[] = [];
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(year, month - 1, day);
      const iso = date.toISOString().slice(0, 10);
      const entries = grouped.get(iso) || [];
      const row: Record<string, string | number> = {
        Date: day,
        Day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        IsWeekend: isWeekendDate(date) ? 'Yes' : 'No',
        'Total (hrs)': entries.reduce((sum, item) => sum + Number(item.hours), 0),
        Note: entries.find((item) => item.note)?.note || '',
      };
      for (const entry of entries) {
        const key = entry.project?.name || entry.fixedCategory?.name || 'Other';
        row[`${key} (hrs)`] = Number(entry.hours);
      }
      rows.push(row);
    }
    return Papa.unparse(rows);
  }
}
