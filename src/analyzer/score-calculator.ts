import { Injectable } from '@nestjs/common';
import type { HeaderResult } from '../common/interfaces/header-checker.interface';

export interface ScoreResult {
  score: number;
  grade: string;
}

@Injectable()
export class ScoreCalculator {
  private readonly MAX_POSSIBLE_SCORE = 165;

  calculate(headers: HeaderResult[]): ScoreResult {
    const totalWeightedScore = headers.reduce(
      (sum, header) => sum + header.weight * header.grade,
      0,
    );

    const score = Math.round((totalWeightedScore / this.MAX_POSSIBLE_SCORE) * 100);
    const grade = this.getGrade(score);

    return { score, grade };
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }
}
