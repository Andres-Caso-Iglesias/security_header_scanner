import { XFrameOptionsChecker } from '../../../../src/analyzer/checkers/x-frame-options.checker';

describe('XFrameOptionsChecker', () => {
  let checker: XFrameOptionsChecker;

  beforeEach(() => {
    checker = new XFrameOptionsChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
    expect(result.present).toBe(false);
  });

  it('should return grade 1.0 for DENY', () => {
    const result = checker.analyze('DENY');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0.8 for SAMEORIGIN', () => {
    const result = checker.analyze('SAMEORIGIN');
    expect(result.grade).toBe(0.8);
  });

  it('should be case-insensitive', () => {
    const result = checker.analyze('deny');
    expect(result.grade).toBe(1.0);
  });

  it('should have correct name, severity and weight', () => {
    expect(checker.name).toBe('X-Frame-Options');
    expect(checker.severity).toBe('high');
    expect(checker.weight).toBe(15);
  });
});
