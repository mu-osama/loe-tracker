import { Module } from '@nestjs/common';
import { LoeModule } from '../loe/loe.module';
import { LoeReminderScheduler } from './loe-reminder.scheduler';

@Module({
  imports: [LoeModule],
  providers: [LoeReminderScheduler],
})
export class SchedulerModule {}
