import { CorpChecker } from '../../../../src/analyzer/checkers/corp.checker';

describe('CorpChecker', () => {
  let checker: CorpChecker;

  beforeEach(() => {
    checker = new CorpChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for same-origin', () => {
    const result = checker.analyze('same-origin');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0.8 for same-site', () => {
    const result = checker.analyze('same-site');
    expect(result.grade).toBe(0.8);
  });

  it('should return grade 0.1 for cross-origin', () => {
    const result = checker.analyze('cross-origin');
    expect(result.grade).toBe(0.1);
  });

  it('should handle unrecognized values', () => {
    const result = checker.analyze('invalid-value');
    expect(result.grade).toBe(0.3);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('CORP');
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
