import { CorsChecker } from '../../../../src/analyzer/checkers/cors.checker';

describe('CorsChecker', () => {
  let checker: CorsChecker;

  beforeEach(() => {
    checker = new CorsChecker();
  });

  it('should return grade 1.0 when no CORS header (secure by default)', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(1.0);
    expect(result.present).toBe(false);
  });

  it('should return grade 1.0 for specific origin', () => {
    const result = checker.analyze('https://trusted-site.com');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0 for wildcard', () => {
    const result = checker.analyze('*');
    expect(result.grade).toBe(0);
    expect(result.finding).toContain('wildcard');
  });

  it('should return grade 0.1 for null origin', () => {
    const result = checker.analyze('null');
    expect(result.grade).toBe(0.1);
  });

  it('should have correct severity and weight', () => {
    expect(checker.severity).toBe('high');
    expect(checker.weight).toBe(15);
  });
});
