import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [HistoryModule],
  controllers: [HealthController],
})
export class HealthModule {}
