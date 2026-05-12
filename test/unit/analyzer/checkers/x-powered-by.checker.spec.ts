import { XPoweredByChecker } from '../../../../src/analyzer/checkers/x-powered-by.checker';

describe('XPoweredByChecker', () => {
  let checker: XPoweredByChecker;

  beforeEach(() => {
    checker = new XPoweredByChecker();
  });

  it('should return grade 1.0 when missing (secure by default)', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0 when present', () => {
    const result = checker.analyze('Express');
    expect(result.present).toBe(true);
    expect(result.grade).toBe(0);
    expect(result.finding).toContain('technology');
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('X-Powered-By');
    expect(checker.severity).toBe('low');
    expect(checker.weight).toBe(5);
  });
});
