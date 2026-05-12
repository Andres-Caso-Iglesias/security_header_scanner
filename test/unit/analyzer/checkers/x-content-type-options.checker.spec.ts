import { XContentTypeOptionsChecker } from '../../../../src/analyzer/checkers/x-content-type-options.checker';

describe('XContentTypeOptionsChecker', () => {
  let checker: XContentTypeOptionsChecker;

  beforeEach(() => {
    checker = new XContentTypeOptionsChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for nosniff', () => {
    const result = checker.analyze('nosniff');
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 0.3 for invalid value', () => {
    const result = checker.analyze('sniff');
    expect(result.grade).toBe(0.3);
  });

  it('should have correct name, severity and weight', () => {
    expect(checker.name).toBe('X-Content-Type-Options');
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
