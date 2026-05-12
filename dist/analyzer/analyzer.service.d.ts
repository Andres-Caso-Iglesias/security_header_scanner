import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import { ScoreCalculator } from './score-calculator';
export interface AnalysisResult {
    headers: HeaderResult[];
    score: number;
    grade: string;
}
export declare class AnalyzerService {
    private readonly scoreCalculator;
    private readonly checkers;
    constructor(scoreCalculator: ScoreCalculator);
    analyze(rawHeaders: Record<string, string>): AnalysisResult;
}
