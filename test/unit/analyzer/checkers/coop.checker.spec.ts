import { CoopChecker } from '../../../../src/analyzer/checkers/coop.checker';

describe('CoopChecker', () => {
  let checker: CoopChecker;

  beforeEach(() => {
    checker = new CoopChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for same-origin', () => {
    const result = checker.analyze('same-origin');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0.6 for same-origin-allow-popups', () => {
    const result = checker.analyze('same-origin-allow-popups');
    expect(result.grade).toBe(0.6);
  });

  it('should return grade 0 for unsafe-none', () => {
    const result = checker.analyze('unsafe-none');
    expect(result.grade).toBe(0);
  });

  it('should handle unrecognized values', () => {
    const result = checker.analyze('random-value');
    expect(result.grade).toBe(0.3);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('COOP');
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
