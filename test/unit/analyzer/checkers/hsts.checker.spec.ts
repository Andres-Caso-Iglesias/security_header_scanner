import { HstsChecker } from '../../../../src/analyzer/checkers/hsts.checker';

describe('HstsChecker', () => {
  let checker: HstsChecker;

  beforeEach(() => {
    checker = new HstsChecker();
  });

  it('should return grade 0 when HSTS header is missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for a fully configured HSTS', () => {
    const result = checker.analyze('max-age=31536000; includeSubDomains; preload');
    expect(result.present).toBe(true);
    expect(result.grade).toBe(1.0);
  });

  it('should detect insufficient max-age', () => {
    const result = checker.analyze('max-age=3600');
    expect(result.grade).toBeLessThan(1.0);
    expect(result.finding).toContain('max-age');
  });

  it('should detect missing includeSubDomains', () => {
    const result = checker.analyze('max-age=31536000');
    expect(result.grade).toBeLessThan(1.0);
    expect(result.finding).toContain('includeSubDomains');
  });

  it('should have correct name, severity and weight', () => {
    expect(checker.name).toBe('HSTS');
    expect(checker.severity).toBe('high');
    expect(checker.weight).toBe(15);
  });
});
