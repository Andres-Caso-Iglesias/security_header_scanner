import { CacheControlChecker } from '../../../../src/analyzer/checkers/cache-control.checker';

describe('CacheControlChecker', () => {
  let checker: CacheControlChecker;

  beforeEach(() => {
    checker = new CacheControlChecker();
  });

  it('should return grade 0 when missing', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(0);
  });

  it('should return grade 1.0 for no-store', () => {
    const result = checker.analyze('no-store');
    expect(result.grade).toBe(1.0);
  });

  it('should grade no-cache+private as good but not perfect', () => {
    const result = checker.analyze('no-cache, private');
    expect(result.grade).toBe(0.7);
  });

  it('should grade no-cache as moderate', () => {
    const result = checker.analyze('no-cache');
    expect(result.grade).toBe(0.5);
  });

  it('should grade public as weak', () => {
    const result = checker.analyze('public, max-age=3600');
    expect(result.grade).toBe(0.2);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('Cache-Control');
    expect(checker.severity).toBe('medium');
    expect(checker.weight).toBe(10);
  });
});
