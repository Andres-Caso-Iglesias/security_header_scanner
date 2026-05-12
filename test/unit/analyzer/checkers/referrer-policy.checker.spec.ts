import { ReferrerPolicyChecker } from '../../../../src/analyzer/checkers/referrer-policy.checker';

describe('ReferrerPolicyChecker', () => {
  let checker: ReferrerPolicyChecker;

  beforeEach(() => {
    checker = new ReferrerPolicyChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for strict policies', () => {
    const strictPolicies = [
      'no-referrer',
      'strict-origin-when-cross-origin',
      'same-origin',
    ];
    for (const policy of strictPolicies) {
      const result = checker.analyze(policy);
      expect(result.grade).toBe(1.0);
    }
  });

  it('should return grade 0.3 for unsafe-url', () => {
    const result = checker.analyze('unsafe-url');
    expect(result.grade).toBe(0.3);
  });

  it('should have correct severity and weight', () => {
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
