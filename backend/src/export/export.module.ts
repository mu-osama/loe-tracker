import { Module } from '@nestjs/common';
import { LoeModule } from '../loe/loe.module';
import { ExportResolver } from './export.resolver';
import { ExportService } from './export.service';

@Module({
  imports: [LoeModule],
  providers: [ExportService, ExportResolver],
  exports: [ExportService],
})
export class ExportModule {}
