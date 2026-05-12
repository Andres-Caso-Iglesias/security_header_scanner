import { CspChecker } from '../../../../src/analyzer/checkers/csp.checker';

describe('CspChecker', () => {
  let checker: CspChecker;

  beforeEach(() => {
    checker = new CspChecker();
  });

  it('should return grade 0 when CSP header is missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(0);
    expect(result.severity).toBe('critical');
    expect(result.weight).toBe(25);
  });

  it('should return grade 1.0 for a restrictive CSP policy', () => {
    const result = checker.analyze(
      "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'",
    );
    expect(result.present).toBe(true);
    expect(result.grade).toBe(1.0);
  });

  it('should flag unsafe-inline directives', () => {
    const result = checker.analyze(
      "default-src 'self'; script-src 'self' 'unsafe-inline'",
    );
    expect(result.grade).toBeLessThanOrEqual(0.4);
    expect(result.finding).toContain('unsafe-inline');
  });

  it('should flag unsafe-eval directives', () => {
    const result = checker.analyze(
      "default-src 'self'; script-src 'self' 'unsafe-eval'",
    );
    expect(result.grade).toBeLessThanOrEqual(0.4);
    expect(result.finding).toContain('unsafe-eval');
  });

  it('should have correct name, severity and weight', () => {
    expect(checker.name).toBe('CSP');
    expect(checker.severity).toBe('critical');
    expect(checker.weight).toBe(25);
  });
});
