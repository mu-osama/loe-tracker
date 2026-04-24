import { Module } from '@nestjs/common';
import { RealtimeResolver } from './realtime.resolver';
import { RealtimeService } from './realtime.service';

@Module({
  providers: [RealtimeResolver, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
