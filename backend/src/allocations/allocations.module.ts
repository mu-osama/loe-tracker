import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { AllocationsResolver } from './allocations.resolver';
import { AllocationsService } from './allocations.service';

@Module({
  imports: [RealtimeModule],
  providers: [AllocationsResolver, AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
