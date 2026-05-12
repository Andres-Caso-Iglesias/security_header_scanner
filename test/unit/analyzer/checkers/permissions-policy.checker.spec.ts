import { PermissionsPolicyChecker } from '../../../../src/analyzer/checkers/permissions-policy.checker';

describe('PermissionsPolicyChecker', () => {
  let checker: PermissionsPolicyChecker;

  beforeEach(() => {
    checker = new PermissionsPolicyChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(0);
  });

  it('should grade present policy with sensitive APIs covered', () => {
    const result = checker.analyze('geolocation=(self), camera=(self)');
    expect(result.grade).toBe(0.8);
  });

  it('should grade restricted policy correctly', () => {
    const result = checker.analyze('geolocation=(self), camera=(self), microphone=(self)');
    expect(result.grade).toBeGreaterThanOrEqual(0.8);
  });

  it('should flag missing sensitive API restrictions', () => {
    const result = checker.analyze('picture-in-picture=(self)');
    expect(result.grade).toBe(0.5);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('Permissions-Policy');
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
