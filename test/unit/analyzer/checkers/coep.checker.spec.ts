import { CoepChecker } from '../../../../src/analyzer/checkers/coep.checker';

describe('CoepChecker', () => {
  let checker: CoepChecker;

  beforeEach(() => {
    checker = new CoepChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for require-corp', () => {
    const result = checker.analyze('require-corp');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0.6 for credentialless', () => {
    const result = checker.analyze('credentialless');
    expect(result.grade).toBe(0.6);
  });

  it('should return grade 0 for unsafe-none', () => {
    const result = checker.analyze('unsafe-none');
    expect(result.grade).toBe(0);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('COEP');
    expect(checker.severity).toBe('low');
    expect(checker.weight).toBe(5);
  });
});
