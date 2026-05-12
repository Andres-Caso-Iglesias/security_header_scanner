import { ServerHeaderChecker } from '../../../../src/analyzer/checkers/server-header.checker';

describe('ServerHeaderChecker', () => {
  let checker: ServerHeaderChecker;

  beforeEach(() => {
    checker = new ServerHeaderChecker();
  });

  it('should return grade 1.0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(1.0);
  });

  it('should grade verbose server headers as 0', () => {
    const result = checker.analyze('Apache/2.4.41 (Ubuntu)');
    expect(result.grade).toBe(0);
    expect(result.finding).toContain('leaks');
  });

  it('should grade minimal server headers as 0.5', () => {
    const result = checker.analyze('cloudflare');
    expect(result.grade).toBe(0.5);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('Server-Header');
    expect(checker.severity).toBe('low');
    expect(checker.weight).toBe(5);
  });
});
