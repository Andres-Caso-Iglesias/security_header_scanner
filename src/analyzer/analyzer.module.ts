import { Module } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { ScoreCalculator } from './score-calculator';

@Module({
  providers: [AnalyzerService, ScoreCalculator],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
