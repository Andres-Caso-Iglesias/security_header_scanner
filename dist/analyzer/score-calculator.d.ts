import type { HeaderResult } from '../common/interfaces/header-checker.interface';
export interface ScoreResult {
    score: number;
    grade: string;
}
export declare class ScoreCalculator {
    private readonly MAX_POSSIBLE_SCORE;
    calculate(headers: HeaderResult[]): ScoreResult;
    private getGrade;
}
