import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { LoeResolver } from './loe.resolver';
import { LoeService } from './loe.service';

@Module({
  imports: [EmailModule, RealtimeModule, NotificationsModule],
  providers: [LoeResolver, LoeService],
  exports: [LoeService],
})
export class LoeModule {}
