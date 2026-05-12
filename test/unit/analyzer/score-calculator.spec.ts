import { ScoreCalculator } from '../../../src/analyzer/score-calculator';
import { HeaderResult } from '../../../src/common/interfaces/header-checker.interface';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  function makeHeader(weight: number, grade: number): HeaderResult {
    return {
      header: 'Test',
      present: grade > 0,
      value: null,
      expected: 'test',
      grade,
      severity: 'medium',
      weight,
      finding: 'test',
      recommendation: 'test',
    };
  }

  it('should return 100 for all perfect headers', () => {
    const headers: HeaderResult[] = [
      makeHeader(25, 1.0), makeHeader(15, 1.0), makeHeader(15, 1.0),
      makeHeader(10, 1.0), makeHeader(10, 1.0), makeHeader(10, 1.0),
      makeHeader(10, 1.0), makeHeader(15, 1.0), makeHeader(15, 1.0),
      makeHeader(10, 1.0), makeHeader(10, 1.0), makeHeader(5, 1.0),
      makeHeader(5, 1.0), makeHeader(5, 1.0), makeHeader(5, 1.0),
    ];
    const result = calculator.calculate(headers);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A');
  });

  it('should return 0 for all missing headers', () => {
    const headers: HeaderResult[] = [
      makeHeader(25, 0), makeHeader(15, 0), makeHeader(15, 0),
      makeHeader(10, 0), makeHeader(10, 0), makeHeader(10, 0),
      makeHeader(10, 0), makeHeader(15, 0), makeHeader(15, 0),
      makeHeader(10, 0), makeHeader(10, 0), makeHeader(5, 0),
      makeHeader(5, 0), makeHeader(5, 0), makeHeader(5, 0),
    ];
    const result = calculator.calculate(headers);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('F');
  });

  it('should grade correctly based on score ranges', () => {
    const allPerfect: HeaderResult[] = [
      makeHeader(25, 1.0), makeHeader(15, 1.0), makeHeader(15, 1.0),
      makeHeader(10, 1.0), makeHeader(10, 1.0), makeHeader(10, 1.0),
      makeHeader(10, 1.0), makeHeader(15, 1.0), makeHeader(15, 1.0),
      makeHeader(10, 1.0), makeHeader(10, 1.0), makeHeader(5, 1.0),
      makeHeader(5, 1.0), makeHeader(5, 1.0), makeHeader(5, 1.0),
    ];

    const halfHeaders = allPerfect.map(h => makeHeader(h.weight, 0.5));
    const result = calculator.calculate(halfHeaders);
    expect(result.score).toBe(50);
    expect(result.grade).toBe('E');
  });
});
