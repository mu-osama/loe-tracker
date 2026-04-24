import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LoeService } from '../loe/loe.service';

@Injectable()
export class LoeReminderScheduler {
  constructor(
    private loeService: LoeService,
    private config: ConfigService,
  ) {}

  @Cron(process.env.REMINDER_CRON_EXPRESSION || '0 9 24 * *')
  async sendSubmissionReminders() {
    await this.loeService.sendReminderEmails();
  }

  @Cron(process.env.DELAY_CHECK_CRON_EXPRESSION || '5 0 1 * *')
  async markDelayedSheets() {
    await this.loeService.markDelayedSheets();
  }
}

